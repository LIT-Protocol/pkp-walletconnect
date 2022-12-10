import { isSignRequestSupported } from 'lit-pkp-sdk';
import { CodeBlock, codepen } from 'react-code-blocks';
import { useAppState, useAppActions } from '../context/AppContext';
import {
  getChain,
  renderRequest,
  truncate,
  replaceWithBreaks,
} from '../utils/helpers';

export default function CallRequest({ payload }) {
  const { wcConnectors, appChains } = useAppState();
  const { wcApproveRequest, wcRejectRequest } = useAppActions();
  const wcConnector = wcConnectors[payload.peerId];
  const address = wcConnector?.accounts[0];
  const chain = getChain(wcConnector?.chainId, appChains);
  const wcPeerMeta = wcConnector?.peerMeta;
  const supported =
    isSignRequestSupported(payload) ||
    payload.method === 'wallet_addEthereumChain' ||
    payload.method === 'wallet_switchEthereumChain';
  const { title, description, message, data } = renderRequest(
    payload,
    wcPeerMeta,
    appChains
  );
  const showParagraph = ['eth_sign', 'personal_sign'].includes(payload.method);
  const showCodeBlock = [
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
    'eth_signTransaction',
    'eth_sendTransaction',
    'eth_sendRawTransaction',
    'wallet_addEthereumChain',
    'wallet_switchEthereumChain',
  ].includes(payload.method);

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
          <p className="request__description">{description}</p>
          {showParagraph && (
            <div className="request__detail">
              <h4 className="subtitle">Message</h4>
              <p
                dangerouslySetInnerHTML={{
                  __html: replaceWithBreaks(message),
                }}
                className="request__message"
              ></p>
            </div>
          )}
          {showCodeBlock && (
            <div className="request__detail">
              <h4 className="subtitle">
                {payload.method.startsWith('eth_signTypedData')
                  ? 'Data'
                  : payload.method.startsWith('wallet_')
                  ? 'Network'
                  : 'Transaction'}
              </h4>
              <CodeBlock
                className="request__data"
                showLineNumbers={false}
                text={data}
                theme={codepen}
                language="json"
              />
            </div>
          )}
          {address && (
            <div className="request__detail">
              <h4 className="subtitle">Account</h4>
              <p>{truncate(address)}</p>
            </div>
          )}
          {chain && (
            <div className="request__detail">
              <h4 className="subtitle">Network</h4>
              <p>{chain.name}</p>
            </div>
          )}
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
