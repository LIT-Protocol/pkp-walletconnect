import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import useWalletConnect from '../hooks/useWalletConnect';
import { QrReader } from 'react-qr-reader';
import useAppContext from '../hooks/useAppContext';

export default function Home() {
  const {
    wcConnected,
    wcPeerMeta,
    wcRequests,
    wcResults,
    wcConnect,
    wcDisconnect,
    wcApproveSession,
    wcRejectSession,
  } = useWalletConnect();

  const { currentPKP } = useAppContext();

  const [uri, setUri] = useState('');

  const handleQrPaste = useCallback(event => {
    event.preventDefault();
    console.log('uri', uri);
    wcConnect({ uri: uri });
  });

  return (
    <div className="container">
      <Head>
        <title>Lit PKP WalletConnect</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <button onClick={wcDisconnect}>Disconnect</button>
        <p>{`CONNECTED: ${wcConnected}`}</p>
        <p>Public key: {currentPKP.pubkey}</p>
        <p>ETH address: {currentPKP.ethAddress}</p>
        <h1>Connect to dapps</h1>
        <p>
          Scan or paste the dapp&apos;s QR code to connect your cloud wallet to
          the dapp.
        </p>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="qrIcon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
            />
          </svg>
          <button>Scan QR code</button>
        </div>
        <hr></hr>
        <p>or paste QR code</p>
        <form onSubmit={handleQrPaste}>
          <input
            id="wallet-name"
            value={uri}
            onChange={e => setUri(e.target.value)}
            aria-label="wc url connect input"
            placeholder="e.g. wc:a281567bb3e4..."
          ></input>
          <button type="submit">Connect</button>
        </form>
        <hr></hr>
        <h2>Connected dapp</h2>
        <p>
          {wcConnected && wcPeerMeta ? wcPeerMeta.name : 'No connected dapps'}
        </p>
        <hr></hr>
        <h2>Pending Requests</h2>
        <p>{wcRequests.length}</p>
        {wcRequests.length > 0 ? (
          wcRequests.map((request, index) => (
            <div key={`${request.payload.method}-${index}`}>
              <p>{request.payload.method}</p>
            </div>
          ))
        ) : (
          <div>
            <div>{'No pending requests'}</div>
          </div>
        )}
        <hr></hr>
        <h2>Past Activity</h2>
        <p>{wcResults.length}</p>
        {wcResults.length > 0 ? (
          wcResults.map((result, index) => (
            <div key={`${result.status}-${result.payload.method}-${index}`}>
              <p>
                {result.status} - {result.payload.method}
              </p>
            </div>
          ))
        ) : (
          <div>
            <div>{'No recent activity'}</div>
          </div>
        )}
      </main>
    </div>
  );
}
