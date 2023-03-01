import * as AlertDialog from '@radix-ui/react-alert-dialog';

export default function RawTransactionPrompt({ payload, peerMeta }) {
  return (
    <>
      <AlertDialog.Title className="text-xl sm:text-2xl text-base-100 font-medium text-center">
        Send pre-signed transaction
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
        {peerMeta?.name ? peerMeta.name : 'An unknown app'} wants you to send
        the following pre-signed transaction:
      </p>
      <div className="bg-base-1000 py-2 px-4 border border-base-800 mt-2 text-sm sm:text-base break-all">
        <p>{JSON.parse(payload.params[0])}</p>
      </div>
      <hr className="my-6 border-top border-base-800"></hr>
    </>
  );
}
