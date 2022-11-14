import { useState, useCallback, useRef, useEffect } from 'react';
import WalletConnect from '@walletconnect/client';
import {
  getTransactionToSign,
  getTransactionToSend,
  getSignVersionByMessageFormat,
  getSignVersionEnum,
} from '../utils/helpers';
import {
  signMessage,
  signPersonalMessage,
  signTypedData,
  signTransaction,
  sendTransaction,
} from '../utils/lit-client';
import {
  SUPPORTED_CHAINS,
  WC_SESSION_STORAGE_KEY,
  WC_RESULTS_STORAGE_KEY,
} from '../utils/constants';

// Handle WalletConnect request
const handleRequest = async (payload, pubkey, chainId) => {
  let version = null;
  let transaction = null;
  let result = null;

  switch (payload.method) {
    case 'eth_sign':
      result = signMessage(payload.params[1], pubkey);
      break;
    case 'personal_sign':
      result = signPersonalMessage(payload.params[0], pubkey);
      break;
    case 'eth_signTypedData':
      version = getSignVersionByMessageFormat(payload.params[1]);
      result = signTypedData(payload.params[1], version, pubkey);
      break;
    case 'eth_signTypedData_v1':
      version = getSignVersionEnum('v1');
      result = signTypedData(payload.params[1], version, pubkey);
      break;
    case 'eth_signTypedData_v3':
      version = getSignVersionEnum('v3');
      result = signTypedData(payload.params[1], version, pubkey);
      break;
    case 'eth_signTypedData_v4':
      version = getSignVersionEnum('v4');
      result = signTypedData(payload.params[1], version, pubkey);
      break;
    case 'eth_signTransaction':
      transaction = getTransactionToSign(payload.params[0]);
      result = signTransaction(transaction, pubkey);
      break;
    case 'eth_sendTransaction':
      transaction = getTransactionToSend(payload.params[0], chainId);
      result = sendTransaction(transaction, pubkey);
      break;
    default:
      throw new Error('Unsupported WalletConnect method');
  }

  return result;
};

// Reject request with error message
const rejectRequestWithMessage = (wcConnector, payload, message) => {
  wcConnector.rejectRequest({ id: payload.id, error: { message } });
};

// Updated array of pending WalletConnect requests
const addToWcRequests = (payload, requests) => {
  const updatedRequests = [...requests, payload];
  return updatedRequests;
};

// Updated dictionary of completed WalletConnect call requests
const addToWcResults = (result, results) => {
  const updatedResults = { [result.payload.id]: result, ...results };
  return updatedResults;
};

// Remove a request from array of pending WalletConnect requests
const filterWcRequest = (payload, requests) => {
  const filteredRequests = requests.filter(
    request => request.id !== payload.id
  );
  return filteredRequests;
};

const saveResultsToStorage = (address, results) => {
  const savedResults = localStorage.getItem(WC_RESULTS_STORAGE_KEY);
  let newResults;
  if (savedResults) {
    const parsedResults = JSON.parse(savedResults);
    if (parsedResults[address.toLowerCase()]) {
      newResults = parsedResults;
      newResults[address.toLowerCase()] = results;
    } else {
      newResults = { [address.toLowerCase()]: results, ...parsedResults };
    }
  } else {
    newResults = { [address.toLowerCase()]: results };
  }
  localStorage.setItem(WC_RESULTS_STORAGE_KEY, JSON.stringify(newResults));
};

