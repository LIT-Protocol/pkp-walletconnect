import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { ethers } from 'ethers';
import useHasMounted from '../hooks/useHasMounted';
import useWalletConnect from '../hooks/useWalletConnect';
import {
  litContractsConnected,
  connectLitContracts,
  getPKPNFTTokenIdsByAddress,
  getPubkey,
} from '../utils/lit-contracts';
import ConnectWallet from '../components/ConnectWallet';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import HomeTab from '../components/tabs/HomeTab';
import ConnectTab from '../components/tabs/ConnectTab';
import ActivityTab from '../components/tabs/ActivityTab';
import MintPKP from '../components/MintPKP';
import SessionRequest from '../components/SessionRequest';
import CallRequest from '../components/CallRequest';
import Link from 'next/link';

const WC_URI_KEY = 'test_dapp_wc_uri';

const fetchPKPsByAddress = async address => {
  const tokenIds = await getPKPNFTTokenIdsByAddress(address);
  let pkps = [];

  if (tokenIds.length > 0) {
    for (let i = 0; i < tokenIds.length; i++) {
      const pubkey = await getPubkey(tokenIds[i]);
      console.log(`pubkey index ${i}`, pubkey);
      const ethAddress = ethers.utils.computeAddress(pubkey);
      pkps.push({
        tokenId: tokenIds[i],
        pubkey: pubkey,
        ethAddress: ethAddress,
      });
    }
  }

  return pkps;
};

export default function Home() {
  const [currentPKP, setCurrentPKP] = useState(null);
  const [myPKPs, setMyPKPs] = useState([]);

  const [fetching, setFetching] = useState(false);
  const [tab, setTab] = useState(1);
  const hasMounted = useHasMounted();

  // wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();

  // WalletConnect hooks
  const {
    wcStatus,
    wcConnector,
    wcPendingRequest,
    wcRequests,
    wcConnect,
    wcDisconnect,
    wcApproveSession,
    wcRejectSession,
    wcApproveRequest,
    wcRejectRequest,
  } = useWalletConnect();

  useEffect(() => {
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
      const wcSession = localStorage.getItem(WC_URI_KEY);

      // Reconnect if URI exists in local storage
      if (wcSession) {
        wcConnect({ session: JSON.parse(wcSession) });
      }
    }
  }, [currentPKP, wcConnector, wcConnect]);

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

  if (fetching) {
    return (
      <Layout>
        <Head>
          <title>Lit PKP WalletConnect</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="container">
          <Loading />
        </main>
        <footer className="footer">
          <span className="footer__caption">Powered by Lit</span>
        </footer>
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
        <main className="container">
          <MintPKP />
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

      <>
        <main className="container">
          {tab === 1 && (
            <HomeTab
              currentPKP={currentPKP}
              wcConnector={wcConnector}
              wcPendingRequest={wcPendingRequest}
              wcRequests={wcRequests}
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
          {tab === 3 && <ActivityTab wcRequests={wcRequests} />}

          {wcStatus === 'session_request' && (
            <SessionRequest
              currentPKP={currentPKP}
              wcPeerMeta={wcConnector.peerMeta}
              wcApproveSession={wcApproveSession}
              wcRejectSession={wcRejectSession}
            />
          )}

          {wcStatus === 'call_request' && (
            <CallRequest
              currentPKP={currentPKP}
              wcPeerMeta={wcConnector.peerMeta}
              wcRequest={wcRequests[wcPendingRequest]}
              wcApproveRequest={wcApproveRequest}
              wcRejectRequest={wcRejectRequest}
            />
          )}
        </main>
        <Footer tab={tab} setTab={setTab} />
      </>
    </Layout>
  );
}
