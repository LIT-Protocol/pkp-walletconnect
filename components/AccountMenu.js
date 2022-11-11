import { truncate } from '../utils/helpers';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '@radix-ui/react-icons';

export default function AccountMenu({
  address,
  currentPKP,
  myPKPs,
  handleSwitchPKP,
  handleLogout,
}) {
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

          {myPKPs.length > 0 && (
            <DropdownMenu.RadioGroup
              value={currentPKP.ethAddress}
              onValueChange={handleSwitchPKP}
            >
              {myPKPs.map(pkp => (
                <DropdownMenu.RadioItem
                  key={pkp.ethAddress}
                  className="dropdownMenu__radio-item"
                  value={pkp.ethAddress}
                >
                  <DropdownMenu.ItemIndicator className="dropdownMenu__itemIndicator">
                    <CheckIcon />
                  </DropdownMenu.ItemIndicator>
                  {truncate(pkp.ethAddress)}
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
