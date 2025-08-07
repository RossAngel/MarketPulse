import "./styles.css";
function TickerInput({ ticker, setTicker, onSubmit }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSubmit();
  };

  return (
    <div className="input-group">
      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        placeholder="Enter Stock Ticker (e.g., AAPL)"
        className="input"
      />
      <button
        onClick={onSubmit}
        className="btn btn-accent"
      >
        <i className="fas fa-chart-line"></i> Analyze
      </button>
    </div>
  );
}

export default TickerInput;