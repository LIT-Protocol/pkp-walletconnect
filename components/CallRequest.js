import {
  getMessageToSign,
  getPersonalMessageToSign,
  getTypedDataToSign,
  getTransactionToSign,
  getTransactionToSend,
} from '../utils/helpers';
import { CodeBlock, codepen } from 'react-code-blocks';

export default function CallRequest({
  currentPKP,
  wcPeerMeta,
  wcRequest,
  wcApproveRequest,
  wcRejectRequest,
}) {
  let title;
  let description;

  switch (wcRequest.payload.method) {
    case 'eth_sign':
    case 'personal_sign':
      title = 'Sign message';
      description = `${
        wcPeerMeta && wcPeerMeta.name ? wcPeerMeta.name : 'An unknown app'
      } wants you to sign the following message:`;
      break;
    case 'eth_signTypedData':
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
      title = 'Unknown request';
      description = `Unable to handle this unknown request: ${wcRequest.payload.method}.`;
  }

  return (
    <div className="call-request">
      <div className="call-request__body">
        {wcPeerMeta?.icons.length > 0 && (
          <img
            className="call-request__icon"
            src={wcPeerMeta.icons[0]}
            alt={wcPeerMeta?.name ? wcPeerMeta.name : 'unknown app'}
          />
        )}
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="section">
          {wcRequest.payload.method === 'eth_sign' && (
            <p className="call-request__message">
              {getMessageToSign(wcRequest.payload.params[1])}
            </p>
          )}
          {wcRequest.payload.method === 'personal_sign' && (
            <p className="call-request__message">
              {getPersonalMessageToSign(wcRequest.payload.params[0])}
            </p>
          )}
          {wcRequest.payload.method === 'eth_signTypedData' && (
            <p className="call-request__message">
              {getTypedDataToSign(wcRequest.payload.params[1])}
            </p>
          )}
          {wcRequest.payload.method === 'eth_signTransaction' && (
            <CodeBlock
              showLineNumbers={false}
              text={JSON.stringify(
                getTransactionToSign(wcRequest.payload.params[0]),
                null,
                2
              )}
              theme={codepen}
              language="json"
            />
          )}
          {wcRequest.payload.method === 'eth_sendTransaction' && (
            <CodeBlock
              showLineNumbers={false}
              text={JSON.stringify(
                getTransactionToSend(wcRequest.payload.params[0]),
                null,
                2
              )}
              theme={codepen}
              language="json"
            />
          )}
        </div>
      </div>
      <div className="call-request__footer">
        <button
          className="call-request__btn"
          onClick={() =>
            wcRejectRequest({
              payload: wcRequest.payload,
            })
          }
        >
          Reject
        </button>
        <button
          className="call-request__btn"
          onClick={() =>
            wcApproveRequest({
              payload: wcRequest.payload,
              currentPKP: currentPKP,
            })
          }
        >
          Approve
        </button>
      </div>
    </div>
  );
}
