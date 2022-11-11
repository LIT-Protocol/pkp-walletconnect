import Link from 'next/link';

export default function MintPKP() {
  return (
    <main className="container">
      <div className="mint-pkp">
        <h2 className="mint-pkp__title">Create a cloud wallet</h2>
        <p>
          You&apos;ll need a cloud wallet to interact with this demo. Mint one
          at{' '}
          <Link
            href="https://explorer.litprotocol.com/mint-pkp."
            passHref
            legacyBehavior
          >
            <a target="_blank" rel="noopener noreferrer">
              Lit Explorer.
            </a>
          </Link>
        </p>
        <Link href="/">
          <button className="mint-pkp__btn">Try again</button>
        </Link>
      </div>
    </main>
  );
}
