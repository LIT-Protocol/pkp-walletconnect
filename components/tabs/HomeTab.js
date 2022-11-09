import WalletCard from '../WalletCard';
import SessionCard from '../SessionCard';
import RequestCard from '../RequestCard';

export default function HomeTab({
  currentPKP,
  wcConnector,
  // wcPendingRequest,
  wcRequests,
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

      {/* <div className="section">
        <p className="section__title">Pending request</p>
        {!wcPendingRequest && !wcRequests && !wcRequests[wcPendingRequest] ? (
          <RequestCard request={wcRequests[wcPendingRequest]} />
        ) : (
          <div className="empty-state">
            <p>No pending requests</p>
          </div>
        )}
      </div> */}

      <div className="section">
        <p className="section__title">Recent activity</p>
        {Object.keys(wcRequests).length > 0 ? (
          Object.entries(wcRequests).map((entry, index) => (
            <RequestCard key={entry[0]} request={wcRequests[entry[0]]} />
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
