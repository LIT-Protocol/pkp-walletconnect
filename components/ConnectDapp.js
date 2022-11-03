import { useState, useCallback } from 'react';

export default function ConnectDapp({ wcConnect }) {
  const [uri, setUri] = useState('');

  const handleQrPaste = useCallback(
    event => {
      event.preventDefault();
      wcConnect({ uri: uri });
    },
    [wcConnect, uri]
  );

  return (
    <div className="connect-dapp">
      <p>
        Scan or paste the dapp&apos;s QR code to connect your cloud wallet to
        the dapp.
      </p>
      <div className="scan-qr vertical-stack">
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
        <button className="scan-qr__btn">Scan QR code</button>
      </div>
      <div className="paste-qr vertical-stack">
        <p className="paste-qr__copy">or paste QR code</p>
        <form className="paste-qr__form" onSubmit={handleQrPaste}>
          <input
            id="wallet-name"
            value={uri}
            onChange={e => setUri(e.target.value)}
            aria-label="wc url connect input"
            placeholder="e.g. wc:a281567bb3e4..."
            className="paste-qr__input"
          ></input>
          <button type="submit" disabled={uri === ''} className="paste-qr__btn">
            Connect
          </button>
        </form>
      </div>
    </div>
  );
}
