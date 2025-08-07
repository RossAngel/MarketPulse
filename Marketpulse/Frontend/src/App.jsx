import { useState } from "react";
import TickerInput from "./components/TickerInput";
import PulseCard from "./components/PulseCard";
import Sparkline from "./components/Sparkline";
import JsonViewer from "./components/JsonViewer";
import "./components/styles.css";

function App() {
  const [ticker, setTicker] = useState("");
  const [pulseData, setPulseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setPulseData(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/market-pulse?ticker=${ticker}`
      );
      const data = await response.json();

      if (response.ok) {
        setPulseData(data);
      } else {
        setError(data.error || "Failed to fetch market pulse.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="text-center mb-4">Market Pulse</h1>

      <TickerInput ticker={ticker} setTicker={setTicker} onSubmit={handleSubmit} />

      {loading && (
        <div className="text-center mt-4">
          <i className="fas fa-spinner fa-spin fa-2x"></i>
          <p className="mt-2">Fetching pulse...</p>
        </div>
      )}
      {error && <p className="text-center mt-4 text-accent">{error}</p>}

      {pulseData && (
        <>
          <PulseCard
            ticker={pulseData.ticker}
            pulse={pulseData.pulse}
            explanation={pulseData.llm_explanation}
          />
          <div className="chart-container mt-4">
            <Sparkline data={pulseData.momentum.returns} />
          </div>
          <div className="mt-4">
            <JsonViewer data={pulseData} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;