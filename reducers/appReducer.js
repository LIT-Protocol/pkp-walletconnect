import { INITIAL_APP_STATE } from '../utils/constants';

// Handle all actions dispatched and update state accordingly
export default function appReducer(state, action) {
  switch (action.type) {
    case 'restore_state': {
      return action.storedState;
    }
    case 'authenticated': {
      return {
        ...state,
        isAuthenticated: action.isAuthenticated,
        currentUsername: action.currentUsername,
        currentPKP: action.currentPKP,
        sessionSigs: action.sessionSigs,
        sessionExpiration: action.sessionExpiration,
      };
    }
    case 'disconnect': {
      return INITIAL_APP_STATE;
    }
    case 'update_connector': {
      return {
        ...state,
        wcConnector: action.wcConnector,
      };
    }
    case 'remove_connector': {
      return {
        ...state,
        wcConnector: null,
        wcRequests: [],
      };
    }
    case 'pending_request': {
      const updatedRequests = addWcRequest(action.payload, state.wcRequests);
      return {
        ...state,
        wcConnector: action.wcConnector,
        wcRequests: updatedRequests,
      };
    }
    case 'request_handled': {
      const updatedRequests = removeWcRequest(action.payload, state.wcRequests);
      return {
        ...state,
        wcConnector: action.wcConnector,
        wcRequests: updatedRequests,
      };
    }
    case 'switch_chain': {
      return {
        ...state,
        appChainId: action.appChainId,
        wcConnector: action.wcConnector,
      };
    }
    case 'add_chain': {
      const updatedChains = addChain(action.newChain, state.appChains);
      return {
        ...state,
        appChains: updatedChains,
      };
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

// Add WalletConnect pending request
function addWcRequest(wcRequest, wcRequests) {
  const updatedRequests = [...wcRequests, wcRequest];
  return updatedRequests;
}

// Removing WalletConnect pending request
function removeWcRequest(payload, wcRequests) {
  if (payload) {
    const filteredRequests = wcRequests.filter(
      request => request.id !== payload.id
    );
    return filteredRequests;
  } else {
    return wcRequests;
  }
}

// Update chains
function addChain(chain, chains) {
  const updatedChains = [...chains, chain];
  return updatedChains;
}
