import { getPayloadName } from '../utils/helpers';

export default function RequestCard({ request }) {
  let name = getPayloadName(request.payload);

  return (
    <div className="request-card">
      <p className="request-card__title">{name}</p>
      <span className={`request-card__badge request-card__badge--pending`}>
        pending
      </span>
    </div>
  );
}
