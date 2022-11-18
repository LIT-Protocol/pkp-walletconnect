import { truncate } from '../utils/helpers';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '@radix-ui/react-icons';
import { useAppState, useAppActions } from '../context/AppContext';
import { useAccount } from 'wagmi';

export default function AccountMenu() {
  const { address } = useAccount();
  const { currentPKPAddress, pkpWallets } = useAppState();
  const { handleSwitchAddress, handleLogout } = useAppActions();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <span className="header__btn" aria-label="View account options">
          {truncate(address)}
        </span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="dropdownMenu__content" sideOffset={5}>
          <DropdownMenu.Label className="dropdownMenu__label">
            Signed in as {truncate(address)}
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="dropdownMenu__separator" />

          <DropdownMenu.Label className="dropdownMenu__label">
            My cloud wallets
          </DropdownMenu.Label>

          {Object.keys(pkpWallets).length > 0 && (
            <DropdownMenu.RadioGroup
              value={currentPKPAddress}
              onValueChange={handleSwitchAddress}
            >
              {Object.keys(pkpWallets).map(pkpAddress => (
                <DropdownMenu.RadioItem
                  key={pkpAddress}
                  className="dropdownMenu__radio-item"
                  value={pkpAddress}
                >
                  <DropdownMenu.ItemIndicator className="dropdownMenu__itemIndicator">
                    <CheckIcon />
                  </DropdownMenu.ItemIndicator>
                  {truncate(pkpAddress)}
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          )}

          <DropdownMenu.Separator className="dropdownMenu__separator" />

          <DropdownMenu.Item
            className="dropdownMenu__item"
            onClick={handleLogout}
          >
            Sign out
          </DropdownMenu.Item>

          <DropdownMenu.Arrow className="dropdownMenu__arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
