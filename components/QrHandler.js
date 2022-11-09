import { Fragment, useState, useCallback, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';

export default function QrHandler({ wcConnect }) {
  const [show, setShow] = useState(false);
  const [uri, setUri] = useState('');

  function onShowScanner() {
    setShow(true);
  }

  useEffect(() => {
    if (uri) {
      wcConnect({ uri: uri });
      setUri('');
    }
  }, [uri, wcConnect]);

  return (
    <div className="qr-reader">
      {show ? (
        <Fragment>
          <div className="qr-reader__mask">
            <QrReader
              style={{ width: '100%' }}
              onResult={(result, error) => {
                if (!!result) {
                  setUri(result?.text);
                }
              }}
            />
          </div>
        </Fragment>
      ) : (
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
          <button className="scan-qr__btn" onClick={onShowScanner}>
            Scan QR code
          </button>
        </div>
      )}
    </div>
  );
}
