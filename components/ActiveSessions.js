export default function ActiveSessions({ wcConnector, wcDisconnect }) {
  return (
    <div className="section">
      <h4 className="section__title">Connected Dapp</h4>
      {wcConnector?.peerMeta ? (
        <div className="session-card">
          <div className="session-card__info">
            {wcConnector.peerMeta.icons.length > 0 && (
              <img
                className="session-card__icon"
                src={wcConnector.peerMeta.icons[0]}
                alt={
                  wcConnector.peerMeta.name
                    ? wcConnector.peerMeta.name
                    : 'Unknown app'
                }
              />
            )}
            <div>
              <h4>
                {wcConnector.peerMeta.name
                  ? wcConnector.peerMeta.name
                  : 'Unknown app'}
              </h4>
              {/* <p>{wcConnector.peerMeta.description}</p> */}
              {wcConnector.peerMeta.url ? (
                <a
                  className="session-card__link"
                  href={wcConnector.peerMeta.url}
                >
                  {wcConnector.peerMeta.url}
                </a>
              ) : (
                <span className="session-card__no-link">No link provided</span>
              )}
            </div>
          </div>
          <button className="session-card__btn" onClick={wcDisconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <p>No dapp connected</p>
        </div>
      )}
    </div>
  );
}
