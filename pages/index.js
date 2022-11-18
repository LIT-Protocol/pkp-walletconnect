import { useState } from 'react';
import { useAccount } from 'wagmi';
import useHasMounted from '../hooks/useHasMounted';
import MintPKP from '../components/MintPKP';
import ConnectTab from '../components/tabs/ConnectTab';
import SessionRequest from '../components/SessionRequest';
import CallRequest from '../components/CallRequest';
import ConnectWallet from '../components/ConnectWallet';
import { useAppDispatch, useAppState } from '../context/AppContext';
import Loading from '../components/Loading';
import Layout from '../components/Layout';
import HomeTab from '../components/tabs/HomeTab';
import ActivityTab from '../components/tabs/ActivityTab';
import InfoTab from '../components/tabs/InfoTab';

export default function Home() {
  // wagmi
  const { isConnected } = useAccount();

  // app state
  const state = useAppState();
  const dispatch = useAppDispatch();

  // ui state
  const [tab, setTab] = useState(1);
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return null;
  }

  if (!isConnected) {
    return <ConnectWallet />;
  }

  return (
    <Layout>
      {state.loading ? (
        <Loading />
      ) : state.currentPKPAddress ? (
        <>
          {state.wcRequests.length > 0 ? (
            state.wcRequests[0].method === 'session_request' ? (
              <SessionRequest payload={state.wcRequests[0]} />
            ) : (
              <CallRequest payload={state.wcRequests[0]} />
            )
          ) : (
            <>
              {state.tab === 1 && <HomeTab />}
              {state.tab === 2 && <ConnectTab />}
              {state.tab === 3 && <ActivityTab />}
              {state.tab === 4 && <InfoTab />}
            </>
          )}
        </>
      ) : (
        <MintPKP />
      )}
    </Layout>
  );
}
