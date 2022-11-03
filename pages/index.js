import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import useHasMounted from '../hooks/useHasMounted';
import useWalletConnect from '../hooks/useWalletConnect';
import ConnectWallet from '../components/ConnectWallet';
import CloudWallet from '../components/CloudWallet';
import Layout from '../components/Layout';
import ConnectDapp from '../components/ConnectDapp';
import useCloudWallet from '../hooks/useCloudWallet';

export default function Home() {
  // App state
  const { currentPKP } = useCloudWallet();
  const [status, setStatus] = useState('CONNECT_WALLET');
  const hasMounted = useHasMounted();

  // wagmi hooks
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { isConnected } = useAccount();

  // WalletConnect hooks
  const {
    wcStatus,
    wcConnector,
    wcConnect,
    wcRequests,
    wcResults,
    wcDisconnect,
  } = useWalletConnect();

  useEffect(() => {
    console.log('wcStatus', wcStatus);
    if (isConnected) {
      if (wcConnector?.connected) {
        setStatus('WC_CONNECTED');
      } else {
        if (!currentPKP) {
          setStatus('NEED_CLOUD_WALLET');
        } else {
          setStatus('CONNECT_DAPP');
        }
      }
    } else {
      setStatus('CONNECT_WALLET');
    }
  }, [currentPKP, isConnected, wcStatus, wcConnector]);

  if (!hasMounted) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Lit PKP WalletConnect</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {status === 'CONNECT_WALLET' && <ConnectWallet />}
      {status === 'NEED_CLOUD_WALLET' && <p>You need a cloud wallet</p>}
      {status === 'CONNECT_DAPP' && <ConnectDapp wcConnect={wcConnect} />}
      {status === 'WC_CONNECTED' && (
        <CloudWallet
          currentPKP={currentPKP}
          wcConnector={wcConnector}
          wcRequests={wcRequests}
          wcResults={wcResults}
          wcDisconnect={wcDisconnect}
        />
      )}
    </Layout>
  );
}
