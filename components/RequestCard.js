export default function RequestCard({ request }) {
  return (
    <div className="request-card">
      <p>{request.payload?.method}</p>
    </div>
  );
}
