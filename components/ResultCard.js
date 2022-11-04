import Link from 'next/link';
import { getPayloadName } from '../utils/helpers';

export default function ResultCard({ result }) {
  let name = getPayloadName(result.payload);

  return (
    <div className="request-card">
      <div>
        <p className="request-card__title">{name}</p>
        {result.payload?.method === 'eth_sendTransaction' && result.result && (
          <Link
            href={`https://mumbai.polygonscan.com/tx/${result.result}`}
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
        className={`request-card__badge request-card__badge--${result.status}`}
      >
        {result.status}
      </span>
    </div>
  );
}
