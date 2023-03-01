import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAppDispatch, useAppState } from '../context/AppContext';
import useWalletConnect from '../hooks/useWalletConnect';
import { getChain, getNetworkIcon } from '../utils/helpers';

export default function dropdownMenu({ dropdownMenuContainer }) {
  const { appChainId, appChains, wcConnector } = useAppState();
  const dispatch = useAppDispatch();

  const currentChain = getChain(appChainId, appChains);
  const prodNetworks = appChains.filter(chain => !chain.testNetwork);
  const testNetworks = appChains.filter(chain => chain.testNetwork);

  const { updateSession } = useWalletConnect();

  function handleValueChange(value) {
    const newChainId = parseInt(value);
    const network = getChain(newChainId, appChains);
    if (network) {
      dispatch({
        type: 'switch_chain',
        appChainId: newChainId,
      });
      if (wcConnector && wcConnector.connected) {
        const wcEthAddress = wcConnector.accounts[0];
        updateSession(wcConnector, wcEthAddress, newChainId);
      }
    } else {
      throw Error('Chain not supported');
    }
    return null;
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="inline-flex items-center rounded-md border border-base-900 bg-root-dark px-3 py-2 text-xs sm:text-sm text-base-400 hover:bg-base-1000 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="View networks"
        >
          {getNetworkIcon(currentChain.chainId) ? (
            <img
              src={getNetworkIcon(currentChain.chainId)}
              alt={`${currentChain.name} logo`}
              className="w-5 h-5 rounded-full mr-2"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-5 h-5 mr-2 bg-base-900 text-base-200 rounded-full text-xs">
              <span>{currentChain.name[0]}</span>
            </div>
          )}
          <span>{currentChain ? currentChain.name : 'Unknown network'}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-4 h-4 ml-2 text-base-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal container={dropdownMenuContainer}>
        <DropdownMenu.Content className="dropdownMenu__content" sideOffset={5}>
          <DropdownMenu.Label className="pl-6 text-sm text-base-500 mb-1">
            Networks
          </DropdownMenu.Label>

          {appChains.length > 0 && (
            <DropdownMenu.RadioGroup
              value={appChainId}
              onValueChange={handleValueChange}
            >
              {prodNetworks.map((chain, index) => (
                <DropdownMenu.RadioItem
                  key={chain.chainId}
                  className="dropdownMenu__radioItem text-sm flex items-center pt-2 pr-2 pb-2 pl-6 relative select-none outline-none"
                  value={chain.chainId}
                >
                  <DropdownMenu.ItemIndicator className="absolute left-0 flex items-center justify-center pl-1 pr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </DropdownMenu.ItemIndicator>
                  {getNetworkIcon(chain.chainId) ? (
                    <img
                      src={getNetworkIcon(chain.chainId)}
                      alt={`${chain.name} logo`}
                      className="w-5 h-5 rounded-full mr-2"
                    />
                  ) : (
                    <div className="inline-flex items-center justify-center w-5 h-5 mr-2 bg-base-900 text-base-200 rounded-full text-xs">
                      <span>{chain.name[0]}</span>
                    </div>
                  )}
                  <span>{chain.name}</span>
                </DropdownMenu.RadioItem>
              ))}

              {testNetworks.map((chain, index) => (
                <DropdownMenu.RadioItem
                  key={chain.chainId}
                  className="dropdownMenu__radioItem text-sm flex items-center pt-2 pr-2 pb-2 pl-6 relative select-none outline-none"
                  value={chain.chainId}
                >
                  <DropdownMenu.ItemIndicator className="absolute left-0 flex items-center justify-center pl-1 pr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </DropdownMenu.ItemIndicator>
                  {getNetworkIcon(chain.chainId) ? (
                    <img
                      src={getNetworkIcon(chain.chainId)}
                      alt={`${chain.name} logo`}
                      className="w-5 h-5 rounded-full mr-2"
                    />
                  ) : (
                    <div className="inline-flex items-center justify-center w-5 h-5 mr-2 bg-base-900 text-base-200 rounded-full text-xs">
                      <span>{chain.name[0]}</span>
                    </div>
                  )}
                  <span>{chain.name}</span>
                  <span className="inline-flex items-center rounded-full bg-base-800 text-base-400 text-xs ml-2 px-2 py-0.5">
                    Test
                  </span>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          )}

          <DropdownMenu.Arrow className="dropdownMenu__arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
