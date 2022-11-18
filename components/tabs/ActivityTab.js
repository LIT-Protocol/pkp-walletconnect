import ResultCard from '../ResultCard';
import { useAppState } from '../../context/AppContext';

export default function ActivityTab() {
  const { currentPKPAddress, wcResults } = useAppState();

  const currentResults = wcResults[currentPKPAddress];

  return (
    <main className="container">
      <div className="tab">
        <h2 className="tab__title">Recent activity</h2>
        {currentResults && currentResults.length > 0 ? (
          currentResults.map(resultData => (
            <ResultCard key={resultData.payload.id} resultData={resultData} />
          ))
        ) : (
          <div className="empty-state">
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </main>
  );
}
