import { createContext, useContext, useReducer, useEffect } from 'react';
import appReducer from '../reducers/appReducer';
import {
  INITIAL_APP_STATE,
  STATE_KEY,
  WALLETCONNECT_KEY,
} from '../utils/constants';

export const AppContext = createContext(null);
export const AppDispatchContext = createContext(null);

export function AppProvider({ children }) {
  // App state
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);

  useEffect(() => {
    // Check if localStorage is available
    if (typeof localStorage !== 'undefined') {
      // Check if we have a stored state in localStorage
      const storedState = localStorage.getItem(STATE_KEY);
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        dispatch({
          type: 'restore_state',
          storedState: parsedState,
        });

        if (!parsedState.isAuthenticated) {
          // Remove WalletConnect session if not authenticated
          localStorage.removeItem(WALLETCONNECT_KEY);
          dispatch({
            type: 'remove_connector',
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    // Persist state in localStorage every time state changes
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
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
