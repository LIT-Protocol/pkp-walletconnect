import WalletCard from '../WalletCard';
import SessionCard from '../SessionCard';
import ResultCard from '../ResultCard';

export default function HomeTab({
  currentPKP,
  wcConnector,
  wcResults,
  wcDisconnect,
}) {
  return (
    <div className="tab">
      <WalletCard currentPKP={currentPKP} />

      <div className="section">
        <p className="section__title">Connected dapp</p>
        {wcConnector?.connected ? (
          <SessionCard wcConnector={wcConnector} wcDisconnect={wcDisconnect} />
        ) : (
          <div className="empty-state">
            <p>No connected dapps</p>
          </div>
        )}
      </div>

      <div className="section">
        <p className="section__title">Recent activity</p>
        {Object.keys(wcResults).length > 0 ? (
          Object.entries(wcResults).map((entry, index) => (
            <ResultCard key={entry[0]} request={wcResults[entry[0]]} />
          ))
        ) : (
          <div className="empty-state">
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
