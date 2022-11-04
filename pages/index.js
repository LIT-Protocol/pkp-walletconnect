import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import useHasMounted from '../hooks/useHasMounted';
import useWalletConnect from '../hooks/useWalletConnect';
import useCloudWallet from '../hooks/useCloudWallet';
import ConnectWallet from '../components/ConnectWallet';
import CloudWallet from '../components/CloudWallet';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import Connections from '../components/Connections';
import Activity from '../components/activity';
import ConnectDapp from '../components/ConnectDapp';
import MintPKP from '../components/MintPKP';
import Loading from '../components/Loading';

const Views = Object.freeze({
  HOME: 1,
  CONNECTIONS: 2,
  ACTIVITY: 3,
  LOADING: 4,
  NEED_PKP: 5,
});

export default function Home() {
  const [view, setView] = useState(Views.LOADING);

  const { loading, currentPKP } = useCloudWallet();

  const hasMounted = useHasMounted();

  // wagmi hooks
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
    if (loading) {
      setView(Views.LOADING);
    } else {
      if (!currentPKP) {
        setView(Views.NEED_PKP);
      } else {
        setView(Views.HOME);
      }
    }
  }, [loading, currentPKP]);

  if (!hasMounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <Layout>
        <Head>
          <title>Lit PKP WalletConnect</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="container">
          <ConnectWallet />
        </main>
        <footer className="footer">
          <span className="footer__caption">Powered by Lit</span>
        </footer>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Lit PKP WalletConnect</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container">
        {view === Views.LOADING && <Loading />}
        {view === Views.NEED_PKP && <MintPKP />}
        {view === Views.HOME && (
          <CloudWallet
            currentPKP={currentPKP}
            wcConnector={wcConnector}
            wcRequests={wcRequests}
            wcResults={wcResults}
            wcDisconnect={wcDisconnect}
          />
        )}
        {view === Views.CONNECTIONS && (
          <div className="sub-page">
            <h2 className="sub-page__title">Connected dapps</h2>
            {wcConnector?.connected ? (
              <Connections
                wcConnector={wcConnector}
                wcDisconnect={wcDisconnect}
              />
            ) : (
              <ConnectDapp wcConnect={wcConnect} />
            )}
          </div>
        )}
        {view === Views.ACTIVITY && (
          <div className="sub-page">
            <h2 className="sub-page__title">Recent activity</h2>
            <Activity wcResults={wcResults} />
          </div>
        )}
      </main>
      {view !== Views.LOADING && view !== Views.NEED_PKP && (
        <Footer view={view} setView={setView} />
      )}
    </Layout>
  );
}
