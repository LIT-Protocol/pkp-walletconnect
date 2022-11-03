import { useConnect } from 'wagmi';

export default function ConnectWallet() {
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();

  return (
    <div className="vertical-stack">
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

      {error && <p>{error.message}</p>}
    </div>
  );
}
