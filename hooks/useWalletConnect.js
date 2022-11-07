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
} from '../utils/lit-client';

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

// Add to dictionary of WalletConnect call requests
const addToWcRequests = (request, requests) => {
  const updatedDictionary = { [request.payload.id]: request, ...requests };
  return updatedDictionary;
};

// Update dictionary of WalletConnect call requests
const updateWcRequest = (request, requests) => {
  const updatedDictionary = { ...requests };
  updatedDictionary[request.payload.id] = request;
  return updatedDictionary;
};

const useWalletConnect = () => {
  const [wcStatus, setWcStatus] = useState('disconnected');
  const [wcConnector, setWcConnector] = useState(null);
  const [wcPendingRequest, setWcPendingRequest] = useState(null);
  const [wcRequests, _setWcRequests] = useState({});

  const wcRequestsRef = useRef(wcRequests);
  const setWcRequests = data => {
    wcRequestsRef.current = data;
    _setWcRequests(data);
  };

  // Disconnect from WalletConnect
  const wcDisconnect = useCallback(async () => {
    console.log('Disconnect from WalletConnect');

    try {
      await wcConnector?.killSession();
      localStorage.removeItem(WC_URI_KEY);
      setWcStatus('disconnected');
      setWcConnector(null);
      setWcRequests([]);
    } catch (error) {
      console.error('Error trying to close WalletConnect session: ', error);
    }
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
        storageId: WC_URI_KEY,
      });
      setWcConnector(wcConnector);
      setWcStatus(wcConnector.connected ? 'connected' : 'connecting');

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

        // wcConnector.approveSession({
        //   accounts: [currentPKP?.ethAddress],
        //   chainId: WC_CHAIN_ID,
        // });
        setWcStatus('session_request');
      });

      wcConnector.on('connect', (error, payload) => {
        console.log('On connect', payload);

        if (error) {
          throw error;
        }

        setWcStatus('connected');
      });

      // Subscribe to call_request and approve requests automatically
      wcConnector.on('call_request', async (error, payload) => {
        console.log('On call_request', payload);

        if (error) {
          throw error;
        }

        setWcRequests(
          addToWcRequests(
            { status: 'pending', payload: payload, result: null, error: null },
            wcRequestsRef.current
          )
        );
        setWcPendingRequest(payload.id);
        setWcStatus('call_request');
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
    async ({ currentPKP }) => {
      console.log('Approve WalletConnect session');

      try {
        await wcConnector?.approveSession({
          accounts: [currentPKP?.ethAddress],
          chainId: WC_CHAIN_ID,
        });
        setWcConnector(wcConnector);
        setWcStatus('session_request_approved');
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
      setWcStatus('session_request_rejected');
    } catch (error) {
      console.error('Error trying to reject WalletConnect session: ', error);
    }
  }, [wcConnector]);

  // Approve request via WalletConnect
  const wcApproveRequest = useCallback(
    async ({ payload, currentPKP }) => {
      console.log('Approve request via WalletConnect');

      try {
        let result = await handleRequest(payload, currentPKP?.pubkey);

        wcConnector.approveRequest({
          id: payload.id,
          result: result,
        });

        setWcRequests(
          updateWcRequest(
            {
              status: 'success',
              payload: payload,
              result: result,
              error: null,
            },
            wcRequestsRef.current
          )
        );
        setWcPendingRequest(null);
        setWcStatus('call_request_approved');
      } catch (err) {
        rejectRequestWithMessage(wcConnector, payload, err.message);

        setWcRequests(
          updateWcRequest(
            {
              status: 'error',
              payload: payload,
              result: null,
              error: err,
            },
            wcRequestsRef.current
          )
        );
        setWcPendingRequest(null);
        setWcStatus('call_request_rejected');
      }
    },
    [wcConnector]
  );

  // Reject request via WalletConnect
  const wcRejectRequest = useCallback(
    async ({ payload }) => {
      console.log('Reject request via WalletConnect');

      rejectRequestWithMessage(
        wcConnector,
        payload,
        'User rejected WalletConnect request'
      );

      setWcRequests(
        updateWcRequest(
          {
            status: 'rejected',
            payload: payload,
            result: null,
            error: 'User rejected WalletConnect request',
          },
          wcRequestsRef.current
        )
      );
      setWcPendingRequest(null);
      setWcStatus('call_request_rejected');
    },
    [wcConnector]
  );

  return {
    wcStatus,
    wcConnector,
    wcPendingRequest,
    wcRequests,
    wcConnect,
    wcDisconnect,
    wcApproveSession,
    wcRejectSession,
    wcApproveRequest,
    wcRejectRequest,
  };
};

export default useWalletConnect;
