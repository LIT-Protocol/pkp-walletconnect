import { WC_RESULTS_STORAGE_KEY } from '../utils/constants';

// const INITIAL_APP_STATE = {
//   loading: false,
//   tab: 1,
//   wcConnectors: {},
//   wcRequests: [],
//   wcResults: {},
//   currentPKPAddress: null,
//   myPKPs: {},
//   appChainId: DEFAULT_CHAIN_ID,
//   appChains: DEFAULT_CHAINS,
// };

// Handle all actions dispatched and update state accordingly
export default function appReducer(state, action) {
  switch (action.type) {
    case 'update_tab': {
      return {
        ...state,
        tab: action.tab,
      };
    }
    case 'loading': {
      return {
        ...state,
        loading: true,
      };
    }
    case 'loaded': {
      return {
        ...state,
        loading: false,
      };
    }
    case 'pkps_fetched': {
      return {
        ...state,
        currentPKPAddress: action.currentPKPAddress,
        myPKPs: action.myPKPs,
      };
    }
    case 'restore_results': {
      return {
        ...state,
        wcResults: action.wcResults,
      };
    }
    case 'disconnected': {
      return action.initialState;
    }
    case 'switch_address': {
      return {
        ...state,
        currentPKPAddress: action.currentPKPAddress,
      };
    }
    case 'switch_chain': {
      return {
        ...state,
        appChainId: action.appChainId,
      };
    }
    case 'add_chain': {
      const updatedChains = addChain(action.chain, state.appChains);
      return {
        ...state,
        appChains: updatedChains,
      };
    }
    case 'connector_updated': {
      const updatedConnectors = updateWcConnector(
        action.wcConnector,
        state.wcConnectors
      );
      return {
        ...state,
        wcConnectors: updatedConnectors,
      };
    }
    case 'connector_disconnected': {
      const filteredConnectors = removeWcConnector(
        action.wcConnector,
        state.wcConnectors
      );
      return {
        ...state,
        wcConnectors: filteredConnectors,
      };
    }
    case 'pending_request': {
      const updatedRequests = addWcRequest(action.payload, state.wcRequests);
      const updatedConnectors = updateWcConnector(
        action.wcConnector,
        state.wcConnectors
      );
      return {
        ...state,
        wcConnectors: updatedConnectors,
        wcRequests: updatedRequests,
      };
    }
    case 'session_request_handled': {
      const updatedConnectors = updateWcConnector(
        action.wcConnector,
        state.wcConnectors
      );
      const updatedRequests = removeWcRequest(action.payload, state.wcRequests);
      return {
        ...state,
        tab: 1,
        wcConnectors: updatedConnectors,
        wcRequests: updatedRequests,
      };
    }
    case 'call_request_handled': {
      const updatedConnectors = updateWcConnector(
        action.wcConnector,
        state.wcConnectors
      );
      const updatedRequests = removeWcRequest(action.payload, state.wcRequests);
      const updatedResults = updateResults({
        pkpAddress: action.pkpAddress,
        peerMeta: action.wcConnector.peerMeta,
        payload: action.payload,
        result: action.result,
        error: action.error,
        wcResults: state.wcResults,
      });

      return {
        ...state,
        wcConnectors: updatedConnectors,
        wcRequests: updatedRequests,
        wcResults: updatedResults,
      };
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

// Update chains
function addChain(chain, chains) {
  const updatedChains = [...chains, chain];
  return updatedChains;
}

// Update WalletConnect client
function updateWcConnector(wcConnector, wcConnectors) {
  const updatedConnectors = {
    ...wcConnectors,
    [wcConnector.peerId]: wcConnector,
  };
  return updatedConnectors;
}

// Remove WalletConnect client
function removeWcConnector(wcConnector, wcConnectors) {
  let filteredConnectors = wcConnectors;
  const connectorToRemove = Object.values(wcConnectors).find(
    connector => connector.peerMeta?.url === wcConnector.peerMeta?.url
  );
  if (connectorToRemove && connectorToRemove.peerMeta?.url) {
    Object.keys(filteredConnectors).forEach(key => {
      if (
        filteredConnectors[key].peerMeta?.url === connectorToRemove.peerMeta.url
      ) {
        delete filteredConnectors[key];
      }
    });
  }
  return filteredConnectors;
}

// Add WalletConnect pending request
function addWcRequest(wcRequest, wcRequests) {
  const updatedRequests = [...wcRequests, wcRequest];
  return updatedRequests;
}

// Removing WalletConnect pending request
function removeWcRequest(payload, wcRequests) {
  const filteredRequests = wcRequests.filter(
    request => request.id !== payload.id
  );
  return filteredRequests;
}

// Save WalletConnect results for signing txns
function updateResults({
  pkpAddress,
  peerMeta,
  payload,
  result,
  error,
  wcResults,
}) {
  const newResult = {
    peerMeta: peerMeta,
    payload: payload,
    result: result,
  };

  let updatedResults = wcResults;
  // Save only successfully sent transactions
  if (payload?.method === 'eth_sendTransaction' && result && !error) {
    if (updatedResults[pkpAddress]) {
      updatedResults[pkpAddress] = [newResult, ...updatedResults[pkpAddress]];
    } else {
      updatedResults = {
        ...updatedResults,
        [pkpAddress]: [newResult],
      };
    }
  }

  localStorage.setItem(WC_RESULTS_STORAGE_KEY, JSON.stringify(updatedResults));

  return updatedResults;
}
