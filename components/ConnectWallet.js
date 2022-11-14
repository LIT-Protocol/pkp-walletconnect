import { useConnect } from 'wagmi';
import { getAuthSig } from '../utils/lit-client';

export default function ConnectWallet() {
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect({
      async onSuccess() {
        await getAuthSig();
      },
    });

  return (
    <main className="container">
      <div className="vertical-stack">
        {error && <p className="alert alert--error">{error.message}</p>}
        <h1>Connect wallet</h1>
        {connectors.map(connector => (
          <button
            className="connect-wallet-btn"
            disabled={!connector.ready}
            key={connector.name}
            onClick={() => connect({ connector })}
          >
            {connector.name}
            {!connector.ready && ' (unsupported)'}
            {isLoading &&
              connector.id === pendingConnector?.id &&
              ' (connecting)'}
          </button>
        ))}
      </div>
    </main>
  );
}
