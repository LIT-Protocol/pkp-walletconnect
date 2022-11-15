import { truncate } from '../utils/helpers';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '@radix-ui/react-icons';

export default function AccountMenu({
  ownerAddress,
  address,
  accounts,
  handleSwitchAddress,
  handleLogout,
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <span className="header__btn" aria-label="View account options">
          {truncate(ownerAddress)}
        </span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="dropdownMenu__content" sideOffset={5}>
          <DropdownMenu.Label className="dropdownMenu__label">
            Signed in as {truncate(ownerAddress)}
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="dropdownMenu__separator" />

          <DropdownMenu.Label className="dropdownMenu__label">
            My cloud wallets
          </DropdownMenu.Label>

          {accounts.length > 0 && (
            <DropdownMenu.RadioGroup
              value={address}
              onValueChange={handleSwitchAddress}
            >
              {accounts.map(account => (
                <DropdownMenu.RadioItem
                  key={account.address}
                  className="dropdownMenu__radio-item"
                  value={account.address}
                >
                  <DropdownMenu.ItemIndicator className="dropdownMenu__itemIndicator">
                    <CheckIcon />
                  </DropdownMenu.ItemIndicator>
                  {truncate(account.address)}
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
