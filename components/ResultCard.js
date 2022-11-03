export default function RequestCard({ result }) {
  return (
    <div className="result-card">
      <p>{result.payload?.method}</p>
      <span className="result-card__badge">{result.status}</span>
    </div>
  );
}
