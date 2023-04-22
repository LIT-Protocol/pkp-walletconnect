import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useAppDispatch, useAppState } from '../context/AppContext';
import useWalletConnect from '../hooks/useWalletConnect';

const LogoutButton = () => {
  const { wcConnector } = useAppState();
  const { wcDisconnect } = useWalletConnect();

  const dispatch = useAppDispatch();

  async function logout() {
    // Reset state
    dispatch({
      type: 'disconnect',
    });

    // Disconnect WalletConnect session
    if (wcConnector && wcConnector.connected === true) {
      await wcDisconnect(wcConnector);
    }
  }

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={async () => await logout()}
            className="ml-2 inline-flex items-center rounded-full border border-transparent p-1.5 sm:p-2 hover:bg-base-1000 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="tooltip__content text-sm"
            side={'bottom'}
            sideOffset={5}
          >
            Logout
            <Tooltip.Arrow className="TooltipArrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default LogoutButton;
