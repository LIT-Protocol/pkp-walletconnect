import { Fragment, useState, useCallback } from 'react';
import { QrReader } from 'react-qr-reader';

export default function QrHandler({ wcConnect }) {
  const [show, setShow] = useState(false);

  function onShowScanner() {
    setShow(true);
  }

  const handleQrPaste = useCallback(
    async uri => {
      await wcConnect({ uri: uri });
      setShow(false);
    },
    [wcConnect]
  );

  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center">
      {show ? (
        <Fragment>
          <div className="w-full relative overflow-hidden">
            <QrReader
              style={{ width: '100%' }}
              onResult={(result, error) => {
                if (!!result) {
                  handleQrPaste(result?.text);
                }
              }}
            />
          </div>
        </Fragment>
      ) : (
        <button
          className="flex flex-col items-center border border-base-800 border-dashed py-6 px-4 w-full mt-2 text-sm hover:bg-base-1000 focus:outline-none focus:ring-2 focus:ring-base-700 focus:ring-offset-2"
          onClick={onShowScanner}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1"
            stroke="currentColor"
            className="w-16 h-16 mb-2"
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
          <span>Scan QR code</span>
        </button>
      )}
    </div>
  );
}
