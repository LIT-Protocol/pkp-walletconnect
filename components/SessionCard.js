export function SessionCard({ wcConnector, wcDisconnect }) {
  const peerMeta = wcConnector ? wcConnector.peerMeta : null;

  return (
    <div className="bg-base-100 bg-opacity-5 p-4 sm:p-6 flex items-start justify-between">
      <div className="flex items-start mr-4">
        {peerMeta?.icons.length > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={peerMeta?.icons[0]}
            alt={peerMeta?.name ? peerMeta.name : 'Unknown app'}
            className="w-8 h-8 sm:w-10 sm:h-10 mr-4"
          />
        )}
        <div>
          <h3 className="font-medium text-base-300 text-sm sm:text-base">
            {peerMeta?.name ? peerMeta?.name : 'Unknown app'}
          </h3>
          {peerMeta?.url && (
            <a
              href={peerMeta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm underline hover:text-base-500"
            >
              {peerMeta.url}
            </a>
          )}
        </div>
      </div>
      <div>
        <button
          onClick={async () => await wcDisconnect(wcConnector)}
          className="p-1 hover:text-base-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
