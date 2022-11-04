import Link from 'next/link';

export default function MintPKP() {
  return (
    <div className="sub-page">
      <h2 className="sub-page__title">Create a cloud wallet</h2>
      <p>
        You&apos;ll need a cloud wallet to interact with this demo. Mint one at{' '}
        <Link href="https://explorer.litprotocol.com/mint-pkp">
          https://explorer.litprotocol.com/mint-pkp.
        </Link>
      </p>
    </div>
  );
}
