import { useState } from 'react';
import { truncate } from '../utils/helpers';
import PendingRequests from './PendingRequests';
import WalletCard from './WalletCard';
import Connections from './Connections';
import Activity from './activity';

export default function CloudWallet({
  currentPKP,
  wcConnector,
  wcRequests,
  wcResults,
  wcDisconnect,
}) {
  return (
    <>
      <WalletCard currentPKP={currentPKP} />

      <div className="section">
        <p className="section__title">Connected dapp</p>
        <Connections wcConnector={wcConnector} wcDisconnect={wcDisconnect} />
      </div>

      <div className="section">
        <p className="section__title">Pending requests ({wcRequests.length})</p>
        <PendingRequests wcRequests={wcRequests} />
      </div>

      <div className="section">
        <p className="section__title">Recent activity ({wcResults.length})</p>
        <Activity wcResults={wcResults} />
      </div>
    </>
  );
}
