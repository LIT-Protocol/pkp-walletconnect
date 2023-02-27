import { useEffect, useState } from 'react';
import { useAppState } from '../context/AppContext';
import useWalletConnect from '../hooks/useWalletConnect';
import { getChain } from '../utils/helpers';
import ConnectDapp from './ConnectDapp';
import Footer from './Footer';
import WalletConnectModal from './WalletConnectModal';

const DashboardViews = {
  HOME: 'home',
  CONNECT_DAPP: 'connect_dapp',
};

export default function Dashboard() {
  const { currentUsername, currentPKP, wcConnector, appChainId, appChains } =
    useAppState();
  const wcConnect = useWalletConnect();

  const [view, setView] = useState(DashboardViews.HOME);
  // const [peerMeta, setPeerMeta] = useState(null);

  const chain = getChain(appChainId, appChains);

  const peerMeta = wcConnector ? wcConnector.peerMeta : null;

  function goBack() {
    setView(DashboardViews.HOME);
  }

  useEffect(() => {
    // If there's a stored WalletConnect session, try to re-connect
    if (wcConnector && !wcConnector.connected) {
      const storedWc = localStorage.getItem('walletconnect');
      if (storedWc) {
        const parsedWc = JSON.parse(storedWc);
        wcConnect({ session: parsedWc });
      }
    }
  }, [wcConnector, wcConnect]);

  return (
    <>
      <div className="grow">
        {chain && (
          <div className="float-right">
            <span className="mt-1 inline-flex items-center rounded-full bg-indigo-900 bg-opacity-20 text-sm text-indigo-200 border border-indigo-500 border-opacity-40 px-2.5 py-0.5">
              <svg
                className="-ml-0.5 mr-1.5 h-2 w-2 text-indigo-400"
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx={4} cy={4} r={3} />
              </svg>
              {chain.name ? chain.name : 'Unknown network'}
            </span>
          </div>
        )}
        {view === DashboardViews.HOME && (
          <>
            <h1 className="text-3xl sm:text-4xl text-base-100 font-medium mb-8">
              gm
            </h1>
            <div className="bg-base-100 bg-opacity-5 p-4 sm:p-6 mb-10">
              <div className="flex items-center mb-4 text-base-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                  />
                </svg>
                <h3 className="font-medium">
                  {currentUsername ? currentUsername : 'My wallet'}
                </h3>
              </div>
              <div>
                <h3 className="text-xs text-base-500 uppercase mb-1">
                  Eth address
                </h3>
                <p className="text-base-300 text-sm sm:text-base break-all">
                  {currentPKP.ethAddress}
                </p>
              </div>
              {/* <div className="mt-4">
                <h2 className="text-xs text-base-500 uppercase mb-1">
                  Public key
                </h2>
                <p className="text-base-300 break-all">
                  {currentPKP.publicKey}
                </p>
              </div> */}
            </div>

            {wcConnector && (
              <div className="mb-10">
                <h2 className="text-base font-medium text-base-300 mb-4">
                  Connected
                </h2>
                <div className="bg-base-100 bg-opacity-5 p-6 flex items-start">
                  {peerMeta?.icons.length > 0 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={peerMeta?.icons[0]}
                      alt={peerMeta?.name ? peerMeta.name : 'Unknown app'}
                      className="w-10 h-10 mr-4"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-base-300">
                      {peerMeta?.name ? peerMeta?.name : 'Unknown app'}
                    </h3>
                    {peerMeta?.url && (
                      <a
                        href={peerMeta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline hover:text-base-500"
                      >
                        {peerMeta.url}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-base font-medium text-base-300 mb-4">
                For you
              </h2>
              <button
                className="w-full flex items-center justify-between p-4 sm:p-6 border border-base-800 hover:bg-base-1000"
                onClick={() => setView(DashboardViews.CONNECT_DAPP)}
              >
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-indigo-400 mb-2 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                    />
                  </svg>
                  <span className="text-sm sm:text-base text-left">
                    Connect with your favorite dapps
                  </span>
                </div>
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
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
        {view === DashboardViews.CONNECT_DAPP && (
          <ConnectDapp goBack={goBack} />
        )}
      </div>
      <Footer />
      <WalletConnectModal />
    </>
  );
}
