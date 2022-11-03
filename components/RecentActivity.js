import ResultCard from './ResultCard';

export default function RecentActivity({ wcResults }) {
  return (
    <div className="section">
      <h4 className="section__title">Recent Activity ({wcResults.length})</h4>
      {wcResults.length > 0 ? (
        wcResults.map((result, index) => (
          <ResultCard
            key={`${result.status}-${result.payload?.method}-${index}`}
            result={result}
          />
        ))
      ) : (
        <div className="empty-state">
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
}
