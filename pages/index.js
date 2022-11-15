import Head from 'next/head';
import { useState, useEffect, useCallback, useReducer } from 'react';
import { useAccount, useSigner, useDisconnect, useConnect } from 'wagmi';
import { ethers } from 'ethers';
import useHasMounted from '../hooks/useHasMounted';
import {
  litContractsConnected,
  connectLitContracts,
  fetchPKPsByAddress,
} from '../utils/lit-contracts';
import {
  DEFAULT_CHAINS,
  DEFAULT_CHAIN_ID,
  WC_RESULTS_STORAGE_KEY,
  WC_SESSION_STORAGE_KEY,
} from '../utils/constants';
import ConnectWallet from '../components/ConnectWallet';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import Header from '../components/Header';
import PKPWallet from '../utils/pkp-wallet';
import WalletConnect from '@walletconnect/client';
import Loading from '../components/Loading';
import MintPKP from '../components/MintPKP';
import ConnectDapp from '../components/ConnectDapp';
import SessionCard from '../components/SessionCard';
import WalletCard from '../components/WalletCard';
import AccountMenu from '../components/AccountMenu';
import NetworkMenu from '../components/NetworkMenu';
import SessionRequest from '../components/SessionRequest';
import CallRequest from '../components/CallRequest';

const initialState = {
  loading: false,
  pkpWallet: null,
  chainId: DEFAULT_CHAIN_ID,
  chains: DEFAULT_CHAINS,
  wcConnector: null,
  wcSessionRequest: null,
  wcRequests: [],
  wcResults: {},
};

