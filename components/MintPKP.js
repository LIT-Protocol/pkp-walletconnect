import { useAppActions, useAppState } from '../context/AppContext';
import Link from 'next/link';

export default function MintPKP() {
  const { loading } = useAppState();
  const { handleMintPKP } = useAppActions();

  return (
    <main className="container">
      <div className="mint-pkp">
        <h2 className="mint-pkp__title">Create a cloud wallet</h2>
        <p>
          You&apos;ll need a cloud wallet to interact with this demo. Visit{' '}
          <Link
            href="https://faucet.polygon.technology/"
            passHref
            legacyBehavior
          >
            <a target="_blank" rel="noopener noreferrer">
              Polygon Faucet
            </a>
          </Link>{' '}
          to get some test MATIC.
        </p>
        <button
          className="mint-pkp__btn"
          disabled={loading}
          onClick={handleMintPKP}
        >
          Create cloud wallet
        </button>
      </div>
    </main>
  );
}
