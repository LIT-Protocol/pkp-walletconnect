import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { CodeBlock, atomOneDark } from 'react-code-blocks';

export default function SignDataPrompt({ payload, peerMeta }) {
  return (
    <>
      <AlertDialog.Title className="text-xl sm:text-2xl text-base-100 font-medium text-center">
        Sign data
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
        {peerMeta?.name ? peerMeta.name : 'An unknown app'} wants you to sign
        the following data:
      </p>
      <div className="mt-2 text-xs">
        <CodeBlock
          showLineNumbers={false}
          text={JSON.stringify(JSON.parse(payload.params[1]), null, 2)}
          theme={atomOneDark}
          language="json"
        />
      </div>
      <hr className="my-6 border-top border-base-800"></hr>
    </>
  );
}
