function PulseCard({ ticker, pulse, explanation }) {
  return (
    <div className="card">
      <h2 className="mb-2">{ticker} is <span className="text-accent uppercase">{pulse}</span></h2>
      <div className="explanation-text">
        {explanation.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

export default PulseCard;