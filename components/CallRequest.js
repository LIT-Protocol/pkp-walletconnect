import {
  getTransactionToSign,
  getTransactionToSend,
  isPayloadSupported,
  convertHexToUtf8,
} from '../utils/helpers';
import { CodeBlock, codepen } from 'react-code-blocks';

export default function CallRequest({
  wcPeerMeta,
  wcRequest,
  wcApproveRequest,
  wcRejectRequest,
}) {
  const supported = isPayloadSupported(wcRequest);
  let title;
  let description;

  switch (wcRequest.method) {
    case 'eth_sign':
    case 'personal_sign':
      title = 'Sign message';
      description = `${
        wcPeerMeta && wcPeerMeta.name ? wcPeerMeta.name : 'An unknown app'
      } wants you to sign the following message:`;
      break;
    case 'eth_signTypedData':
    case 'eth_signTypedData_v1':
    case 'eth_signTypedData_v3':
    case 'eth_signTypedData_v4':
      title = 'Sign typed data';
      description = `${
        wcPeerMeta && wcPeerMeta.name ? wcPeerMeta.name : 'An unidentified app'
      } wants you to sign the following typed data:`;
      break;
    case 'eth_signTransaction':
      title = 'Sign transaction';
      description = `${
        wcPeerMeta && wcPeerMeta.name ? wcPeerMeta.name : 'An unknown app'
      } 
      wants you to sign the following transaction:`;
      break;
    case 'eth_sendTransaction':
      title = 'Send transaction';
      description = `${
        wcPeerMeta && wcPeerMeta.name ? wcPeerMeta.name : 'An unknown app'
      } 
      wants you to approve the following transaction:`;
      break;
    default:
      title = 'Unsupported request';
      description = `Unable to handle this request: ${wcRequest.method}.`;
  }

  return (
    <main className="container">
      <div className="request">
        <div className="request__body">
          {wcPeerMeta?.icons.length > 0 && (
            <img
              className="request__icon"
              src={wcPeerMeta.icons[0]}
              alt={wcPeerMeta?.name ? wcPeerMeta.name : 'unknown app'}
            />
          )}
          <h2>{title}</h2>
          <p>{description}</p>
          <div className="section">
            {wcRequest.method === 'eth_sign' && (
              <p className="request__message">
                {convertHexToUtf8(wcRequest.params[1])}
              </p>
            )}
            {wcRequest.method === 'personal_sign' && (
              <p className="request__message">
                {convertHexToUtf8(wcRequest.params[0])}
              </p>
            )}
            {wcRequest.method.startsWith('eth_signTypedData') && (
              <CodeBlock
                showLineNumbers={false}
                text={JSON.stringify(JSON.parse(wcRequest.params[1]), null, 2)}
                theme={codepen}
                language="json"
              />
            )}
            {wcRequest.method === 'eth_signTransaction' && (
              <CodeBlock
                showLineNumbers={false}
                text={JSON.stringify(
                  getTransactionToSign(wcRequest.params[0]),
                  null,
                  2
                )}
                theme={codepen}
                language="json"
              />
            )}
            {wcRequest.method === 'eth_sendTransaction' && (
              <CodeBlock
                showLineNumbers={false}
                text={JSON.stringify(
                  getTransactionToSend(wcRequest.params[0], chainId),
                  null,
                  2
                )}
                theme={codepen}
                language="json"
              />
            )}
          </div>
        </div>
        <div className="request__footer">
          {supported ? (
            <>
              <button
                className="request__btn"
                onClick={() => wcRejectRequest(wcRequest)}
              >
                Reject
              </button>
              <button
                className="request__btn"
                onClick={() => wcApproveRequest(wcRequest)}
              >
                Approve
              </button>
            </>
          ) : (
            <button
              className="request__btn"
              onClick={() => wcRejectRequest(wcRequest)}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
