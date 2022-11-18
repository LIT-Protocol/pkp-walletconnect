import Link from 'next/link';
import { useRouter } from 'next/router';
import { getMintCost, mintPKP } from '../utils/contracts';
import { hexToDecimal } from '../utils/helpers';

export default function MintPKP() {
  const router = useRouter();

  function handleRetry() {
    router.reload(window.location.pathname);
  }

  async function handleMint() {
    const mintCost = await getMintCost();
    console.log('mintCost:', mintCost);

    const mintRes = await mintPKP({
      value: mintCost.arg,
    });
    console.log('minted PKP', mintRes);

    const tokenId = hexToDecimal(mintRes.tokenId);
    console.log('tokenId:', tokenId);
  }

  return (
    <main className="container">
      <div className="mint-pkp">
        <h2 className="mint-pkp__title">Create a cloud wallet</h2>
        <p>You&apos;ll need a cloud wallet to interact with this demo.</p>
        {/* <button className="mint-pkp__btn" onClick={handleRetry}>
          Try again
        </button> */}
        <button className="mint-pkp__btn" onClick={handleMint}>
          Mint one
        </button>
      </div>
    </main>
  );
}
