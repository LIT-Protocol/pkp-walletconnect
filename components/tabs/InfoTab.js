import Link from 'next/link';
import CopyBtn from '../CopyBtn';
import { truncate } from '../../utils/helpers';

export default function InfoTab({ address, currentPKP }) {
  return (
    <div className="tab">
      <h2 className="tab__title">Cloud wallet details</h2>

      <div className="section">
        <p>ETH Address</p>
        <div>
          <span>{truncate(currentPKP.ethAddress)}</span>
          <CopyBtn textToCopy={currentPKP.ethAddress} />
        </div>
      </div>

      <div className="section">
        <p>Public key</p>
        <div>
          <span>{truncate(currentPKP.pubkey)}</span>
          <CopyBtn textToCopy={currentPKP.pubkey} />
        </div>
      </div>

      <div className="section">
        <p>Token ID</p>
        <div>
          <span>{truncate(currentPKP.tokenId)}</span>
          <CopyBtn textToCopy={currentPKP.tokenId} />
          <p className="opensea-copy">
            View your token on{' '}
            <Link
              href={`https://testnets.opensea.io/assets/mumbai/${address}/${currentPKP.tokenId}`}
              passHref
              legacyBehavior
            >
              <a target="_blank" rel="noopener noreferrer">
                Opensea &#8599;
              </a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
