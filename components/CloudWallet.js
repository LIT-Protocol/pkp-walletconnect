import { truncate } from '../utils/helpers';
import PendingRequests from './PendingRequests';
import RecentActivity from './RecentActivity';
import ActiveSessions from './ActiveSessions';

export default function CloudWallet({
  currentPKP,
  wcConnector,
  wcRequests,
  wcResults,
  wcDisconnect,
}) {
  return (
    <>
      <div className="cloud-wallet-card">
        <span>My cloud wallet</span>
        <h1>
          {currentPKP?.ethAddress ? truncate(currentPKP.ethAddress) : 'n/a'}
        </h1>
      </div>

      <ActiveSessions wcConnector={wcConnector} wcDisconnect={wcDisconnect} />

      <PendingRequests wcRequests={wcRequests} />

      <RecentActivity wcResults={wcResults} />
    </>
  );
}
