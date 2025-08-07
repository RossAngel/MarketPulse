import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const router = express.Router();

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Helper to calculate returns
function getDailyReturns(prices) {
  let returns = [];
  for (let i = 1; i < prices.length; i++) {
    const r = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(parseFloat(r.toFixed(4)));
  }
  const score = parseFloat((returns.reduce((a, b) => a + b, 0) / returns.length).toFixed(4));
  return { returns, score };
}

// === POST /api/market-pulse (LLM via SDK, simple explanation)
router.post("/", async (req, res) => {
  try {
    const { ticker } = req.body;

    if (!ticker || typeof ticker !== "string") {
      return res.status(400).json({ error: "Invalid ticker symbol." });
    }

    const prompt = `
You are a stock market expert. Provide a short, insightful explanation of the current market sentiment and key highlights for the stock symbol "${ticker.toUpperCase()}". Be concise and explain in simple terms.

Do not include financial advice. Use plain English, no jargon.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ explanation: text });
  } catch (err) {
    console.error("❌ Error in Gemini route:", err.message);
    res.status(500).json({ error: "Failed to get market pulse." });
  }
});

// === GET /api/market-pulse?ticker=AAPL (Full insight route)
router.get("/", async (req, res) => {
  const ticker = req.query.ticker?.toUpperCase();
  if (!ticker) return res.status(400).json({ error: "Ticker is required" });

  try {
    // Get prices
    const alphaUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const alphaRes = await axios.get(alphaUrl);
    const timeSeries = alphaRes.data["Time Series (Daily)"];
    if (!timeSeries) {
      return res.status(500).json({ error: "Invalid ticker or Alpha Vantage limit exceeded" });
    }

    const dates = Object.keys(timeSeries).sort((a, b) => new Date(b) - new Date(a));
    const closes = dates.slice(0, 6).map(date => parseFloat(timeSeries[date]["4. close"]));
    const momentum = getDailyReturns(closes);

    // Get news
    const newsUrl = `https://newsapi.org/v2/everything?q=${ticker}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`;
    const newsRes = await axios.get(newsUrl);
    const articles = newsRes.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
    }));

    // Compose Gemini prompt
    const llmPrompt = `
You are a stock sentiment analyst. Based on the momentum score and recent headlines, decide if the stock pulse is bullish, neutral, or bearish.

Ticker: ${ticker}
5-day momentum returns: ${momentum.returns.join(", ")}
Momentum score: ${momentum.score}

Latest headlines:
${articles.map((a, i) => `${i + 1}. ${a.title} - ${a.description}`).join("\n")}

Respond with a JSON like:
{
  "pulse": "bullish",
  "llm_explanation": "..."
}
`;

    const geminiRes = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: llmPrompt }] }]
    });

    const llmText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
    const llmJson = JSON.parse(llmText);

    const response = {
      ticker,
      as_of: dates[0],
      momentum,
      news: articles,
      pulse: llmJson.pulse,
      llm_explanation: llmJson.llm_explanation,
    };

    res.json(response);
  } catch (err) {
    console.error("❌ Error in GET /market-pulse:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;
