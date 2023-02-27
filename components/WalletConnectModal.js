import { useAppState } from '../context/AppContext';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import SessionRequest from './SessionRequest';
import CallRequest from './CallRequest';
import { useEffect, useState } from 'react';

export default function WalletConnectModal() {
  const { wcRequests } = useAppState();

  const [open, setOpen] = useState(wcRequests.length > 0);

  useEffect(() => {
    setOpen(wcRequests.length > 0);
  }, [wcRequests]);

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="overlay" />
        <AlertDialog.Content
          onOpenAutoFocus={event => event.preventDefault()}
          className="dialog drop-shadow-lg"
        >
          {wcRequests.length > 0 && (
            <div className="p-6 sm:p-8">
              {wcRequests[0].method === 'session_request' ? (
                <SessionRequest payload={wcRequests[0]} />
              ) : (
                <CallRequest payload={wcRequests[0]} />
              )}
            </div>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
