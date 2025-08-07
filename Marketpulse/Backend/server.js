import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const STOCK_API_KEY = process.env.STOCK_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// === 1. Raw Stock Data ===
app.post('/api/stock-data', async (req, res) => {
  try {
    const { ticker } = req.body;

    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: ticker,
        apikey: STOCK_API_KEY
      }
    });

    const rawData = response.data['Time Series (Daily)'];
    if (!rawData) {
      return res.status(400).json({ error: 'Invalid ticker or API limit reached' });
    }

    const history = Object.entries(rawData).slice(0, 7).map(([date, values]) => ({
      date,
      close: parseFloat(values['4. close'])
    })).reverse();

    res.json({ ticker, history });

  } catch (error) {
    console.error('Stock API error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// === 2. Gemini Analysis on History ===
app.post('/api/stock-insight', async (req, res) => {
  try {
    const { history } = req.body;

    const prompt = `
      Analyze this stock price history:
      ${JSON.stringify(history)}

      What trends do you observe? Any predictions or insights?
    `;

    const geminiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY } }
    );

    const output = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No insights returned.';
    res.json({ insight: output });

  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Gemini insight' });
  }
});

// === 3. Market Pulse (Final Combined Endpoint) ===
app.get('/api/market-pulse', async (req, res) => {
  const ticker = req.query.ticker?.toUpperCase();
  if (!ticker) return res.status(400).json({ error: 'Ticker is required' });

  try {
    // === A. Fetch price data ===
    const stockRes = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: ticker,
        apikey: STOCK_API_KEY
      }
    });

    const rawData = stockRes.data['Time Series (Daily)'];
    if (!rawData) {
      return res.status(400).json({ error: 'Invalid ticker or API limit reached' });
    }

    const closes = Object.entries(rawData).slice(0, 6).map(([_, v]) => parseFloat(v['4. close'])).reverse();
    const returns = closes.slice(1).map((c, i) => +((c - closes[i]) / closes[i] * 100).toFixed(2));
    const score = +(returns.reduce((a, b) => a + b, 0) / returns.length).toFixed(2);

    // === B. Get Live News Data ===
    const newsRes = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: ticker,
        sortBy: 'publishedAt',
        language: 'en',
        apiKey: NEWS_API_KEY,
        pageSize: 5
      }
    });

    const news = newsRes.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url
    }));

    // === C. Ask Gemini for "pulse" ===
    const prompt = `
      Given the following data for stock ${ticker}:

      - 5-day returns: ${JSON.stringify(returns)}
      - Average momentum score: ${score}
      - Latest news: ${news.map(n => n.title + ' — ' + n.description).join('\n')}

      Based on this, is the market pulse bullish, neutral, or bearish?
      Explain your reasoning briefly.
    `;

    const geminiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY } }
    );

    const explanation = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No explanation returned.';
    const pulse = /bullish|neutral|bearish/i.exec(explanation)?.[0]?.toLowerCase() || 'neutral';

    res.json({
      ticker,
      as_of: new Date().toISOString().split('T')[0],
      momentum: { returns, score },
      news,
      pulse,
      llm_explanation: explanation
    });

  } catch (error) {
    console.error('Market Pulse error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch market pulse' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
