import { useState, useCallback, useEffect } from 'react';
import WalletConnect from '@walletconnect/client';
import {
  getMessageToSign,
  getPersonalMessageToSign,
  getTypedDataToSign,
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
      transaction = payload.params[0];
      result = signTransaction(transaction, pubkey);
      break;
    case 'eth_sendTransaction':
      const provider = new ethers.providers.JsonRpcProvider(WC_RPC_URL);
      transaction = payload.params[0];
      result = sendTransaction(transaction, pubkey, provider);
      break;
    default:
      throw new Error('Unsupported WalletConnect method');
      break;
  }

  return result;
};

// Reject request with error message
const rejectRequestWithMessage = (wcConnector, payload, message) => {
  wcConnector.rejectRequest({ id: payload.id, error: { message } });
};

const useWalletConnect = () => {
  const [wcConnector, setWcConnector] = useState();
  const [wcConnected, setWcConnected] = useState(false);
  const [wcPeerMeta, setWcPeerMeta] = useState(null);
  const [wcSessions, setWcSessions] = useState([]);
  const [wcRequests, setWcRequests] = useState([]);

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
      setWcSessions([]);
      setWcRequests([]);
    } catch (error) {
      console.log('Error trying to close WalletConnect session: ', error);
    }
  }, [wcConnector]);

  // Initialize WalletConnect connector
  const wcConnect = useCallback(
    async ({ uri }) => {
      console.log('wcConnect', uri);
      const wcConnector = new WalletConnect({
        uri: uri,
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

        try {
          let result = await handleRequest(payload, currentPKP.pubkey);

          wcConnector.approveRequest({
            id: payload.id,
            result: result,
          });

          setWcRequests([
            ...wcRequests,
            {
              status: 'success',
              payload: payload,
              result: result,
              error: null,
            },
          ]);
        } catch (err) {
          rejectRequestWithMessage(wcConnector, payload, err.message);

          setWcRequests([
            ...wcRequests,
            { status: 'error', payload: payload, result: null, error: error },
          ]);
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
    [wcDisconnect, wcRequests]
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

        if (wcConnector?.peerMeta) {
          setWcSessions([...wcSessions, wcConnector.peerMeta]);
        }
      } catch (error) {
        console.log('Error trying to approve WalletConnect session: ', error);
      }
    },
    [wcConnector, wcSessions]
  );

  // Reject session request
  const wcRejectSession = useCallback(async () => {
    console.log('Rejecting WalletConnect session');

    try {
      await wcConnector?.rejectSession();

      const filteredSessions = wcSessions.filter(
        session => session.name !== wcPeerMeta?.name
      );
      setWcSessions(filteredSessions);
      setWcPeerMeta(null);
    } catch (error) {
      console.log('Error trying to reject WalletConnect session: ', error);
    }
  }, [wcConnector, wcPeerMeta, wcSessions]);

  useEffect(() => {
    // Check if there is a WalletConnect URI in local storage
    if (!wcConnector) {
      const wcSession = localStorage.getItem(WC_URI_KEY);
      if (wcSession) {
        wcConnect({ session: JSON.parse(wcSession) });
      }
    }
  }, [wcConnector, wcConnect]);

  return {
    wcPeerMeta,
    wcSessions,
    wcRequests,
    wcConnect,
    wcDisconnect,
    wcApproveSession,
    wcRejectSession,
  };
};

export default useWalletConnect;