const useWalletConnect = () => {
  const [wcConnector, setWcConnector] = useState(null);
  const [wcSessionRequest, setWcSessionRequest] = useState(null);
  const [wcRequests, _setWcRequests] = useState([]);
  const [wcResults, _setWcResults] = useState({});

  const wcRequestsRef = useRef(wcRequests);
  const setWcRequests = data => {
    wcRequestsRef.current = data;
    _setWcRequests(data);
  };

  const wcResultsRef = useRef(wcResults);
  const setWcResults = data => {
    wcResultsRef.current = data;
    _setWcResults(data);
  };

  // Disconnect from WalletConnect
  const wcDisconnect = useCallback(async () => {
    console.log('Disconnect from WalletConnect');

    try {
      await wcConnector?.killSession();
    } catch (error) {
      console.error('Error trying to close WalletConnect session: ', error);
    }
    localStorage.removeItem(WC_SESSION_STORAGE_KEY);
    setWcConnector(null);
    setWcSessionRequest(null);
    setWcRequests([]);
  }, [wcConnector]);

  // Initialize WalletConnect connector
  const wcConnect = useCallback(
    async ({ uri, session }) => {
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
      setWcConnector(wcConnector);

      if (!wcConnector.connected) {
        wcConnector.createSession();
      }

      console.log('Created connector', wcConnector);

      // Subscribe to connection events
      wcConnector.on('session_request', (error, payload) => {
        console.log('On session_request', payload);

        if (error) {
          throw error;
        }

        console.log('WalletConnect session request', payload);

        setWcSessionRequest(payload);
      });

      wcConnector.on('connect', (error, payload) => {
        console.log('On connect', payload);

        if (error) {
          throw error;
        }

        setWcSessionRequest(null);
      });

      // Subscribe to call_request and approve requests automatically
      wcConnector.on('call_request', async (error, payload) => {
        console.log('On call_request', payload);

        if (error) {
          throw error;
        }

        setWcRequests(addToWcRequests(payload, wcRequestsRef.current));
      });

      wcConnector.on('disconnect', error => {
        if (error) {
          throw error;
        }
        wcDisconnect();
      });
    },
    [wcDisconnect]
  );

  // Approve WalletConnect session
  const wcApproveSession = useCallback(
    async ({ currentPKP, chainId }) => {
      console.log('Approve WalletConnect session');

      try {
        await wcConnector?.approveSession({
          accounts: [currentPKP.ethAddress],
          chainId: chainId,
        });
        setWcConnector(wcConnector);
      } catch (error) {
        console.error('Error trying to approve WalletConnect session: ', error);
      }
    },
    [wcConnector]
  );

  // Reject WalletConnect session
  const wcRejectSession = useCallback(async () => {
    console.log('Reject WalletConnect session');

    try {
      await wcConnector?.rejectSession();
      setWcConnector(wcConnector);
    } catch (error) {
      console.error('Error trying to reject WalletConnect session: ', error);
    }
  }, [wcConnector]);

  // Update WalletConnect session
  const wcUpdateSession = useCallback(
    async ({ currentPKP, chainId }) => {
      try {
        await wcConnector?.updateSession({
          accounts: [currentPKP.ethAddress],
          chainId: chainId,
        });
        setWcConnector(wcConnector);
      } catch (error) {
        console.error('Error trying to update WalletConnect session: ', error);
      }
    },
    [wcConnector]
  );

  // Approve request via WalletConnect
  const wcApproveRequest = useCallback(
    async ({ payload, currentPKP }) => {
      console.log('Approve request via WalletConnect');

      try {
        let result = await handleRequest(
          payload,
          currentPKP.pubkey,
          wcConnector.chainId
        );

        let wcResult = result.hash
          ? result.hash
          : result.raw
          ? result.raw
          : result;

        wcConnector.approveRequest({
          id: payload.id,
          result: wcResult,
        });

        // Add request result to results
        const updatedResults = addToWcResults(
          {
            status: 'success',
            payload: payload,
            result: result,
            error: null,
          },
          wcResultsRef.current
        );
        setWcResults(updatedResults);
        saveResultsToStorage(currentPKP.ethAddress, updatedResults);
      } catch (err) {
        console.log(err);

        rejectRequestWithMessage(wcConnector, payload, err.message);

        // Add request result to results
        const updatedResults = addToWcResults(
          {
            status: 'error',
            payload: payload,
            result: null,
            error: err,
          },
          wcResultsRef.current
        );
        setWcResults(updatedResults);
        saveResultsToStorage(currentPKP.ethAddress, updatedResults);
      } finally {
        // Filter out completed request
        const updatedRequests = filterWcRequest(payload, wcRequestsRef.current);
        setWcRequests(updatedRequests);
      }
    },
    [wcConnector]
  );

  // Reject request via WalletConnect
  const wcRejectRequest = useCallback(
    async ({ payload, currentPKP }) => {
      console.log('Reject request via WalletConnect');

      rejectRequestWithMessage(
        wcConnector,
        payload,
        'User rejected WalletConnect request'
      );

      // Add request result to results
      const updatedResults = addToWcResults(
        {
          status: 'rejected',
          payload: payload,
          result: null,
          error: 'User rejected WalletConnect request',
        },
        wcResultsRef.current
      );
      setWcResults(updatedResults);
      saveResultsToStorage(currentPKP.ethAddress, updatedResults);

      // Filter out completed request
      const updatedRequests = filterWcRequest(payload, wcRequestsRef.current);
      setWcRequests(updatedRequests);
    },
    [wcConnector]
  );

  return {
    wcConnector,
    wcSessionRequest,
    wcRequests,
    wcResults,
    wcConnect,
    wcDisconnect,
    wcApproveSession,
    wcRejectSession,
    wcUpdateSession,
    wcApproveRequest,
    wcRejectRequest,
    setWcResults,
  };
};

export default useWalletConnect;
