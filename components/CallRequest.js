import {
  getTransactionToSign,
  getTransactionToSend,
  isPayloadSupported,
  convertHexToUtf8,
} from '../utils/helpers';
import { CodeBlock, codepen } from 'react-code-blocks';
import { useAppState, useAppActions } from '../context/AppContext';

export default function CallRequest({ payload }) {
  const { wcConnectors } = useAppState();
  const { wcApproveRequest, wcRejectRequest } = useAppActions();
  const wcConnector = wcConnectors[payload.peerId];
  const wcPeerMeta = wcConnector.peerMeta;
  const supported = isPayloadSupported(payload);
  let title;
  let description;

  switch (payload.method) {
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
      description = `Unable to handle this request: ${payload.method}.`;
  }

  return (
    <main className="container">
      <div className="request">
        <div className="request__body">
          {wcPeerMeta?.icons.length > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="request__icon"
              src={wcPeerMeta.icons[0]}
              alt={wcPeerMeta?.name ? wcPeerMeta.name : 'unknown app'}
            />
          )}
          <h2 className="request__title">{title}</h2>
          <p>{description}</p>
          <div className="section">
            {payload.method === 'eth_sign' && (
              <p className="request__message">{payload.params[1]}</p>
            )}
            {payload.method === 'personal_sign' && (
              <p className="request__message">
                {convertHexToUtf8(payload.params[0])}
              </p>
            )}
            {payload.method.startsWith('eth_signTypedData') && (
              <CodeBlock
                showLineNumbers={false}
                text={JSON.stringify(JSON.parse(payload.params[1]), null, 2)}
                theme={codepen}
                language="json"
              />
            )}
            {payload.method === 'eth_signTransaction' && (
              <CodeBlock
                showLineNumbers={false}
                text={JSON.stringify(
                  getTransactionToSign(payload.params[0], wcConnector.chainId),
                  null,
                  2
                )}
                theme={codepen}
                language="json"
              />
            )}
            {payload.method === 'eth_sendTransaction' && (
              <CodeBlock
                showLineNumbers={false}
                text={JSON.stringify(
                  getTransactionToSend(payload.params[0], wcConnector.chainId),
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
                onClick={() => wcRejectRequest(payload)}
              >
                Reject
              </button>
              <button
                className="request__btn"
                onClick={() => wcApproveRequest(payload)}
              >
                Approve
              </button>
            </>
          ) : (
            <button
              className="request__btn"
              onClick={() => wcRejectRequest(payload)}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
