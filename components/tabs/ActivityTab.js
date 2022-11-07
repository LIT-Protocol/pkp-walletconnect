import RequestCard from '../RequestCard';

export default function ActivityTab({ wcRequests }) {
  return (
    <div className="tab">
      <h2 className="tab__title">Recent activity</h2>
      {Object.keys(wcRequests).length > 0 ? (
        Object.keys(wcRequests).map((key, index) => (
          <RequestCard key={key} request={wcRequests[key]} />
        ))
      ) : (
        <div className="empty-state">
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
}