function appReducer(state, action) {
  console.log('APP REDUCER -', action);

  switch (action.type) {
    case 'fetching_pkp': {
      return {
        ...state,
        loading: true,
      };
    }
    case 'pkp_initialized': {
      return {
        ...state,
        loading: false,
        pkpWallet: action.pkpWallet,
      };
    }
    case 'pkp_disconnected': {
      return initialState;
    }
    case 'switch_address': {
      return {
        ...state,
        pkpWallet: action.pkpWallet,
      };
    }
    case 'switch_chain': {
      return {
        ...state,
        chainId: action.chainId,
      };
    }
    case 'connector_created': {
      return {
        ...state,
        wcConnector: action.wcConnector,
      };
    }
    case 'pending_session': {
      return {
        ...state,
        wcSessionRequest: action.payload,
      };
    }
    case 'session_connected': {
      return {
        ...state,
        wcConnector: action.wcConnector,
        wcSessionRequest: null,
      };
    }
    case 'session_disconnected': {
      return {
        ...state,
        wcConnector: null,
        wcSessionRequest: null,
        wcRequests: [],
      };
    }
    case 'session_updated': {
      return {
        ...state,
        wcConnector: action.wcConnector,
      };
    }
    case 'pending_request': {
      return {
        ...state,
        wcRequests: [...state.wcRequests, action.payload],
      };
    }
    case 'request_approved': {
      const filteredRequests = state.wcRequests.filter(
        request => request.id !== action.payload.id
      );

      const updatedResults = updateResults({
        wcResults: state.wcResults,
        address: state.pkpWallet.address,
        payload: action.payload,
        status: action.status,
        result: action.result,
        error: action.error,
      });

      return {
        ...state,
        pkpWallet: action.pkpWallet,
        wcConnector: action.wcConnector,
        wcRequests: filteredRequests,
        wcResults: updatedResults,
      };
    }
    case 'request_rejected': {
      const filteredRequests = state.wcRequests.filter(
        request => request.id !== action.payload.id
      );

      const updatedResults = updateResults({
        wcResults: state.wcResults,
        address: state.pkpWallet.address,
        payload: action.payload,
        status: action.status,
        result: action.result,
        error: action.error,
      });

      return {
        ...state,
        wcConnector: action.wcConnector,
        wcRequests: filteredRequests,
        wcResults: updatedResults,
      };
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

// TODO: fix
function updateResults({ wcResults, address, payload, status, result, error }) {
  const newResult = {
    payload: payload,
    status: status,
    result: result,
    error: error,
  };

  let updatedResults = wcResults;
  if (updatedResults[address]) {
    updatedResults[address] = [newResult, ...updatedResults[address]];
  } else {
    updatedResults = {
      ...updatedResults,
      [address]: [newResult],
    };
  }

  return updatedResults;
}

export default function Home() {
  // wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect({
      onSuccess(data) {
        console.log('onSuccess', data);
      },
    });
  const { disconnect } = useDisconnect();

  // app state
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ui state
  const [tab, setTab] = useState(1);
  const hasMounted = useHasMounted();

  async function initPKPWallet(address, signer) {
    dispatch({ type: 'fetching_pkp' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const pkpWallet = new PKPWallet({
      ownerAddress: address,
      provider: provider,
      signer: signer,
    });
    await pkpWallet.initialize();
    console.log('init pkpWallet', pkpWallet);
    dispatch({ type: 'pkp_initialized', pkpWallet: pkpWallet });
  }

  // Initialize WalletConnect connector
  async function wcConnect({ uri, session }) {
    console.log('wcConnect uri', uri);
    console.log('wcConnect session', session);
    const wcConnector = new WalletConnect({
      uri: uri,
      session: session,
      clientMeta: {
        description: 'Lit PKP Wallet',
        url: 'https://litprotocol.com',
        name: 'Lit PKP Wallet',
      },
      storageId: WC_SESSION_STORAGE_KEY,
    });

    if (!wcConnector.connected) {
      wcConnector.createSession();
    }

    dispatch({
      type: 'connector_created',
      wcConnector: wcConnector,
    });

    console.log('Created connector', wcConnector);

    // Subscribe to connection events
    wcConnector.on('session_request', (error, payload) => {
      console.log('On WalletConnect session_request', payload);
      if (error) {
        throw error;
      }
      dispatch({
        type: 'pending_session',
        payload: payload,
      });
    });

    wcConnector.on('connect', (error, payload) => {
      console.log('On WalletConnect connect', payload);
      if (error) {
        throw error;
      }
      dispatch({
        type: 'session_connected',
        wcConnector: wcConnector,
      });
    });

    // Subscribe to call_request and approve requests automatically
    wcConnector.on('call_request', async (error, payload) => {
      console.log('On WalletConnect call_request', payload);
      if (error) {
        throw error;
      }
      dispatch({
        type: 'pending_request',
        payload: payload,
      });
    });

    wcConnector.on('disconnect', error => {
      console.log('On WalletConnect disconnect');
      if (error) {
        throw error;
      }
      dispatch({
        type: 'session_disconnected',
      });
    });
  }

  // Disconnect from WalletConnect
  async function wcDisconnect() {
    console.log('Disconnect from WalletConnect');

    try {
      await state.wcConnector.killSession();
      localStorage.removeItem(WC_SESSION_STORAGE_KEY);
      dispatch({
        type: 'session_disconnected',
      });
    } catch (error) {
      console.error('Error trying to close WalletConnect session: ', error);
    }
  }

  // Approve WalletConnect session
  async function wcApproveSession() {
    console.log('Approve WalletConnect session');

    const wcConnector = state.wcConnector;

    try {
      await wcConnector.approveSession({
        accounts: [state.pkpWallet.address],
        chainId: state.chainId,
      });
      dispatch({
        type: 'session_connected',
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error('Error trying to approve WalletConnect session: ', error);
    }
  }

  // Reject WalletConnect session
  async function wcRejectSession() {
    console.log('Reject WalletConnect session');

    try {
      await state.wcConnector.rejectSession();
      dispatch({
        type: 'session_disconnected',
      });
    } catch (error) {
      console.error('Error trying to reject WalletConnect session: ', error);
    }
  }

  // Update WalletConnect session
  async function wcUpdateSession(address, chainId) {
    const wcConnector = state.wcConnector;

    try {
      await wcConnector.updateSession({
        accounts: [address],
        chainId: chainId,
      });
      dispatch({
        type: 'session_updated',
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error('Error trying to update WalletConnect session: ', error);
    }
  }

  // Approve request via WalletConnect
  async function wcApproveRequest(payload) {
    console.log('Approve request via WalletConnect', payload);

    const wcConnector = state.wcConnector;
    const pkpWallet = state.pkpWallet;

    let version;
    let txParams;
    let chainParams;
    let result;

    try {
      switch (payload.method) {
        case 'eth_sign':
          result = await pkpWallet.signMessage(
            payload.params[1],
            state.chainId
          );
          break;
        case 'personal_sign':
          result = await pkpWallet.signPersonalMessage(
            payload.params[0],
            state.chainId
          );
          break;
        case 'eth_signTypedData':
          version = getSignVersionByMessageFormat(payload.params[1]);
          result = await pkpWallet.signTypedData(
            payload.params[1],
            version,
            state.chainId
          );
          break;
        case 'eth_signTypedData_v1':
          version = getSignVersionEnum('v1');
          result = await pkpWallet.signTypedData(
            payload.params[1],
            version,
            state.chainId
          );
          break;
        case 'eth_signTypedData_v3':
          version = getSignVersionEnum('v3');
          result = await pkpWallet.signTypedData(
            payload.params[1],
            version,
            state.chainId
          );
          break;
        case 'eth_signTypedData_v4':
          version = getSignVersionEnum('v4');
          result = await pkpWallet.signTypedData(
            payload.params[1],
            version,
            state.chainId
          );
          break;
        case 'eth_signTransaction':
          txParams = getTransactionToSign(payload.params[0]);
          result = await pkpWallet.signTransaction(txParams, state.chainId);
          break;
        case 'eth_sendTransaction':
          txParams = getTransactionToSend(payload.params[0], state.chainId);
          result = await pkpWallet.sendTransaction(txParams);
          break;
        // case 'wallet_addEthereumChain':
        //   chainParams = payload.params[0];
        //   result = pkpWallet.addEthereumChain(chainParams);
        //   break;
        // case 'wallet_switchEthereumChain':
        //   chainParams = payload.params[0];
        //   await handleSwitchChain(chainParams.chainId);
        //   break;
        default:
          throw new Error('Unsupported WalletConnect method');
      }

      const wcResult = result.hash
        ? result.hash
        : result.raw
        ? result.raw
        : result;

      await wcConnector.approveRequest({
        id: payload.id,
        result: wcResult,
      });

      dispatch({
        type: 'request_approved',
        pkpWallet: pkpWallet,
        wcConnector: wcConnector,
        payload: payload,
        status: 'success',
        result: result,
      });
    } catch (err) {
      console.log(err);

      await wcConnector.rejectRequest({
        id: payload.id,
        error: { message: err.message },
      });

      dispatch({
        type: 'request_rejected',
        wcConnector: wcConnector,
        payload: payload,
        status: 'error',
        error: err,
      });
    }
  }

  // https://docs.metamask.io/guide/rpc-api.html#wallet-addethereumchain
  function addEthereumChain(chainParams) {
    const newChain = chainParams;

    const network = this.chains.find(
      chain => chain.chainId === newChain.chainId
    );
    if (!network) {
      dispatch({ type: 'add_chain', chain: newChain });
    }

    return null;
  }

  // https://docs.metamask.io/guide/rpc-api.html#wallet-switchethereumchain
  function switchEthereumChain(chainParams) {
    const newChainId = chainParams.chainId;
    const network = state.chains.find(chain => chain.chainId === newChainId);
    if (network) {
      dispatch({ type: 'switch_chain', chainId: newChainId });
    } else {
      throw Error('Chain not supported');
    }

    return null;
  }

  // Reject request via WalletConnect
  async function wcRejectRequest(payload) {
    console.log('Reject request via WalletConnect');

    const wcConnector = state.wcConnector;

    await wcConnector.rejectRequest({
      id: payload.id,
      error: { message: 'User rejected WalletConnect request' },
    });

    dispatch({
      type: 'request_rejected',
      wcConnector: wcConnector,
      payload: payload,
      status: 'rejected',
      error: { message: 'User rejected WalletConnect request' },
    });
  }

  async function handleSwitchAddress(newAccount) {
    console.log('handleSwitchAddress', newAccount);
    const pkpWallet = state.pkpWallet;
    pkpWallet.useAccount(newAccount);
    dispatch({ type: 'switch_address', pkpWallet: pkpWallet });
    await wcUpdateSession(newAccount, state.chainId);
  }

  async function handleSwitchChain(newChainId) {
    console.log('handleSwitchChain', newChainId);
    const network = state.chains.find(chain => chain.chainId === newChainId);
    if (network) {
      dispatch({ type: 'switch_chain', chainId: newChainId });
      await wcUpdateSession(state.pkpWallet.address, newChainId);
    } else {
      throw Error('Chain not supported');
    }
  }

  async function handleLogout() {
    console.log('handle logout');
  }

  useEffect(() => {
    async function init() {
      if (address && signer) {
        await initPKPWallet(address, signer);
      }
    }
    // Initialize PKPWallet if web3 wallet is connected
    if (!state.pkpWallet) {
      init();
    }
  }, [address, signer, state.pkpWallet]);

  useEffect(() => {
    async function restoreWc() {
      // Reconnect if URI exists in local storage
      const wcSession = localStorage.getItem(WC_SESSION_STORAGE_KEY);
      if (wcSession) {
        const session = JSON.parse(wcSession);
        await wcConnect({ session: session });
      }
    }
    // Check if cloud wallet exists but WalletConnect is not connected
    if (state.pkpWallet && !state.wcConnector) {
      restoreWc();
    }
  }, [state.pkpWallet, state.wcConnector]);

  if (!hasMounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="layout">
        <div className="cloud-wallet">
          <Header />
          <main className="container">
            <div className="vertical-stack">
              {error && <p className="alert alert--error">{error.message}</p>}
              <h1>Connect wallet</h1>
              {connectors.map(connector => (
                <button
                  className="connect-wallet-btn"
                  disabled={!connector.ready}
                  key={connector.name}
                  onClick={() => connect({ connector })}
                >
                  {connector.name}
                  {!connector.ready && ' (unsupported)'}
                  {isLoading &&
                    connector.id === pendingConnector?.id &&
                    ' (connecting)'}
                </button>
              ))}
            </div>
          </main>
          <footer className="footer">
            <span className="footer__caption">Powered by Lit</span>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <div className="cloud-wallet">
        {state.loading ? (
          <>
            <main className="container">
              <div className="loading">
                <span>Loading...</span>
              </div>
            </main>
            <footer className="footer">
              <span className="footer__caption">Powered by Lit</span>
            </footer>
          </>
        ) : state.pkpWallet && state.pkpWallet.initialized ? (
          <>
            {state.wcSessionRequest ? (
              <SessionRequest
                wcSessionRequest={state.wcSessionRequest}
                wcApproveSession={wcApproveSession}
                wcRejectSession={wcRejectSession}
              />
            ) : state.wcRequests.length > 0 ? (
              <CallRequest
                wcPeerMeta={state.wcConnector.peerMeta}
                wcRequest={state.wcRequests[0]}
                wcApproveRequest={wcApproveRequest}
                wcRejectRequest={wcRejectRequest}
              />
            ) : (
              <>
                <Header
                  networkMenu={
                    <NetworkMenu
                      chainId={state.chainId}
                      chains={state.chains}
                      handleSwitchChain={handleSwitchChain}
                    />
                  }
                  accountMenu={
                    <AccountMenu
                      ownerAddress={address}
                      address={state.pkpWallet.address}
                      accounts={state.pkpWallet.accounts}
                      handleSwitchAddress={handleSwitchAddress}
                      handleLogout={handleLogout}
                    />
                  }
                />
                <main className="container">
                  <WalletCard address={state.pkpWallet.address} />
                  {state.wcConnector?.connected ? (
                    <>
                      <SessionCard
                        wcConnector={state.wcConnector}
                        wcDisconnect={wcDisconnect}
                      />
                    </>
                  ) : (
                    <>
                      <ConnectDapp wcConnect={wcConnect} />
                    </>
                  )}
                </main>
                <Footer tab={tab} setTab={setTab} />
              </>
            )}
          </>
        ) : (
          <MintPKP />
        )}
      </div>
    </div>
  );
}
