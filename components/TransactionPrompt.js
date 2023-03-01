import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { renderTxDetails } from '../utils/helpers';

export default function TransactionPrompt({ payload, peerMeta }) {
  let title = '';
  let description = '';
  if (payload.method === 'eth_signTransaction') {
    title = 'Sign transaction';
    description = 'sign the following transaction:';
  } else if (payload.method === 'eth_sendTransaction') {
    title = 'Send transaction';
    description = 'send the following transaction:';
  }

  const txDetails = renderTxDetails(payload);

  return (
    <>
      <AlertDialog.Title className="text-xl sm:text-2xl text-base-100 font-medium text-center">
        {title}
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
        {peerMeta?.name ? peerMeta.name : 'An unknown app'} wants you to{' '}
        {description}
      </p>
      {txDetails.map(
        detail =>
          detail.value && (
            <div key={detail.label} className="mt-4">
              <p className="block text-sm mb-2">{detail.label}</p>
              <p className="block w-full border border-base-800 bg-base-1000 text-sm p-1 break-all">
                {detail.value}
              </p>
            </div>
          )
      )}
      <hr className="my-6 border-top border-base-800"></hr>
    </>
  );
}
