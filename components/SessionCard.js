import Link from 'next/link';
import { useAppActions, useAppState } from '../context/AppContext';
import { truncate, getChain } from '../utils/helpers';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CheckIcon, DotsVerticalIcon } from '@radix-ui/react-icons';

export default function SessionCard({ wcConnector }) {
  const { appChains } = useAppState();
  const { wcSwitchChain, wcDisconnect } = useAppActions();
  const peerMeta = wcConnector.peerMeta;
  const chain = getChain(wcConnector.chainId, appChains);

  async function updateWcChain(chainId) {
    await wcSwitchChain(wcConnector.peerId, chainId);
  }

  async function handleDisconnect() {
    await wcDisconnect(wcConnector.peerId);
  }

  return (
    <div className="session-card">
      <div className="session-card__info">
        {peerMeta?.icons.length > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="session-card__icon"
            src={peerMeta.icons[0]}
            alt={peerMeta.name ? peerMeta.name : 'Unknown app'}
          />
        )}
        <div>
          <div className="session-card__title">
            <h4>{peerMeta?.name ? peerMeta.name : 'Unknown app'}</h4>
            {chain && (
              <span className="session-card__network">{chain.name}</span>
            )}
          </div>
          {peerMeta?.url ? (
            <Link href={peerMeta.url} passHref legacyBehavior>
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="session-card__link"
              >
                {peerMeta.url}
              </a>
            </Link>
          ) : (
            <span className="session-card__no-link">No link provided</span>
          )}
        </div>
      </div>
      {/* <button
        className="session-card__btn"
        onClick={() => wcDisconnect(wcConnector.peerId)}
      >
        Disconnect
      </button> */}
      <SessionOptions
        currentChainId={wcConnector.chainId}
        appChains={appChains}
        updateWcChain={updateWcChain}
        handleDisconnect={handleDisconnect}
      />
    </div>
  );
}

function SessionOptions({
  appChains,
  currentChainId,
  updateWcChain,
  handleDisconnect,
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="session-card__button"
          aria-label="Update WalletConnect session"
        >
          <DotsVerticalIcon />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="dropdownMenu__content" sideOffset={5}>
          <DropdownMenu.Label className="dropdownMenu__label">
            Networks
          </DropdownMenu.Label>

          {Object.keys(appChains).length > 0 && (
            <DropdownMenu.RadioGroup
              value={currentChainId}
              onValueChange={updateWcChain}
            >
              {Object.values(appChains).map(chain => (
                <DropdownMenu.RadioItem
                  key={`chain_${chain.chainId}`}
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
          )}

          <DropdownMenu.Separator className="dropdownMenu__separator" />

          <DropdownMenu.Item
            className="dropdownMenu__item"
            onClick={handleDisconnect}
          >
            Disconnect
          </DropdownMenu.Item>

          <DropdownMenu.Arrow className="dropdownMenu__arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
