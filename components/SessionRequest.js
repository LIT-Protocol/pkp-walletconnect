import { useAppState, useAppDispatch } from '../context/AppContext';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { getChain, truncateAddress } from '../utils/helpers';

export default function SessionRequest({ payload }) {
  const { currentUsername, currentPKP, appChainId, appChains, wcConnector } =
    useAppState();

  const dispatch = useAppDispatch();

  const peerMeta = payload.params[0].peerMeta;
  const network = getChain(appChainId, appChains);

  // Approve WalletConnect session
  function approveSession(payload) {
    // console.log('Approve WalletConnect session', payload);

    try {
      wcConnector.approveSession({
        accounts: [currentPKP.ethAddress],
        chainId: appChainId,
      });
      dispatch({
        type: 'request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error('Error trying to approve WalletConnect session: ', error);
      dispatch({
        type: 'request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    }
  }

  // Reject WalletConnect session
  function rejectSession(payload) {
    // console.log('Reject WalletConnect session');

    try {
      wcConnector.rejectSession();
      dispatch({
        type: 'request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error('Error trying to reject WalletConnect session: ', error);
      dispatch({
        type: 'request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            {peerMeta?.icons?.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="w-12 h-12 rounded-full object-contain"
                src={peerMeta.icons[0]}
                alt={peerMeta?.name ? peerMeta.name : 'unknown app'}
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 p-3 rounded-full bg-indigo-100 text-indigo-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/walletconnect.png"
              alt="WalletConnect logo"
              className="absolute bottom-0 left-9 bg-base-900 w-6 h-6 rounded-full object-contain"
            ></img>
          </div>
        </div>

        <AlertDialog.Title className="text-xl sm:text-2xl text-base-100 font-medium text-center">
          Connect to dapp
        </AlertDialog.Title>
        {peerMeta?.url && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-sm sm:text-base text-center hover:underline"
            href={peerMeta.url}
          >
            {peerMeta.url}
          </a>
        )}
        <p className="text-sm sm:text-base text-left mt-4">
          {peerMeta?.name ? peerMeta.name : 'An unknown app'} wants to connect
          to your cloud wallet.
        </p>

        <div className="relative flex items-center justify-between mt-4 p-3 border border-base-800">
          <div className="flex items-center">
            <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-indigo-500 mr-3"></span>
            <div className="flex flex-col text-sm">
              <span className="text-base-300 font-medium">
                {currentUsername ? currentUsername : 'My wallet'}
              </span>
              <span>{truncateAddress(currentPKP.ethAddress)}</span>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-base-900 py-1 px-2 text-xs">
            {network?.name ? network.name : 'Unknown network'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 mt-8">
        <AlertDialog.Cancel asChild>
          <button
            type="button"
            className="w-full border border-base-500 px-6 py-3 text-sm sm:text-base text-base-300 hover:bg-base-1000 focus:outline-none focus:ring-2 focus:ring-base-500 focus:ring-offset-2"
            onClick={() => rejectSession(payload)}
          >
            Cancel
          </button>
        </AlertDialog.Cancel>
        <AlertDialog.Action asChild>
          <button
            type="button"
            className="w-full border border-indigo-500 px-6 py-3 text-sm sm:text-base text-indigo-300 bg-indigo-600 bg-opacity-20 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => approveSession(payload)}
          >
            Connect
          </button>
        </AlertDialog.Action>
      </div>
    </>
  );
}
