import { createContext, useContext, useEffect, useReducer } from 'react';
import { useAccount, useSigner, useDisconnect } from 'wagmi';
import appReducer from '../hooks/appReducer';
import WalletConnect from '@walletconnect/client';
import LitJsSdk from 'lit-js-sdk';
import {
  connectLitContracts,
  fetchPKPsByAddress,
  litContractsConnected,
} from '../utils/contracts';
import PKPWalletController from '../utils/pkpWalletController';
import { getChain, getRPCUrl } from '../utils/helpers';
import { parseWalletConnectUri } from '@walletconnect/utils';
import {
  DEFAULT_CHAINS,
  DEFAULT_CHAIN_ID,
  PKPS_STORAGE_KEY,
  WC_RESULTS_STORAGE_KEY,
} from '../utils/constants';
import { ethers } from 'ethers';

const INITIAL_APP_STATE = {
  loading: false,
  tab: 1,
  wcConnectors: {},
  wcRequests: [],
  wcResults: {},
  currentPKPAddress: null,
  pkpWallets: {},
  appChainId: DEFAULT_CHAIN_ID,
  appChains: DEFAULT_CHAINS,
};

export const AppContext = createContext(null);
export const AppDispatchContext = createContext(null);
export const AppActionsContext = createContext(null);

