import { useAppState } from '../context/AppContext';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { CodeBlock, atomOneLight } from 'react-code-blocks';
import { convertHexToNumber } from '@walletconnect/legacy-utils';
import { getChain } from '../utils/helpers';

export default function SwitchChainPrompt({ payload, peerMeta }) {
  const { appChains } = useAppState();

  const newChainId = convertHexToNumber(payload.params[0].chainId);
  const newChain = getChain(newChainId, appChains);
  const data = newChain ? newChain : payload.params[0];

  return (
    <>
      <AlertDialog.Title className="text-xl sm:text-2xl text-base-100 font-medium text-center">
        Switch network
      </AlertDialog.Title>
      {peerMeta?.url && (
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-1 text-sm sm:text-base text-center hover:underline"
          href={peerMeta.url}
        >
          {peerMeta.url}
        </a>
      )}
      <p className="text-sm sm:text-base text-left mt-4">
        {peerMeta?.name ? peerMeta.name : 'An unknown app'} wants you to switch
        to the following network:
      </p>
      <div className="mt-2 text-xs">
        <CodeBlock
          showLineNumbers={false}
          text={JSON.stringify(JSON.parse(data), null, 2)}
          theme={atomOneLight}
          language="json"
        />
      </div>
      <hr className="my-6 border-top border-base-800"></hr>
    </>
  );
}
