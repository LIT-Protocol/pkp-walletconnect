import Link from 'next/link';
import { useAppActions } from '../context/AppContext';

export default function SessionRequest({ payload }) {
  const wcPeerMeta = payload.params[0].peerMeta;
  const { wcApproveSession, wcRejectSession } = useAppActions();

  return (
    <main className="container">
      <div className="request">
        <div className="request__body">
          {wcPeerMeta?.icons.length > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="request__icon"
              src={wcPeerMeta.icons[0]}
              alt={wcPeerMeta?.name ? wcPeerMeta.name : 'unknown app'}
            />
          )}
          <h2 className="request__title">
            Connect to {wcPeerMeta?.name ? wcPeerMeta.name : 'unknown app'}
          </h2>
          <p>
            {wcPeerMeta?.name ? wcPeerMeta.name : 'An unknown app'} wants to
            connect to your cloud wallet. By clicking connect, you are allowing{' '}
            {wcPeerMeta?.name ? wcPeerMeta.name : 'the unknown app'} to interact
            with your cloud wallet.
          </p>
          <div className="section">
            {/* <p className="section__title">App info</p> */}
            <div className="session-card">
              <div className="session-card__info">
                <div>
                  <h4>{wcPeerMeta?.name ? wcPeerMeta.name : 'Unknown app'}</h4>
                  <p className="session-card__description">
                    {wcPeerMeta?.description}
                  </p>
                  {wcPeerMeta?.url ? (
                    <Link href={wcPeerMeta.url} passHref legacyBehavior>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className="session-card__link"
                      >
                        {wcPeerMeta.url}
                      </a>
                    </Link>
                  ) : (
                    <span className="session-card__no-link">
                      No link provided
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="request__footer">
          <button
            className="request__btn"
            onClick={() => wcRejectSession(payload)}
          >
            Cancel
          </button>
          <button
            className="request__btn"
            onClick={() => wcApproveSession(payload)}
          >
            Connect
          </button>
        </div>
      </div>
    </main>
  );
}
