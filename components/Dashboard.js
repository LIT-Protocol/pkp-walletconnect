import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { truncateAddress } from '../utils/helpers';
import ConnectDapp from './ConnectDapp';
import CopyBtn from './CopyBtn';
import Footer from './Footer';
import LogoutButton from './LogoutButton';
import NetworkMenu from './NetworkMenu';
import WalletConnectModal from './WalletConnectModal';

const DashboardViews = {
  HOME: 'home',
  CONNECT_DAPP: 'connect_dapp',
};

export default function Dashboard() {
  const { currentUsername, currentPKP } = useAppState();

  const [view, setView] = useState(DashboardViews.HOME);
  const [networkMenuContainer, setNetworkMenuContainer] = useState(null);

  function goBack() {
    setView(DashboardViews.HOME);
  }

  return (
    <>
      <div className="grow">
        <div className="float-right" ref={setNetworkMenuContainer}>
          <NetworkMenu networkMenuContainer={networkMenuContainer} />
          {/* <LogoutButton /> */}
        </div>

        {view === DashboardViews.HOME && (
          <>
            <h1 className="text-3xl sm:text-4xl text-base-100 font-medium mb-8">
              gm
            </h1>
            <div className="bg-base-100 bg-opacity-5 p-4 sm:p-6 mb-10">
              <h3 className="text-xs text-base-500 uppercase mb-5">
                My cloud wallet
              </h3>
              <div>
                <h3 className="text-xs text-base-500 uppercase mb-1">
                  Eth address
                </h3>
                <div className="flex items-center">
                  <p className="text-base-300 text-sm sm:text-base break-all mr-2">
                    {truncateAddress(currentPKP.ethAddress)}
                  </p>
                  <CopyBtn textToCopy={currentPKP.ethAddress} />
                </div>
              </div>
              <div className="mt-4">
                <h2 className="text-xs text-base-500 uppercase mb-1">
                  Owned by
                </h2>
                <div className="flex items-center">
                  <p className="text-sm sm:text-base text-base-300">
                    <span className="font-medium">{currentUsername}</span>{' '}
                    passkey
                  </p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 ml-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-medium text-base-300 mb-4">
                Explore
              </h2>
              <button
                className="w-full flex items-center justify-between p-4 sm:p-6 border border-base-800 hover:bg-base-1000"
                onClick={() => setView(DashboardViews.CONNECT_DAPP)}
              >
                <div className="flex flex-col items-start mr-4">
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
