import Link from 'next/link';
import { useAppState } from '../context/AppContext';
import { getChain } from '../utils/helpers';

export default function ResultCard({ resultData }) {
  const { appChains } = useAppState();
  let blockExplorerUrl = null;
  if (
    resultData.payload?.method === 'eth_sendTransaction' &&
    resultData.result?.chainId
  ) {
    const chain = getChain(resultData.result.chainId, appChains);
    if (chain) {
      blockExplorerUrl = chain.blockExplorerUrls[0];
    }
  }

  let title;

  switch (resultData.payload.method) {
    case 'eth_sign':
    case 'personal_sign':
      title = 'Sign message';
      break;
    case 'eth_signTypedData':
    case 'eth_signTypedData_v1':
    case 'eth_signTypedData_v3':
    case 'eth_signTypedData_v4':
      title = 'Sign typed data';
      break;
    case 'eth_signTransaction':
      title = 'Sign transaction';
      break;
    case 'eth_sendTransaction':
      title = 'Send transaction';
      break;
    default:
      title = `${payload.method} (unsupported)`;
      break;
  }

  return (
    <div className="request-card">
      <div>
        <h4 className="request-card__title">{title}</h4>
        {blockExplorerUrl && (
          <Link
            href={`${blockExplorerUrl}/tx/${resultData.result.hash}`}
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
        {resultData.peerMeta && (
          <div className="request-card__app">
            {resultData.peerMeta.icons.length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="request-card__icon"
                src={resultData.peerMeta.icons[0]}
                alt={
                  resultData.peerMeta.name
                    ? resultData.peerMeta.name
                    : 'Unknown app'
                }
              />
            )}
            <span>
              {resultData.peerMeta.name
                ? resultData.peerMeta.name
                : 'Unknown app'}
            </span>
          </div>
        )}
      </div>
      <span
        className={`request-card__badge request-card__badge--${resultData.status}`}
      >
        {resultData.status}
      </span>
    </div>
  );
}
