import { createContext, useContext, useEffect, useReducer } from 'react';
import { useAccount, useSigner, useDisconnect } from 'wagmi';
import appReducer from '../reducers/appReducer';
import WalletConnect from '@walletconnect/client';
import LitJsSdk from 'lit-js-sdk';
import { connectLitContracts, litContractsConnected } from '../utils/contracts';
import { getRPCUrl, fetchPKPsByAddress } from '../utils/helpers';
import {
  parseWalletConnectUri,
  convertHexToNumber,
} from '@walletconnect/utils';
import {
  DEFAULT_CHAINS,
  DEFAULT_CHAIN_ID,
  PKPS_STORAGE_KEY,
  WC_RESULTS_STORAGE_KEY,
  AUTH_SIG_STORAGE_KEY,
  CURRENT_PKP_STORAGE_KEY,
} from '../utils/constants';
import { LitPKP } from 'lit-pkp-sdk';
import { useRouter } from 'next/router';
import { mintPKP } from '../utils/contracts';

const INITIAL_APP_STATE = {
  loading: false,
  tab: 1,
  wcConnectors: {},
  wcRequests: [],
  wcResults: {},
  currentPKPAddress: null,
  myPKPs: {},
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

  // App state
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);
  const router = useRouter();

  // Get WalletConnect connector by peer ID
  function getWcConnector(peerId) {
    return state.wcConnectors[peerId];
  }

  // Initialize PKP Wallet from PKP SDK
  async function loadPKPWallet(address, chainId) {
    const pkp = state.myPKPs[address];
    if (!pkp) {
      throw new Error('PKP not found');
    }

    const authSig = localStorage.getItem(AUTH_SIG_STORAGE_KEY);
    if (!authSig) {
      throw new Error('Auth signature not found');
    }
    const controllerAuthSig = JSON.parse(authSig);

    const rpcUrl = getRPCUrl(chainId, state.appChains);
    if (!rpcUrl) {
      throw new Error('RPC URL not found');
    }

    const wallet = new LitPKP({
      pkpPubKey: pkp.publicKey,
      controllerAuthSig: controllerAuthSig,
      provider: rpcUrl,
    });
    await wallet.init();
    return wallet;
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

    console.log('Created connector', wcConnector);

    if (!wcConnector.connected) {
      await wcConnector.createSession();
    }

    if (wcConnector.peerId) {
      dispatch({
        type: 'connector_updated',
        wcConnector: wcConnector,
      });
    }

    // Subscribe to session requests
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

    // Subscribe to call requests
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

    // Subscribe to connection events
    wcConnector.on('connect', (error, payload) => {
      console.log('On WalletConnect connect', payload);
      if (error) {
        throw error;
      }
      dispatch({
        type: 'connector_updated',
        wcConnector: wcConnector,
      });
    });

    // Subscribe to disconnect events
    wcConnector.on('disconnect', async (error, payload) => {
      console.log('On WalletConnect disconnect', wcConnector);
      if (error) {
        throw error;
      }
      dispatch({
        type: 'connector_disconnected',
        wcConnector: wcConnector,
      });
    });
  }

  // Disconnect from WalletConnect client
  async function wcDisconnect(peerId) {
    console.log('Disconnect from WalletConnect', peerId);

    try {
      const wcConnector = getWcConnector(peerId);
      await wcConnector?.killSession();
      localStorage.removeItem(`walletconnect_${wcConnector?.key}`);
    } catch (error) {
      console.error('Error trying to close WalletConnect session: ', error);
    }
  }

  // Approve WalletConnect session
  function wcApproveSession(payload) {
    console.log('Approve WalletConnect session', payload);

    const peerId = payload.params[0].peerId;
    const wcConnector = getWcConnector(peerId);

    try {
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

      dispatch({
        type: 'session_request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    }
  }

  // Reject WalletConnect session
  function wcRejectSession(payload) {
    console.log('Reject WalletConnect session');

    const peerId = payload.params.peerId;
    const wcConnector = getWcConnector(peerId);

    try {
      wcConnector.rejectSession();
      dispatch({
        type: 'session_request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error('Error trying to reject WalletConnect session: ', error);

      dispatch({
        type: 'session_request_handled',
        payload: payload,
        wcConnector: wcConnector,
      });
    }
  }

  // Update WalletConnect session
  function wcUpdateSession(peerId, pkpAddress, chainId) {
    const wcConnector = getWcConnector(peerId);

    try {
      wcConnector.updateSession({
        accounts: [pkpAddress],
        chainId: chainId,
      });
      dispatch({
        type: 'connector_updated',
        wcConnector: wcConnector,
      });
    } catch (error) {
      console.error('Error trying to update WalletConnect session: ', error);

      dispatch({
        type: 'connector_updated',
        wcConnector: wcConnector,
      });
    }
  }

  // Approve request via WalletConnect
  async function wcApproveRequest(payload) {
    console.log('Approve request via WalletConnect', payload);

    const peerId = payload.peerId;
    const wcConnector = getWcConnector(peerId);
    const wcChainId = wcConnector?.chainId;
    const pkpAddress = wcConnector.accounts[0];
    const wallet = await loadPKPWallet(pkpAddress, wcChainId);

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
          wcAddChain(payload.params[0]);
          result = null;
          break;
        case 'wallet_switchEthereumChain':
          // Update WalletConnect session
          const newChainId = convertHexToNumber(payload.params[0].chainId);
          await wcSwitchChain(peerId, newChainId);
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

      console.log('Respond to WalletConnect with: ', wcResult);

      dispatch({
        type: 'call_request_handled',
        wcConnector: wcConnector,
        pkpAddress: pkpAddress,
        payload: payload,
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
        error: err,
      });
    }
  }

  // Add chain to list of app chains
  function wcAddChain(chainParams) {
    const newChain = chainParams;
    const newChainId = convertHexToNumber(newChain.chainId);
    const network = state.appChains.find(chain => chain.chainId === newChainId);
    if (!network) {
      dispatch({ type: 'add_chain', chain: newChain });
    }
    return null;
  }

  // Update WalletConnect session to use new chain ID
  async function wcSwitchChain(peerId, newChainId) {
    const network = state.appChains.find(chain => chain.chainId === newChainId);
    if (network) {
      wcUpdateSession(peerId, state.currentPKPAddress, newChainId);
    } else {
      throw Error('Chain not supported');
    }
    return null;
  }

  // Reject request via WalletConnect
  async function wcRejectRequest(payload) {
    console.log('Reject request via WalletConnect');

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
      error: { message: 'User rejected WalletConnect request' },
    });
  }

  // Use different PKP address
  async function handleSwitchAddress(newAddress) {
    const account = state.myPKPs[newAddress];
    if (account) {
      sessionStorage.setItem(CURRENT_PKP_STORAGE_KEY, newAddress);
      dispatch({ type: 'switch_address', address: newAddress });
    } else {
      throw Error('Account not found');
    }
  }

  // Update app chain ID
  async function handleSwitchChain(newChainId) {
    if (newChainId === state.appChainId) {
      return;
    }
    const network = state.appChains.find(chain => chain.chainId === newChainId);
    if (network) {
      dispatch({
        type: 'switch_chain',
        appChainId: newChainId,
      });
    } else {
      throw Error('Chain not supported');
    }
  }

  // Disconnect all WalletConnect sessions and wagmi connection, and reset state
  async function handleLogout() {
    // Disconnect from all WalletConnect sessions
    const updatedConnectors = { ...state.wcConnectors };
    try {
      Object.values(updatedConnectors).map(async wcConnector => {
        await wcConnector?.killSession();
        localStorage.removeItem(`walletconnect_${wcConnector?.key}`);
      });
    } catch (error) {
      console.error('Error trying to disconnect from WalletConnect: ', error);
    }

    // Disconnect web3 wallet
    await disconnectAsync();

    // Remove data from local and session storage
    localStorage.removeItem(AUTH_SIG_STORAGE_KEY);
    sessionStorage.removeItem(CURRENT_PKP_STORAGE_KEY);
    sessionStorage.removeItem(PKPS_STORAGE_KEY);
    localStorage.removeItem(WC_RESULTS_STORAGE_KEY);

    dispatch({ type: 'disconnected', initialState: INITIAL_APP_STATE });
  }

  // Handle minting PKPs
  async function handleMintPKP() {
    dispatch({ type: 'loading' });

    try {
      // Mint PKP
      const response = await mintPKP();

      // Track new PKP
      const myPKPs = await fetchPKPsByAddress(address);
      sessionStorage.setItem(PKPS_STORAGE_KEY, JSON.stringify(myPKPs));
      let currentPKPAddress = sessionStorage.getItem(CURRENT_PKP_STORAGE_KEY);
      if (!currentPKPAddress && myPKPs && Object.values(myPKPs).length > 0) {
        currentPKPAddress = Object.values(myPKPs)[0].address;
        sessionStorage.setItem(CURRENT_PKP_STORAGE_KEY, currentPKPAddress);
      }

      dispatch({
        type: 'pkps_fetched',
        currentPKPAddress: currentPKPAddress,
        myPKPs: myPKPs,
      });

      router.reload();
    } catch (error) {
      console.error('Error trying to mint PKP: ', error);
      dispatch({ type: 'loaded' });
    }
  }

  // Get auth sig if not set in local storage
  useEffect(() => {
    async function getAuthSig(address, signer) {
      dispatch({ type: 'loading' });

      await LitJsSdk.signAndSaveAuthMessage({
        web3: signer.provider,
        account: address,
        chainId: DEFAULT_CHAIN_ID,
      });

      dispatch({ type: 'loaded' });
    }

    // If auth sig is set, check if it's associated with the current address
    if (address && signer) {
      const authSig = localStorage.getItem(AUTH_SIG_STORAGE_KEY);
      if (
        !authSig ||
        (authSig &&
          JSON.parse(authSig).address.toLowerCase() != address.toLowerCase())
      ) {
        getAuthSig(address, signer);
      }
    }
  }, [address, signer]);

  // Fetch user's PKPs
  useEffect(() => {
    async function fetchPKPs(address) {
      dispatch({ type: 'loading' });

      // Check session storage for user's PKPs
      let myPKPs = null;
      const savedPKPs = sessionStorage.getItem(PKPS_STORAGE_KEY);
      if (savedPKPs) {
        myPKPs = JSON.parse(savedPKPs);
      }
      if (!myPKPs || Object.values(myPKPs).length === 0) {
        myPKPs = await fetchPKPsByAddress(address);
        sessionStorage.setItem(PKPS_STORAGE_KEY, JSON.stringify(myPKPs));
      }

      // Check session storage for current PKP address
      let currentPKPAddress = sessionStorage.getItem(CURRENT_PKP_STORAGE_KEY);
      if (!currentPKPAddress && myPKPs && Object.values(myPKPs).length > 0) {
        currentPKPAddress = Object.values(myPKPs)[0].address;
        sessionStorage.setItem(CURRENT_PKP_STORAGE_KEY, currentPKPAddress);
      }

      dispatch({
        type: 'pkps_fetched',
        currentPKPAddress: currentPKPAddress,
        myPKPs: myPKPs,
      });

      dispatch({ type: 'loaded' });
    }

    if (address && signer) {
      // Initialize contracts if needed
      if (!litContractsConnected) {
        connectLitContracts(signer);
      }

      // Check if PKPs are in local storage
      if (!state.currentPKPAddress) {
        fetchPKPs(address);
      }
    }
  }, [address, signer, state.currentPKPAddress]);

  // Reconnect to WalletConnect sessions if exists in local storage
  useEffect(() => {
    async function restoreWcSessions(wcSessionKeys) {
      wcSessionKeys.map(async sessionKey => {
        const savedSession = localStorage.getItem(sessionKey);
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          await wcConnect({ session: sessionData });
        }
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

  // Reload sent transactions details if found in local storage
  useEffect(() => {
    const storedResults = localStorage.getItem(WC_RESULTS_STORAGE_KEY);
    if (storedResults) {
      const results = JSON.parse(storedResults);
      if (
        results.length > 0 &&
        state.wcResults &&
        Object.keys(state.wcResults).length === 0
      ) {
        dispatch({ type: 'restore_results', wcResults: results });
      }
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
    wcSwitchChain,
    handleSwitchAddress,
    handleSwitchChain,
    handleLogout,
    handleMintPKP,
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
