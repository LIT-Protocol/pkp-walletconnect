import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '@radix-ui/react-icons';

export default function NetworkMenu({ chainId, chains, handleSwitchChain }) {
  const currentChain = chains.find(chain => chain.chainId === chainId);

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
            value={chainId}
            onValueChange={handleSwitchChain}
          >
            {chains.length > 0 &&
              chains.map((chain, index) => (
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
