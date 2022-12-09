import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '@radix-ui/react-icons';
import { useAppState, useAppActions } from '../context/AppContext';

export default function NetworkMenu() {
  const { appChainId, appChains } = useAppState();
  const { handleSwitchChain } = useAppActions();

  const currentChain = appChains.find(chain => chain.chainId === appChainId);

  const handleValueChange = async value => {
    await handleSwitchChain(value);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="header__btn" aria-label="View networks">
          {currentChain ? currentChain.name : 'Unknown network'}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="dropdownMenu__content" sideOffset={5}>
          <DropdownMenu.Label className="dropdownMenu__label">
            Networks
          </DropdownMenu.Label>

          <DropdownMenu.RadioGroup
            value={appChainId}
            onValueChange={handleValueChange}
          >
            {appChains.length > 0 &&
              appChains.map((chain, index) => (
                <DropdownMenu.RadioItem
                  key={chain.chainId}
                  className="dropdownMenu__radio-item"
                  value={chain.chainId}
                >
                  <DropdownMenu.ItemIndicator className="dropdownMenu__itemIndicator">
                    <CheckIcon />
                  </DropdownMenu.ItemIndicator>
                  {chain.name}
                </DropdownMenu.RadioItem>
              ))}
          </DropdownMenu.RadioGroup>

          <DropdownMenu.Arrow className="dropdownMenu__arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
