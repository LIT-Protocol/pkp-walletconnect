import CopyBtn from './CopyBtn';
import { truncate } from '../utils/helpers';

export default function WalletCard({ address }) {
  return (
    <div className="wallet-card">
      <span>My cloud wallet</span>
      <div className="wallet-card__info">
        <h1>{address ? truncate(address) : '...'}</h1>
        {address && <CopyBtn textToCopy={address} />}
      </div>
    </div>
  );
}
