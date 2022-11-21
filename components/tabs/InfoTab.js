import Link from 'next/link';
import CopyBtn from '../CopyBtn';
import { truncate } from '../../utils/helpers';
import { useAppState } from '../../context/AppContext';
import ContractAddresses from '../../utils/abis/deployed-contracts.json';

export default function InfoTab() {
  const { currentPKPAddress, myPKPs } = useAppState();
  const currentPKP = myPKPs[currentPKPAddress];

  return (
    <main className="container">
      <div className="tab">
        <h2 className="tab__title">Cloud wallet details</h2>

        {currentPKP ? (
          <>
            <div className="section">
              <h4 className="subtitle">ETH Address</h4>
              <div>
                <span>{truncate(currentPKP.address)}</span>
                <CopyBtn textToCopy={currentPKP.address} />
              </div>
            </div>

            <div className="section">
              <h4 className="subtitle">Public key</h4>
              <div>
                <span>{truncate(currentPKP.publicKey)}</span>
                <CopyBtn textToCopy={currentPKP.publicKey} />
              </div>
            </div>

            <div className="section">
              <h4 className="subtitle">Token ID</h4>
              <div>
                <span>{truncate(currentPKP.tokenId)}</span>
                <CopyBtn textToCopy={currentPKP.tokenId} />
                <p className="opensea-copy">
                  View your token on{' '}
                  <Link
                    href={`https://testnets.opensea.io/assets/mumbai/${ContractAddresses.pkpNftContractAddress}/${currentPKP.tokenId}`}
                    passHref
                    legacyBehavior
                  >
                    <a target="_blank" rel="noopener noreferrer">
                      Opensea
                    </a>
                  </Link>
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>No details found</p>
          </div>
        )}
      </div>
    </main>
  );
}
