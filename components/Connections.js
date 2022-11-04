import SessionCard from './SessionCard';

export default function Connections({ wcConnector, wcDisconnect }) {
  return (
    <>
      {wcConnector?.connected ? (
        <SessionCard wcConnector={wcConnector} wcDisconnect={wcDisconnect} />
      ) : (
        <div className="empty-state">
          <p>No connected dapps</p>
        </div>
      )}
    </>
  );
}
