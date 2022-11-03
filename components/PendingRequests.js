import RequestCard from './RequestCard';

export default function PendingRequests({ wcRequests }) {
  return (
    <div className="section">
      <h4 className="section__title">Pending Requests ({wcRequests.length})</h4>
      {wcRequests.length > 0 ? (
        wcRequests.map((request, index) => (
          <RequestCard
            key={`pending-${request.payload?.method}-${index}`}
            request={request}
          />
        ))
      ) : (
        <div className="empty-state">
          <p>No pending requests</p>
        </div>
      )}
    </div>
  );
}
