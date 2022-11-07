import Link from 'next/link';

export default function SessionRequest({
  currentPKP,
  wcPeerMeta,
  wcApproveSession,
  wcRejectSession,
}) {
  return (
    <div className="session-request">
      <div className="session-request__body">
        {wcPeerMeta?.icons.length > 0 && (
          <img
            className="session-request__icon"
            src={wcPeerMeta.icons[0]}
            alt={wcPeerMeta?.name ? wcPeerMeta.name : 'unknown app'}
          />
        )}
        <h2>Connect to {wcPeerMeta?.name ? wcPeerMeta.name : 'unknown app'}</h2>
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
                <p>{wcPeerMeta?.description}</p>
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
      <div className="session-request__footer">
        <button
          className="session-request__btn"
          onClick={() => wcRejectSession()}
        >
          Cancel
        </button>
        <button
          className="session-request__btn"
          onClick={() => wcApproveSession({ currentPKP })}
        >
          Connect
        </button>
      </div>
    </div>
  );
}
