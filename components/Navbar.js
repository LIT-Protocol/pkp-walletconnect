import { useAccount, useDisconnect } from 'wagmi';
import useHasMounted from '../hooks/useHasMounted';
import { truncate } from '../utils/helpers';
import useWalletConnect from '../hooks/useWalletConnect';

const icon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="header__icon"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
    />
  </svg>
);

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { wcDisconnect } = useWalletConnect();

  const handleDisconnect = () => {
    wcDisconnect();
    disconnect();
  };

  if (isConnected) {
    return (
      <header className="header">
        {icon}
        <div className="header__row">
          <span>{truncate(address)}</span>
          <button className="header__btn" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      {icon}
      <span>Not connected</span>
    </header>
  );
}
