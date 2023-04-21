import Head from 'next/head';
import Login from '../components/Login';
import { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import { useAppDispatch, useAppState } from '../context/AppContext';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import useWalletConnect from '../hooks/useWalletConnect';
import { WALLETCONNECT_KEY } from '../utils/constants';

export default function Home() {
  const { isAuthenticated, sessionExpiration, wcConnector } = useAppState();
  const dispatch = useAppDispatch();
  const { wcConnect, wcDisconnect } = useWalletConnect();

  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(true);

  useEffect(() => {
    const supported =
      browserSupportsWebAuthn() && !navigator.userAgent.includes('Firefox');
    setIsWebAuthnSupported(supported);
  }, []);

  useEffect(() => {
    // Check if session sigs have expired
    async function checkSession() {
      const sessionDate = new Date(sessionExpiration);
      const now = new Date();
      if (sessionDate < now) {
        // Reset state
        dispatch({
          type: 'disconnect',
        });

        // Disconnect WalletConnect session
        if (wcConnector && wcConnector.connected === true) {
          await wcDisconnect(wcConnector);
        }
      }
    }

    // Check session expiration if exists
    if (sessionExpiration) {
      checkSession();
    }
  }, [sessionExpiration, wcConnector, wcDisconnect]);

  useEffect(() => {
    async function initWalletConnect() {
      // Check for a stored WalletConnect session
      const storedWc = localStorage.getItem(WALLETCONNECT_KEY);
      if (storedWc) {
        // Reconnect if not initialized or not connected
        if (!wcConnector || (wcConnector && !wcConnector.connected)) {
          const parsedWc = JSON.parse(storedWc);
          await wcConnect({ session: parsedWc });
        }
      }
    }

    // Reconnect to WalletConnect session if authenticated
    if (isAuthenticated) {
      initWalletConnect();
    }
  }, [isAuthenticated, wcConnector, wcConnect]);

  if (!isWebAuthnSupported) {
    return (
      <>
        <Head>
          <title>Lit x WebAuthn | Lit Protocol</title>
          <meta
            name="description"
            content="The most secure and customizable wallet that's 100% yours."
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-10 h-10 text-red-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <h1 className="mt-6 text-3xl sm:text-4xl text-base-100 font-medium mb-4">
            Browser not supported
          </h1>
          <p className="mb-6">
            Unfortunately, your browser does not support platform
            authenticators. Try visiting this demo on Chrome, Safari, Brave, or
            Edge.
          </p>
          <p>
            Refer to{' '}
            <a
              href="https://webauthn.me/browser-support"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-base-500"
            >
              this table
            </a>{' '}
            for a more comprehensive list of supported browsers and operating
            systems.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Lit x WebAuthn | Lit Protocol</title>
        <meta
          name="description"
          content="The most secure and customizable wallet that's 100% yours."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {isAuthenticated ? <Dashboard /> : <Login />}
    </>
  );
}
