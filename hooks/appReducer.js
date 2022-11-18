// const INITIAL_APP_STATE = {
//   loading: false,
//   tab: 1,
//   wcConnectors: {},
//   wcRequests: [],
//   wcResults: {},
//   currentPKPAddress: null,
//   pkpWallets: {},
//   appChainId: DEFAULT_CHAIN_ID,
//   appChains: DEFAULT_CHAINS,
// };

export default function appReducer(state, action) {
  console.log('APP REDUCER -', action);

  switch (action.type) {
    case 'update_tab': {
      return {
        ...state,
        tab: action.tab,
      };
    }
    case 'signing_auth': {
      return {
        ...state,
        loading: true,
      };
    }
    case 'auth_saved': {
      return {
        ...state,
        loading: false,
      };
    }
    case 'fetching_pkps': {
      return {
        ...state,
        loading: true,
      };
    }
    case 'pkps_fetched': {
      return {
        ...state,
        loading: false,
        currentPKPAddress: action.currentPKPAddress,
        pkpWallets: action.pkpWallets,
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
    case 'chain_updated': {
      return {
        ...state,
        pkpWallets: action.pkpWallets,
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
    case 'session_updated': {
      const updatedConnectors = updateWcConnector(
        action.wcConnector,
        state.wcConnectors
      );
      return {
        ...state,
        wcConnectors: updatedConnectors,
      };
    }
    case 'session_removed': {
      const updatedConnectors = removeWcConnectorByPeerId(
        action.peerId,
        state.wcConnectors
      );
      const updatedRequests = filterWcRequestByPeerId(
        action.peerId,
        state.wcRequests
      );
      return {
        ...state,
        wcConnectors: updatedConnectors,
        wcRequests: updatedRequests,
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
        status: action.status,
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

function addPKPWallet(pkpWallet, pkpWallets) {
  const updatedPKPWallets = {
    ...pkpWallets,
    [pkpWallet.address]: pkpWallet,
  };
  return updatedPKPWallets;
}

function addChain(chain, chains) {
  const updatedChains = [...chains, chain];
  return updatedChains;
}

function updateWcConnector(wcConnector, wcConnectors) {
  const updatedConnectors = {
    ...wcConnectors,
    [wcConnector.peerId]: wcConnector,
  };
  return updatedConnectors;
}

function removeWcConnectorByPeerId(peerId, wcConnectors) {
  const filteredConnectors = wcConnectors;
  if (filteredConnectors[peerId]) {
    delete filteredConnectors[peerId];
  }
  return filteredConnectors;
}

function addWcRequest(wcRequest, wcRequests) {
  const updatedRequests = [...wcRequests, wcRequest];
  return updatedRequests;
}

function removeWcRequest(payload, wcRequests) {
  const filteredRequests = wcRequests.filter(
    request => request.id !== payload.id
  );
  return filteredRequests;
}

function filterWcRequestByPeerId(peerId, wcRequests) {
  const filteredRequests = wcRequests.filter(
    request => request.peerId !== peerId
  );
  return filteredRequests;
}

function updateResults({
  pkpAddress,
  peerMeta,
  payload,
  status,
  result,
  error,
  wcResults,
}) {
  const newResult = {
    peerMeta: peerMeta,
    payload: payload,
    status: status,
    result: result,
    error: error,
  };

  let updatedResults = wcResults;
  if (updatedResults[pkpAddress]) {
    updatedResults[pkpAddress] = [newResult, ...updatedResults[pkpAddress]];
  } else {
    updatedResults = {
      ...updatedResults,
      [pkpAddress]: [newResult],
    };
  }

  localStorage.setItem(
    'WC_RESULTS_STORAGE_KEY',
    JSON.stringify(updatedResults)
  );

  return updatedResults;
}
