import SessionCard from '../SessionCard';
import CopyBtn from '../CopyBtn';
import { useAppState } from '../../context/AppContext';
import { truncate } from '../../utils/helpers';
import { useEffect } from 'react';

export default function HomeTab() {
  const { currentPKPAddress, wcConnectors } = useAppState();

  const currentConnectors = Object.values(wcConnectors).filter(
    connector => connector.accounts[0] === currentPKPAddress
  );

  return (
    <main className="container">
      <div className="tab">
        <div className="wallet-card">
          <h4 className="subtitle">My cloud wallet</h4>
          <div className="wallet-card__info">
            <h1>{currentPKPAddress ? truncate(currentPKPAddress) : '...'}</h1>
            {currentPKPAddress && <CopyBtn textToCopy={currentPKPAddress} />}
          </div>
        </div>

        <div className="section">
          <h4 className="subtitle">Connected dapps</h4>
          {currentConnectors.length > 0 ? (
            currentConnectors.map(connector => (
              <SessionCard key={connector.peerId} wcConnector={connector} />
            ))
          ) : (
            <div className="empty-state">
              <p>No connected dapps</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
