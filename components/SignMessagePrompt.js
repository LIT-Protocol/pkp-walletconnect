import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { convertHexToUtf8, replaceWithBreaks } from '../utils/helpers';

export default function SignMessagePrompt({ payload, peerMeta }) {
  let message = '';
  if (payload.method === 'eth_sign') {
    message = payload.params[1];
  } else if (payload.method === 'personal_sign') {
    message = convertHexToUtf8(payload.params[0]);
  }

  return (
    <>
      <AlertDialog.Title className="text-xl sm:text-2xl text-base-100 font-medium text-center">
        Sign message
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
        the following message:
      </p>
      <div className="bg-base-1000 py-2 px-4 border border-base-800 mt-2 text-sm sm:text-base break-all">
        <p
          dangerouslySetInnerHTML={{
            __html: replaceWithBreaks(message),
          }}
        ></p>
      </div>
      <hr className="my-6 border-top border-base-800"></hr>
    </>
  );
}