export function AppProvider({ children }) {
  // wagmi hooks
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const { disconnectAsync } = useDisconnect();

  // app state
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);

  function getWcConnector(peerId) {
    return state.wcConnectors[peerId];
  }

  function getPKPWallet(address) {
    return state.pkpWallets[address];
  }

  // Initialize WalletConnect connector
  async function wcConnect({ uri, session }) {
    let key = uri ? parseWalletConnectUri(uri).key : session.key;

    const wcConnector = new WalletConnect({
      uri: uri,
      session: session,
      clientMeta: {
        description: 'Lit PKP Wallet',
        url: 'https://litprotocol.com',
        name: 'Lit PKP Wallet',
      },
      storageId: `walletconnect_${key}`,
    });

    if (!wcConnector.connected) {
      await wcConnector.createSession();
    }

    console.log('Created connector', wcConnector);

    if (wcConnector.peerId) {
      dispatch({
        type: 'session_updated',
        wcConnector: wcConnector,
      });
    }

    wcConnector.on('session_request', (error, payload) => {
      console.log('On WalletConnect session_request', payload);
      if (error) {
        throw error;
      }
      dispatch({
        type: 'pending_request',
        payload: payload,
        wcConnector: wcConnector,
      });
    });

    wcConnector.on('call_request', async (error, payload) => {
      console.log('On WalletConnect call_request', payload);
      if (error) {
        throw error;
      }
      const payloadWithPeerId = { ...payload, peerId: wcConnector.peerId };
      dispatch({
        type: 'pending_request',
        payload: payloadWithPeerId,
        wcConnector: wcConnector,
      });
    });

    wcConnector.on('connect', (error, payload) => {
      console.log('On WalletConnect connect');
      if (error) {
        throw error;
      }
      dispatch({
        type: 'session_updated',
        wcConnector: wcConnector,
      });
    });
  }

  // Disconnect from WalletConnect client
  async function wcDisconnect(peerId) {
    console.log('Disconnect from WalletConnect');

    try {
      const wcConnector = getWcConnector(peerId);
      await wcConnector.killSession();
      localStorage.removeItem(`walletconnect_${wcConnector.key}`);
      dispatch({
        type: 'session_removed',
        peerId: peerId,
      });
    } catch (error) {
      console.error('Error trying to close WalletConnect session: ', error);
    }
  }

  // Approve WalletConnect session
  function wcApproveSession(payload) {
    console.log('Approve WalletConnect session', payload);

    try {
      const peerId = payload.params[0].peerId;
      const wcConnector = getWcConnector(peerId);
      wcConnector.approveSession({
        accounts: [state.currentPKPAddress],
        chainId: state.appChainId,
      });
      dispatch({
        type: 'session_request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error('Error trying to approve WalletConnect session: ', error);
    }
  }

  // Reject WalletConnect session
  function wcRejectSession(payload) {
    console.log('Reject WalletConnect session');

    try {
      const peerId = payload.params.peerId;
      const wcConnector = getWcConnector(peerId);
      wcConnector.rejectSession();
      dispatch({
        type: 'session_request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error('Error trying to reject WalletConnect session: ', error);
    }
  }

  // Update WalletConnect session
  function wcUpdateSession(peerId, pkpAddress, chainId) {
    try {
      const wcConnector = getWcConnector(peerId);
      wcConnector.updateSession({
        accounts: [pkpAddress],
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

    const peerId = payload.peerId;
    const wcConnector = getWcConnector(peerId);
    const pkpAddress = wcConnector.accounts[0];
    const pkpWallet = getPKPWallet(pkpAddress);
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
          // TODO: get wc connector chain id instead
          result = await pkpWallet.handleJSONRPCCalls(
            payload,
            wcConnector.chainId
          );
          break;
        case 'wallet_addEthereumChain':
          chainParams = payload.params[0];
          addEthereumChain(chainParams);
          result = null;
          break;
        case 'wallet_switchEthereumChain':
          chainParams = payload.params[0];
          await switchEthereumChain(peerId, pkpAddress, chainParams.chainId);
          result = null;
          break;
        default:
          throw new Error('Unsupported WalletConnect method');
      }

      const wcResult = result.hash
        ? result.hash
        : result.raw
        ? result.raw
        : result;

      wcConnector.approveRequest({
        id: payload.id,
        result: wcResult,
      });

      dispatch({
        type: 'call_request_handled',
        wcConnector: wcConnector,
        pkpAddress: pkpAddress,
        payload: payload,
        status: 'success',
        result: result,
      });
    } catch (err) {
      console.log(err);

      wcConnector.rejectRequest({
        id: payload.id,
        error: { message: err.message },
      });

      dispatch({
        type: 'call_request_handled',
        wcConnector: wcConnector,
        pkpAddress: pkpAddress,
        payload: payload,
        status: 'error',
        error: err,
      });
    }
  }

  // Add chain to list of app chains
  function addEthereumChain(chainParams) {
    const newChain = chainParams;
    const network = state.appChains.find(
      chain => chain.chainId === newChain.chainId
    );
    if (!network) {
      dispatch({ type: 'add_chain', chain: newChain });
    }
    return null;
  }

  // Update WalletConnect session of given peer ID to use new chain ID
  async function switchEthereumChain(peerId, pkpAddress, newChainId) {
    const network = state.appChains.find(chain => chain.chainId === newChainId);
    if (network) {
      wcUpdateSession(peerId, pkpAddress, newChainId);
    } else {
      throw Error('Chain not supported');
    }
    return null;
  }

  // Reject request via WalletConnect
  async function wcRejectRequest(payload) {
    console.log('Reject request via WalletConnect');

    try {
      const peerId = payload.peerId;
      const wcConnector = getWcConnector(peerId);
      const pkpAddress = wcConnector.accounts[0];
      await wcConnector.rejectRequest({
        id: payload.id,
        error: { message: 'User rejected WalletConnect request' },
      });
      dispatch({
        type: 'call_request_handled',
        wcConnector: wcConnector,
        pkpAddress: pkpAddress,
        payload: payload,
        status: 'rejected',
        error: { message: 'User rejected WalletConnect request' },
      });
    } catch (error) {
      console.error(
        'Error trying to reject WalletConnect call request: ',
        error
      );
    }
  }

  async function handleSwitchAddress(newAddress) {
    console.log('handleSwitchAddress', newAddress);
    const account = state.pkpWallets.find(
      account => account.address === newAddress
    );
    if (account) {
      dispatch({ type: 'switch_address', address: newAddress });
    } else {
      throw Error('Account not found');
    }
  }

  async function handleSwitchChain(newChainId) {
    console.log('handleSwitchChain', newChainId);
    if (newChainId === state.appChainId) {
      return;
    }
    const network = state.appChains.find(chain => chain.chainId === newChainId);
    if (network) {
      const updatedWallets = { ...state.pkpWallets };
      try {
        const authSig = JSON.parse(localStorage.getItem('lit-auth-signature'));
        const rpcUrl = getRPCUrl(newChainId, state.appChains);
        Object.values(updatedWallets).map(async pkpWallet => {
          await pkpWallet.initialize(authSig, rpcUrl);
        });
      } catch (error) {
        console.error('Error trying to update PKPWallet chain ID:', error);
      }
      dispatch({
        type: 'chain_updated',
        appChainId: newChainId,
        pkpWallets: updatedWallets,
      });
    } else {
      throw Error('Chain not supported');
    }
  }

  async function handleLogout() {
    console.log('handleLogout');

    // Disconnect from all WalletConnect sessions
    const updatedConnectors = { ...state.wcConnectors };
    try {
      Object.values(updatedConnectors).map(async wcConnector => {
        await wcConnector.killSession();
        localStorage.removeItem(`walletconnect_${wcConnector.key}`);
      });
    } catch (error) {
      console.error('Error trying to disconnect from WalletConnect: ', error);
    }

    // Disconnect web3 wallet
    await disconnectAsync();

    // Remove data from local and session storage
    localStorage.removeItem('lit-auth-signature');
    sessionStorage.removeItem(PKPS_STORAGE_KEY);
    localStorage.removeItem(WC_RESULTS_STORAGE_KEY);

    dispatch({ type: 'disconnected', initialState: INITIAL_APP_STATE });
  }

  // Get auth sig if not set in local storage
  useEffect(() => {
    async function getAuthSig(address, signer) {
      dispatch({ type: 'signing_auth' });

      await LitJsSdk.signAndSaveAuthMessage({
        web3: signer.provider,
        account: address,
        chainId: DEFAULT_CHAIN_ID,
      });

      dispatch({ type: 'auth_saved' });
    }

    if (address && signer) {
      const authSig = localStorage.getItem('lit-auth-signature');
      if (!authSig) {
        getAuthSig(address, signer);
      }
    }
  }, [address, signer]);

  // Fetch user's PKPs and initialize PKPWallets if there are any PKPs
  useEffect(() => {
    async function fetchPKPs(address, appChainId, appChains) {
      dispatch({ type: 'fetching_pkps' });

      let myPKPs = JSON.parse(sessionStorage.getItem(PKPS_STORAGE_KEY));
      if (!myPKPs || myPKPs.length === 0) {
        myPKPs = await fetchPKPsByAddress(address);
        sessionStorage.setItem(PKPS_STORAGE_KEY, JSON.stringify(myPKPs));
      }
      console.log('myPKPs ->', myPKPs);

      let currentPKPAddress = null;
      let pkpWallets = {};
      if (myPKPs && myPKPs.length > 0) {
        currentPKPAddress = myPKPs[0].address;

        // Get auth sig from local storage
        const authSig = JSON.parse(localStorage.getItem('lit-auth-signature'));
        const rpcUrl = getRPCUrl(appChainId, appChains);
        for (let i = 0; i < myPKPs.length; i++) {
          const pkp = myPKPs[i];
          const pkpWallet = new PKPWalletController({
            publicKey: pkp.publicKey,
            address: pkp.address,
            tokenId: pkp.tokenId,
          });
          await pkpWallet.initialize(authSig, rpcUrl);
          pkpWallets = {
            ...pkpWallets,
            [pkp.address]: pkpWallet,
          };
        }
      }

      dispatch({
        type: 'pkps_fetched',
        currentPKPAddress: currentPKPAddress,
        pkpWallets: pkpWallets,
      });
    }

    if (address && signer) {
      // Initialize contracts if needed
      if (!litContractsConnected) {
        connectLitContracts(signer);
      }

      // Fetch user's PKPs and initialize PKPWallets
      if (!state.currentPKPAddress) {
        fetchPKPs(address, state.appChainId, state.appChains);
      }
    }
  }, [
    address,
    signer,
    state.currentPKPAddress,
    state.appChainId,
    state.appChains,
  ]);

  // Reconnect to WalletConnect sessions if exists in local storage
  useEffect(() => {
    async function restoreWcSessions(wcSessionKeys) {
      console.log('Restoring WalletConnect sessions');
      wcSessionKeys.map(async sessionKey => {
        const sessionData = JSON.parse(localStorage.getItem(sessionKey));
        await wcConnect({ session: sessionData });
      });
    }
    // Check if cloud wallet exists and there are no WalletConnect sessions
    if (
      state.currentPKPAddress &&
      Object.keys(state.wcConnectors).length === 0
    ) {
      // Reconnect if session data exists in local storage
      const wcSessionKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('walletconnect')
      );
      if (wcSessionKeys.length > 0) {
        restoreWcSessions(wcSessionKeys);
      }
    }
  }, [state.currentPKPAddress, state.wcConnectors]);

  // Reload call request results if found in local storage
  useEffect(() => {
    async function restoreWcResults() {
      const wcResults = JSON.parse(
        localStorage.getItem(WC_RESULTS_STORAGE_KEY)
      );
      if (wcResults) {
        dispatch({
          type: 'restore_results',
          wcResults: wcResults,
        });
      }
    }

    if (Object.keys(state.wcResults).length === 0) {
      restoreWcResults();
    }
  }, [state.wcResults]);

  const actions = {
    wcConnect,
    wcDisconnect,
    wcApproveSession,
    wcRejectSession,
    wcUpdateSession,
    wcApproveRequest,
    wcRejectRequest,
    handleSwitchAddress,
    handleSwitchChain,
    handleLogout,
  };

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        <AppActionsContext.Provider value={actions}>
          {children}
        </AppActionsContext.Provider>
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}

export function useAppActions() {
  return useContext(AppActionsContext);
}
