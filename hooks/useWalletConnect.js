import { useState, useCallback, useEffect, useRef } from 'react';
import WalletConnect from '@walletconnect/client';
import {
  getMessageToSign,
  getPersonalMessageToSign,
  getTypedDataToSign,
  getTransactionToSign,
  getTransactionToSend,
} from '../utils/helpers';
import {
  signMessage,
  signPersonalMessage,
  signTransaction,
  sendTransaction,
} from '../utils/lit';
import useAppContext from './useAppContext';

const WC_URI_KEY = 'test_dapp_wc_uri';
const WC_CHAIN_ID = 80001;
const WC_RPC_URL = 'https://matic-mumbai.chainstacklabs.com';

// Handle WalletConnect request
const handleRequest = async (payload, pubkey) => {
  let message = null;
  let transaction = null;
  let result = null;

  switch (payload.method) {
    case 'eth_sign':
      message = getMessageToSign(payload.params[1]);
      result = signMessage(message, pubkey);
      break;
    case 'personal_sign':
      message = getPersonalMessageToSign(payload.params[0]);
      result = signPersonalMessage(message, pubkey);
      break;
    case 'eth_signTypedData':
      message = getTypedDataToSign(payload.params[1]);
      result = signMessage(message, pubkey);
      break;
    case 'eth_signTransaction':
      transaction = getTransactionToSign(payload.params[0]);
      result = signTransaction(transaction, pubkey);
      break;
    case 'eth_sendTransaction':
      transaction = getTransactionToSend(payload.params[0], WC_CHAIN_ID);
      result = sendTransaction(transaction, pubkey, WC_RPC_URL);
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

// Update list of WalletConnect call requests
const addToWcRequests = (request, requests) => {
  const updatedList = [...requests, request];
  return updatedList;
};

// Update list of WalletConnect call request results
const addToWcResults = (result, results) => {
  const updatedList = [...results, result];
  return updatedList;
};

// Filter out completed WalletConnect call request
const filterOutWcRequest = (id, requests) => {
  const updatedList = requests.filter(request => request.payload.id !== id);
  return updatedList;
};

const useWalletConnect = () => {
  const [wcConnector, setWcConnector] = useState();
  const [wcConnected, setWcConnected] = useState(false);
  const [wcPeerMeta, setWcPeerMeta] = useState(null);
  const [wcRequests, _setWcRequests] = useState([]);
  const [wcResults, _setWcResults] = useState([]);

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

  const { currentPKP } = useAppContext();

  // Disconnect from WalletConnect
  const wcDisconnect = useCallback(async () => {
    console.log('Disconnect from WalletConnect');

    try {
      await wcConnector?.killSession();
      localStorage.removeItem(WC_URI_KEY);
      setWcConnector(undefined);
      setWcConnected(false);
      setWcPeerMeta(null);
      setWcRequests([]);
      setWcResults([]);
    } catch (error) {
      console.log('Error trying to close WalletConnect session: ', error);
    }
  }, [wcConnector]);

  // Initialize WalletConnect connector
  const wcConnect = useCallback(
    async ({ uri, session }) => {
      console.log('wcConnect', uri);
      const wcConnector = new WalletConnect({
        uri: uri,
        session: session,
        clientMeta: {
          description: 'Lit PKP Wallet',
          url: 'https://litprotocol.com',
          name: 'Lit PKP Wallet',
        },
        storageId: WC_URI_KEY,
      });
      setWcConnector(wcConnector);
      setWcPeerMeta(wcConnector.peerMeta);

      console.log('Created connector', wcConnector);

      // Subscribe to connection events
      wcConnector.on('session_request', (error, payload) => {
        console.log('On session_request', payload);

        if (error) {
          throw error;
        }

        wcConnector.approveSession({
          accounts: [currentPKP.ethAddress],
          chainId: WC_CHAIN_ID,
        });

        setWcPeerMeta(payload.params[0].peerMeta);
      });

      // Subscribe to call_request and approve requests automatically
      wcConnector.on('call_request', async (error, payload) => {
        console.log('On call_request', payload);

        if (error) {
          throw error;
        }

        setWcRequests(
          addToWcRequests({ payload: payload }, wcRequestsRef.current)
        );

        try {
          let result = await handleRequest(payload, currentPKP.pubkey);

          wcConnector.approveRequest({
            id: payload.id,
            result: result,
          });

          setWcResults(
            addToWcResults(
              {
                status: 'success',
                payload: payload,
                result: result,
                error: null,
              },
              wcResultsRef.current
            )
          );
        } catch (err) {
          rejectRequestWithMessage(wcConnector, payload, err.message);

          setWcResults(
            addToWcResults(
              {
                status: 'success',
                payload: payload,
                result: null,
                error: err,
              },
              wcResultsRef.current
            )
          );
        } finally {
          setWcRequests(filterOutWcRequest(payload.id, wcRequestsRef.current));
        }
      });

      wcConnector.on('connect', (error, payload) => {
        if (error) {
          throw error;
        }
        setWcConnected(true);
      });

      wcConnector.on('disconnect', error => {
        if (error) {
          throw error;
        }
        wcDisconnect();
      });
    },
    [currentPKP, wcDisconnect]
  );

  // Approve session request
  const wcApproveSession = useCallback(
    async ethAddress => {
      console.log('Approve session request');

      try {
        await wcConnector?.approveSession({
          accounts: [ethAddress],
          chainId: WC_CHAIN_ID,
        });
      } catch (error) {
        console.log('Error trying to approve WalletConnect session: ', error);
      }
    },
    [wcConnector]
  );

  // Reject session request
  const wcRejectSession = useCallback(async () => {
    console.log('Rejecting WalletConnect session');

    try {
      await wcConnector?.rejectSession();

      setWcPeerMeta(null);
    } catch (error) {
      console.log('Error trying to reject WalletConnect session: ', error);
    }
  }, [wcConnector, wcPeerMeta]);

  useEffect(() => {
    // Check if there is a WalletConnect URI in local storage
    if (!wcConnector) {
      const wcSession = localStorage.getItem(WC_URI_KEY);
      if (wcSession) {
        console.log('wcSession', JSON.parse(wcSession));
        wcConnect({ session: JSON.parse(wcSession) });
      }
    }
  }, [wcConnector, wcConnect]);

  return {
    wcConnected,
    wcPeerMeta,
    wcRequests,
    wcResults,
    wcConnect,
    wcDisconnect,
    wcApproveSession,
    wcRejectSession,
  };
};

export default useWalletConnect;
