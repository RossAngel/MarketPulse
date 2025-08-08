MarketPulse - MERN Stack Stock Sentiment Analyzer

Setup

Backend:
1. Navigate to the backend directory.
2. Install dependencies: npm install
3. Set up .env file with the following:
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   GEMINI_API_KEY=your_gemini_api_key
4. Start the server: node server.js

Frontend:
1. Navigate to the frontend directory.
2. Install dependencies: npm install
3. Start the development server: npm run dev

API Specification

GET /api/v1/market-pulse?ticker=SYMBOL
- Description: Fetches market pulse for the given stock ticker.
- Query Parameters:
  - ticker (required): Stock ticker symbol (e.g., AAPL, MSFT)
- Response:
  {
    pulse: "bullish" | "bearish" | "neutral",
    explanation: "AI-generated sentiment based on news and momentum signals",
    signals: {
      momentum: { /* Alpha Vantage data */ },
      news: [ "headline1", "headline2", ... ]
    }
  }

Design Trade-offs

- Used Alpha Vantage free tier: subject to rate limiting.
- Used Gemini free LLM for sentiment analysis: simple prompt, no fine-tuning.
- Frontend is lightweight, focused on clarity and functionality.

Next Steps

- Improve Gemini prompt engineering for more reliable analysis.
- Add loading states, error handling, and visual feedback to UI.
- Style and brand the frontend to match target UX goals.
- Add historical trends and charting support.
- Optionally replace Gemini with OpenAI or Claude for more stable APIs.
