import { useState, useCallback } from 'react';
import { useAppActions } from '../../context/AppContext';
import QrHandler from '../QrHandler';

export default function ConnectTab() {
  const { wcConnect } = useAppActions();

  const [uri, setUri] = useState('');

  const handleQrPaste = useCallback(
    event => {
      event.preventDefault();
      wcConnect({ uri: uri });
      setUri('');
    },
    [wcConnect, uri]
  );

  return (
    <main className="container">
      <div className="tab">
        <div className="connect-dapp">
          <p className="connect-dapp__prompt">
            Scan or paste a WalletConnect QR code to connect your cloud wallet
            to a dapp.
          </p>
          <QrHandler wcConnect={wcConnect} />
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
              <button
                type="submit"
                disabled={uri === ''}
                className="paste-qr__btn"
              >
                Connect
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
