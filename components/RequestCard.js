import Link from 'next/link';
import { getPayloadName } from '../utils/helpers';

export default function RequestCard({ request }) {
  let name = getPayloadName(request.payload);

  return (
    <div className="request-card">
      <div>
        <p className="request-card__title">{name}</p>
        {request.payload?.method === 'eth_sendTransaction' && !request.result && (
          <Link
            href={`https://mumbai.polygonscan.com/tx/${request.result}`}
            passHref
            legacyBehavior
          >
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="request-card__link"
            >
              View on block explorer
            </a>
          </Link>
        )}
      </div>
      <span
        className={`request-card__badge request-card__badge--${request.status}`}
      >
        {request.status}
      </span>
    </div>
  );
}
