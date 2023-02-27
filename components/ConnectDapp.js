import { useState, useCallback } from 'react';
import { useAppDispatch, useAppState } from '../context/AppContext';
import useWalletConnect from '../hooks/useWalletConnect';
import QrHandler from './QrHandler';
import { SessionCard } from './SessionCard';

export default function ConnectDapp({ goBack }) {
  const { wcConnector } = useAppState();
  const dispatch = useAppDispatch();

  const wcConnect = useWalletConnect();

  const [uri, setUri] = useState('');

  const handleQrPaste = useCallback(
    event => {
      event.preventDefault();
      wcConnect({ uri: uri });
      setUri('');
    },
    [wcConnect, uri]
  );

  async function wcDisconnect(wcConnector) {
    try {
      await wcConnector.killSession();
      localStorage.removeItem(`walletconnect`);
      dispatch({
        type: 'remove_connector',
      });
    } catch (error) {
      console.error('Error trying to close WalletConnect session: ', error);
      dispatch({
        type: 'remove_connector',
      });
    }
  }

  return (
    <>
      <button onClick={goBack} className="p-1 mb-6 hover:text-base-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
      </button>
      <div>
        {wcConnector && wcConnector.connected ? (
          <>
            <h1 className="text-2xl text-base-100 font-medium mb-2">
              Connected dapps
            </h1>
            <p className="text-sm sm:text-base mb-4">
              View and manage your active WalletConnect session
            </p>
            <SessionCard
              wcConnector={wcConnector}
              wcDisconnect={wcDisconnect}
            />
          </>
        ) : (
          <>
            <h1 className="text-2xl text-base-100 font-medium mb-2">
              Connect to your favorite dapps
            </h1>
            <p className="text-sm sm:text-base mb-4">
              Scan or paste a WalletConnect QR code to connect your cloud wallet
              to a dapp.
            </p>
            <QrHandler wcConnect={wcConnect} />
            <div className="relative my-6">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-base-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-root-dark text-sm px-2">or</span>
              </div>
            </div>
            <div>
              <p className="text-sm sm:text-base mb-4">Paste QR code</p>
              <form
                className="flex flex-wrap w-full sm:flex-nowrap"
                onSubmit={handleQrPaste}
              >
                <input
                  type="text"
                  id="wallet-name"
                  value={uri}
                  onChange={e => setUri(e.target.value)}
                  aria-label="wc url connect input"
                  placeholder="e.g. wc:a281567bb3e4..."
                  className="mb-2 sm:mb-0 sm:mr-2 px-2 grow w-full text-sm border border-transparent bg-base-1000 focus:border-indigo-500 focus:ring-indigo-500"
                ></input>
                <button
                  type="submit"
                  disabled={uri === ''}
                  className="grow sm:grow-0 border border-base-500 px-4 py-2 text-sm text-base-300 hover:bg-base-1000 focus:outline-none focus:ring-2 focus:ring-base-500 focus:ring-offset-2 disabled:hover:bg-root-dark disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  Connect
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
