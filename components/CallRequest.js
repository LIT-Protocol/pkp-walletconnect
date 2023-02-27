import { useAppState, useAppDispatch } from '../context/AppContext';
import { LitPKP } from 'lit-pkp-sdk';
import { convertHexToNumber } from '@walletconnect/legacy-utils';
import { getChain, getRPCUrl, truncateAddress } from '../utils/helpers';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import SignMessagePrompt from './SignMessagePrompt';
import SignDataPrompt from './SignDataPrompt';
import AddChainPrompt from './AddChainPrompt';
import SwitchChainPrompt from './SwitchChainPrompt';
import TransactionPrompt from './TransactionPrompt';
import RawTransactionPrompt from './RawTransactionPrompt';

export default function CallRequest({ payload }) {
  const { currentUsername, currentPKP, sessionSigs, appChains, wcConnector } =
    useAppState();

  const dispatch = useAppDispatch();

  const peerMeta = wcConnector.peerMeta;
  const wcChainId = wcConnector.chainId;
  const wcEthAddress = wcConnector.accounts[0];
  const network = getChain(wcChainId, appChains);

  // Initialize PKP Wallet from PKP SDK
  async function loadPKPWallet(chainId) {
    let authSig = null;
    if (
      Object.values(sessionSigs).length > 0 &&
      Object.values(sessionSigs)[0]
    ) {
      authSig = Object.values(sessionSigs)[0];
      // console.log('authsig', authSig);
    }
    if (!authSig) {
      throw new Error('Auth signature not found');
    }

    const rpcUrl = getRPCUrl(chainId, appChains);
    if (!rpcUrl) {
      throw new Error('RPC URL not found');
    }

    const wallet = new LitPKP({
      pkpPubKey: currentPKP.publicKey,
      controllerAuthSig: authSig,
      provider: rpcUrl,
    });
    await wallet.init();
    return wallet;
  }

  // Approve request via WalletConnect
  async function approveRequest(payload) {
    // console.log('Approve request via WalletConnect', payload);

    const wallet = await loadPKPWallet(wcChainId);

    let result;

    try {
      switch (payload.method) {
        case 'eth_sign':
        case 'personal_sign':
        case 'eth_signTypedData':
        case 'eth_signTypedData_v1':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
        case 'eth_signTransaction':
        case 'eth_sendTransaction':
        case 'eth_sendRawTransaction':
          // Sign with PKP Wallet
          result = await wallet.signEthereumRequest(payload);
          break;
        case 'wallet_addEthereumChain':
          // Add chain to list of supported chains
          addChain(payload.params[0]);
          result = null;
          break;
        case 'wallet_switchEthereumChain':
          // Update WalletConnect session
          const newChainId = convertHexToNumber(payload.params[0].chainId);
          await switchChain(newChainId);
          result = null;
          break;
        default:
          throw new Error('Unsupported WalletConnect method');
      }

      // eth_sign, personal_sign, eth_SignTypedData, eth_signTransaction should return a signature
      // eth_sendTransaction, eth_sendRawTransaction should return a transaction hash
      let wcResult = result;
      if (
        ['eth_sendTransaction', 'eth_sendRawTransaction'].includes(
          payload.method
        )
      ) {
        wcResult = result.hash;
      }

      wcConnector.approveRequest({
        id: payload.id,
        result: wcResult,
      });

      dispatch({
        type: 'request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    } catch (err) {
      // console.log(err);

      let errorMessage = 'Failed to approve WalletConnect request';
      if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      wcConnector.rejectRequest({
        id: payload.id,
        error: { message: errorMessage },
      });

      dispatch({
        type: 'request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    }
  }

  // Add chain to list of app chains
  function addChain(chainParams) {
    const newChain = chainParams;
    const newChainId = convertHexToNumber(newChain.chainId);
    const network = getChain(newChainId, appChains);
    if (network) {
      dispatch({
        type: 'add_chain',
        chain: newChain,
      });
    } else {
      throw Error('Chain not supported');
    }
    return null;
  }

  // // Update WalletConnect session to use new chain ID
  async function switchChain(newChainId) {
    const network = getChain(newChainId, chains);
    if (network) {
      updateSession(wcEthAddress, newChainId);
    } else {
      throw Error('Chain not supported');
    }
    return null;
  }

  // Update WalletConnect session
  function updateSession(pkpAddress, chainId) {
    try {
      wcConnector.updateSession({
        accounts: [pkpAddress],
        chainId: chainId,
      });
      dispatch({
        type: 'update_connector',
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error('Error trying to update WalletConnect session: ', error);
      dispatch({
        type: 'update_connector',
        wcConnector: wcConnector,
      });
    }
  }

  // Reject request via WalletConnect
  async function rejectRequest(payload) {
    // console.log('Reject request via WalletConnect');

    try {
      await wcConnector.rejectRequest({
        id: payload.id,
        error: { message: 'User rejected WalletConnect request' },
      });

      dispatch({
        type: 'request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error(
        'Error trying to reject WalletConnect call request: ',
        error
      );

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

        {(payload.method === 'eth_sign' ||
          payload.method === 'personal_sign') && (
          <SignMessagePrompt payload={payload} peerMeta={peerMeta} />
        )}

        {payload.method.includes('eth_signTypedData') && (
          <SignDataPrompt payload={payload} peerMeta={peerMeta} />
        )}

        {payload.method === 'wallet_addEthereumChain' && (
          <AddChainPrompt payload={payload} peerMeta={peerMeta} />
        )}

        {payload.method === 'wallet_switchEthereumChain' && (
          <SwitchChainPrompt payload={payload} peerMeta={peerMeta} />
        )}

        {(payload.method === 'eth_signTransaction' ||
          payload.method === 'eth_sendTransaction') && (
          <TransactionPrompt payload={payload} peerMeta={peerMeta} />
        )}

        {payload.method === 'eth_sendRawTransaction' && (
          <RawTransactionPrompt payload={payload} peerMeta={peerMeta} />
        )}

        <div className="relative flex items-center justify-between mt-4 p-3 border border-base-800">
          <div className="flex items-center">
            <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 mr-3"></span>
            <div className="flex flex-col text-sm">
              <span className="text-base-300 font-medium">
                {currentUsername ? currentUsername : 'My wallet'}
              </span>
              <span>{truncateAddress(wcEthAddress)}</span>
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
            className="w-full border border-base-500 px-6 py-3 text-base text-base-300 hover:bg-base-1000 focus:outline-none focus:ring-2 focus:ring-base-500 focus:ring-offset-2"
            onClick={() => rejectRequest(payload)}
          >
            Reject
          </button>
        </AlertDialog.Cancel>
        <AlertDialog.Action asChild>
          <button
            type="button"
            className="w-full border border-indigo-500 px-6 py-3 text-indigo-300 bg-indigo-600 bg-opacity-20 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => approveRequest(payload)}
          >
            Approve
          </button>
        </AlertDialog.Action>
      </div>
    </>
  );
}
