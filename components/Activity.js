import ResultCard from './ResultCard';

export default function Activity({ wcResults }) {
  return (
    <>
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
    </>
  );
}
