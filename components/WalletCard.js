import { useState } from 'react';
import CopyBtn from './CopyBtn';
import { truncate } from '../utils/helpers';

export default function WalletCard({ currentPKP }) {
  return (
    <div className="wallet-card">
      <span>My cloud wallet</span>
      <div className="wallet-card__info">
        <h1>
          {currentPKP?.ethAddress ? truncate(currentPKP.ethAddress) : '...'}
        </h1>
        {currentPKP?.ethAddress && (
          <CopyBtn textToCopy={currentPKP.ethAddress} />
        )}
      </div>
    </div>
  );
}
