import Link from 'next/link';
import { useAppActions, useAppState } from '../context/AppContext';
import { truncate, getChain } from '../utils/helpers';

export default function SessionCard({ wcConnector }) {
  const { appChains } = useAppState();
  const { wcDisconnect } = useAppActions();
  const peerMeta = wcConnector.peerMeta;
  const chain = getChain(wcConnector.chainId, appChains);

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
      <button
        className="session-card__btn"
        onClick={() => wcDisconnect(wcConnector.peerId)}
      >
        Disconnect
      </button>
    </div>
  );
}
