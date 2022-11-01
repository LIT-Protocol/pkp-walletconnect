import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import useWalletConnect from '../hooks/useWalletConnect';
import { QrReader } from 'react-qr-reader';
import useAppContext from '../hooks/useAppContext';

export default function Home() {
  const {
    wcPeerMeta,
    wcSessions,
    wcRequests,
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
        <span>Public key: {currentPKP.pubkey}</span>
        <span>ETH address: {currentPKP.ethAddress}</span>
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
        <span>or paste QR code</span>
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
        <h2>Peer meta</h2>
        <h3>{wcPeerMeta ? wcPeerMeta.name : 'None'}</h3>
        <hr></hr>
        <h2>Requests</h2>
        {wcRequests.length ? (
          wcRequests.map((request, index) => (
            <div key={`${request.method}-${index}`}>
              <p>{request.method}</p>
            </div>
          ))
        ) : (
          <div>
            <div>{'No pending requests'}</div>
          </div>
        )}
        <hr></hr>
        <h2>Connected dapps</h2>
        {wcSessions.length ? (
          wcSessions.map((session, index) => (
            <div key={`${session.peerMeta.name}-${index}`}>
              <p>{session.peerMeta.name}</p>
            </div>
          ))
        ) : (
          <div>
            <div>{'No connected dapps'}</div>
          </div>
        )}
      </main>
    </div>
  );
}
