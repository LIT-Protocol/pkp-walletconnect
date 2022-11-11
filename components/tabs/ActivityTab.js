import ResultCard from '../ResultCard';

export default function ActivityTab({ wcResults }) {
  return (
    <div className="tab">
      <h2 className="tab__title">Recent activity</h2>
      {Object.keys(wcResults).length > 0 ? (
        Object.keys(wcResults).map((key, index) => (
          <ResultCard key={key} request={wcResults[key]} />
        ))
      ) : (
        <div className="empty-state">
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
}
