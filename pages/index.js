import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSigner, useDisconnect } from 'wagmi';
import useHasMounted from '../hooks/useHasMounted';
import useWalletConnect from '../hooks/useWalletConnect';
import {
  litContractsConnected,
  connectLitContracts,
  fetchPKPsByAddress,
} from '../utils/lit-contracts';
import {
  DEFAULT_CHAIN_ID,
  WC_RESULTS_STORAGE_KEY,
  WC_SESSION_STORAGE_KEY,
} from '../utils/constants';
import ConnectWallet from '../components/ConnectWallet';
import Loading from '../components/Loading';
import HomeTab from '../components/tabs/HomeTab';
import ConnectTab from '../components/tabs/ConnectTab';
import ActivityTab from '../components/tabs/ActivityTab';
import MintPKP from '../components/MintPKP';
import SessionRequest from '../components/SessionRequest';
import CallRequest from '../components/CallRequest';
import InfoTab from '../components/tabs/InfoTab';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function Home() {
  const [currentPKP, setCurrentPKP] = useState(null);
  const [myPKPs, setMyPKPs] = useState([]);
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID);

  const [fetching, setFetching] = useState(false);
  const [tab, setTab] = useState(1);
  const hasMounted = useHasMounted();

  // wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const { disconnect } = useDisconnect();

  // WalletConnect hook
  const {
    wcConnector,
    wcSessionRequest,
    wcRequests,
    wcResults,
    wcConnect,
    wcDisconnect,
    wcApproveSession,
    wcRejectSession,
    wcUpdateSession,
    wcApproveRequest,
    wcRejectRequest,
    setWcResults,
  } = useWalletConnect();

  const handleSwitchPKP = useCallback(
    newPKPEthAddress => {
      console.log('handleSwitchPKP', newPKPEthAddress);
      let newPKP = myPKPs.find(
        pkp => pkp.ethAddress.toLowerCase() === newPKPEthAddress.toLowerCase()
      );
      wcUpdateSession({ currentPKP: newPKP, chainId });
      setCurrentPKP(newPKP);
      setWcResults({});
    },
    [myPKPs, chainId, wcUpdateSession, setWcResults]
  );

  const handleSwitchChain = useCallback(
    newChainId => {
      console.log('handleSwitchChain', newChainId);
      wcUpdateSession({ currentPKP, chainId: Number(newChainId) });
      setChainId(newChainId);
    },
    [currentPKP, wcUpdateSession]
  );

  const handleLogout = useCallback(
    event => {
      event.preventDefault();
      wcDisconnect();
      setCurrentPKP(null);
      setMyPKPs([]);
      setChainId(DEFAULT_CHAIN_ID);
      disconnect();
      localStorage.removeItem(WC_RESULTS_STORAGE_KEY);
      setWcResults({});
    },
    [disconnect, wcDisconnect, setWcResults]
  );

  useEffect(() => {
    // Get current user's PKPs
    async function fetchMyPKPs() {
      setFetching(true);

      const pkps = await fetchPKPsByAddress(address);

      if (pkps.length > 0) {
        setCurrentPKP(pkps[0]);
        setMyPKPs(pkps);
      } else {
        setCurrentPKP(null);
        setMyPKPs([]);
      }
      setFetching(false);
    }

    // Check if wallet is connected
    if (address && signer) {
      // Check if contracts are connected
      if (!litContractsConnected) {
        connectLitContracts(signer);
      }

      // Fetch current user's PKPs
      if (!currentPKP) {
        fetchMyPKPs();
      } else {
        setFetching(false);
      }
    } else {
      setCurrentPKP(null);
      setMyPKPs([]);
      setFetching(false);
    }
  }, [currentPKP, address, signer]);

  useEffect(() => {
    // Check if cloud wallet exists but WalletConnect is not connected
    if (currentPKP && !wcConnector) {
      // Reconnect if URI exists in local storage
      const wcSession = localStorage.getItem(WC_SESSION_STORAGE_KEY);
      if (wcSession) {
        const session = JSON.parse(wcSession);

        if (chainId !== session.chainId) {
          setChainId(session.chainId);
        }

        // Check if current PKP is the same as the one in the session
        if (
          currentPKP.ethAddress.toLowerCase() ===
          session.accounts[0].toLowerCase()
        ) {
          wcConnect({ session: session });
        } else {
          // Update current PKP to the one in the session if user owns that PKP
          const pkp = myPKPs.find(
            pkp =>
              pkp.ethAddress.toLowerCase() === session.accounts[0].toLowerCase()
          );
          if (pkp) {
            wcConnect({ session: session });
            setCurrentPKP(pkp);
          } else {
            // If user does not own the PKP in the session, disconnect
            wcDisconnect();
          }
        }
      }
    }
  }, [currentPKP, myPKPs, chainId, wcConnector, wcConnect, wcDisconnect]);

  useEffect(() => {
    if (currentPKP && Object.keys(wcResults).length === 0) {
      // Load recent activity if exists in local storage
      const savedResults = localStorage.getItem(WC_RESULTS_STORAGE_KEY);
      if (savedResults) {
        const results = JSON.parse(savedResults);
        if (results && results[currentPKP.ethAddress.toLowerCase()]) {
          setWcResults(results[currentPKP.ethAddress.toLowerCase()]);
        }
      }
    }
  }, [currentPKP, wcResults, setWcResults]);

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
        <Header
          currentPKP={currentPKP}
          myPKPs={myPKPs}
          chainId={chainId}
          handleSwitchChain={handleSwitchChain}
          handleSwitchPKP={handleSwitchPKP}
          handleLogout={handleLogout}
        />
        <ConnectWallet />
        <Footer tab={tab} setTab={setTab} />
      </Layout>
    );
  }

  if (fetching) {
    return (
      <Layout>
        <Head>
          <title>Lit PKP WalletConnect</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header
          currentPKP={currentPKP}
          myPKPs={myPKPs}
          chainId={chainId}
          handleSwitchChain={handleSwitchChain}
          handleSwitchPKP={handleSwitchPKP}
          handleLogout={handleLogout}
        />
        <Loading />
        <Footer tab={tab} setTab={setTab} />
      </Layout>
    );
  }

  if (currentPKP === null && myPKPs.length === 0) {
    return (
      <Layout>
        <Head>
          <title>Lit PKP WalletConnect</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header
          currentPKP={currentPKP}
          myPKPs={myPKPs}
          chainId={chainId}
          handleSwitchChain={handleSwitchChain}
          handleSwitchPKP={handleSwitchPKP}
          handleLogout={handleLogout}
        />
        <MintPKP />
        <Footer tab={tab} setTab={setTab} />
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Lit PKP WalletConnect</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {wcSessionRequest ? (
        <SessionRequest
          currentPKP={currentPKP}
          chainId={chainId}
          wcSessionRequest={wcSessionRequest}
          wcApproveSession={wcApproveSession}
          wcRejectSession={wcRejectSession}
        />
      ) : wcRequests.length > 0 ? (
        <CallRequest
          currentPKP={currentPKP}
          chainId={chainId}
          wcPeerMeta={wcConnector.peerMeta}
          wcRequest={wcRequests[0]}
          wcApproveRequest={wcApproveRequest}
          wcRejectRequest={wcRejectRequest}
        />
      ) : (
        <>
          <Header
            currentPKP={currentPKP}
            myPKPs={myPKPs}
            chainId={chainId}
            handleSwitchChain={handleSwitchChain}
            handleSwitchPKP={handleSwitchPKP}
            handleLogout={handleLogout}
          />

          <main className="container">
            {tab === 1 && (
              <HomeTab
                currentPKP={currentPKP}
                wcConnector={wcConnector}
                wcResults={wcResults}
                wcDisconnect={wcDisconnect}
              />
            )}
            {tab === 2 && (
              <ConnectTab
                wcConnector={wcConnector}
                wcConnect={wcConnect}
                wcDisconnect={wcDisconnect}
              />
            )}
            {tab === 3 && <ActivityTab wcResults={wcResults} />}
            {tab === 4 && <InfoTab currentPKP={currentPKP} />}
          </main>

          <Footer tab={tab} setTab={setTab} />
        </>
      )}
    </Layout>
  );
}
