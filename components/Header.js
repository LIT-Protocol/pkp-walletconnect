import { useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { truncate } from '../utils/helpers';
import useWalletConnect from '../hooks/useWalletConnect';

const icon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="header__icon"
  >
    <path
      fillRule="evenodd"
      d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Header() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { wcDisconnect } = useWalletConnect();

  const handleDisconnect = useCallback(
    event => {
      event.preventDefault();
      disconnect();
      wcDisconnect();
    },
    [disconnect, wcDisconnect]
  );

  if (isConnected) {
    return (
      <header className="header">
        {icon}
        <div className="header__row">
          <button className="header__btn" onClick={handleDisconnect}>
            <span className="header__btn__status"></span>
            {truncate(address)}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      {icon}
      <div className="header__row">
        <div className="header__badge">
          <span className="header__badge__status"></span>
          Not connected
        </div>
      </div>
    </header>
  );
}
