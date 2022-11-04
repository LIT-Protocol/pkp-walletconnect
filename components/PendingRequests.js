import RequestCard from './RequestCard';

export default function PendingRequests({ wcRequests }) {
  return (
    <>
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
    </>
  );
}
