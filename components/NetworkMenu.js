import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '@radix-ui/react-icons';
import { SUPPORTED_CHAINS } from '../utils/constants';

export default function NetworkMenu({ chainId, handleSwitchChain }) {
  const chains = SUPPORTED_CHAINS;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="header__btn" aria-label="View networks">
          {chains[chainId].name}
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
            {Object.keys(chains).length > 0 &&
              Object.entries(chains).map((entry, index) => (
                <DropdownMenu.RadioItem
                  key={chains[entry[0]].chain_id}
                  className="dropdownMenu__radio-item"
                  value={chains[entry[0]].chain_id}
                >
                  <DropdownMenu.ItemIndicator className="dropdownMenu__itemIndicator">
                    <CheckIcon />
                  </DropdownMenu.ItemIndicator>
                  {chains[entry[0]].name}
                </DropdownMenu.RadioItem>
              ))}
          </DropdownMenu.RadioGroup>

          <DropdownMenu.Arrow className="dropdownMenu__arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
