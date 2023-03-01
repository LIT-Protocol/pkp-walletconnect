import { useAppDispatch } from '../context/AppContext';
import WalletConnect from '@walletconnect/client';
import { WALLETCONNECT_KEY } from '../utils/constants';

const useWalletConnect = () => {
  const dispatch = useAppDispatch();

  // Initialize WalletConnect connector
  async function wcConnect({ uri, session }) {
    // let key = uri ? parseWalletConnectUri(uri).key : session.key;

    const wcConnector = new WalletConnect({
      uri: uri,
      session: session,
      clientMeta: {
        description: 'Lit PKP Wallet',
        url: 'https://litprotocol.com',
        name: 'Lit PKP Wallet',
      },
    });

    // console.log('Created connector', wcConnector);

    if (!wcConnector.connected) {
      await wcConnector.createSession();
    }

    if (wcConnector.peerId) {
      dispatch({
        type: 'update_connector',
        wcConnector: wcConnector,
      });
    }

    // Subscribe to session requests
    wcConnector.on('session_request', (error, payload) => {
      // console.log('On WalletConnect session_request', payload);
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
      // console.log('On WalletConnect call_request', payload);
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
      // console.log('On WalletConnect connect', payload);
      if (error) {
        throw error;
      }
      dispatch({
        type: 'update_connector',
        wcConnector: wcConnector,
      });
    });

    // Subscribe to disconnect events
    wcConnector.on('disconnect', async (error, payload) => {
      // console.log('On WalletConnect disconnect', wcConnector);
      if (error) {
        throw error;
      }
      dispatch({
        type: 'remove_connector',
      });
    });
  }

  async function wcDisconnect(wcConnector) {
    try {
      await wcConnector.killSession();
      localStorage.removeItem(WALLETCONNECT_KEY);
      dispatch({
        type: 'remove_connector',
      });
    } catch (error) {
      console.error('Error trying to close WalletConnect session: ', error);
      dispatch({
        type: 'remove_connector',
      });
    }
  }

  // Update WalletConnect session
  function updateSession(wcConnector, pkpAddress, chainId) {
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

  return { wcConnect, wcDisconnect, updateSession };
};

export default useWalletConnect;
