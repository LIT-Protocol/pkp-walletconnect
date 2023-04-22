import { useState, useEffect } from 'react';
import { useAppDispatch, useAppState } from '../context/AppContext';
import Footer from './Footer';
import {
  DEFAULT_EXP,
  pollRequestUntilTerminalState,
  register,
  verifyRegistration,
  authenticate,
  getSessionSigsForWebAuthn,
  fetchPKPs,
} from '../utils/webauthn';

const LoginViews = {
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  REGISTERING: 'registering',
  AUTHENTICATING: 'authenticating',
  MINTING: 'minting',
  MINTED: 'minted',
  CREATING_SESSION: 'creating_session',
  SESSION_CREATED: 'session_created',
  ERROR: 'error',
};

export default function Login() {
  // App state
  const { currentPKP } = useAppState();
  // App dispatch
  const dispatch = useAppDispatch();

  // For UI
  const [view, setView] = useState(LoginViews.SIGN_UP);
  const [errorMsg, setErrorMsg] = useState(null);

  // Current user
  const [username, setUsername] = useState('');
  const [pkp, setPKP] = useState(currentPKP);
  const [credential, setCredential] = useState(null);

  // Update view if error has occured
  function onError(msg) {
    setErrorMsg(msg);
    setView(LoginViews.ERROR);
  }

  async function createPKPWithWebAuthn(event) {
    event.preventDefault();

    setView(LoginViews.REGISTERING);

    try {
      // Register credential
      const options = await register(username);

      // If registration successful, PKP has been minted
      const { requestId, credential } = await verifyRegistration(options);
      console.log('credential', credential);
      setCredential(credential);
      setView(LoginViews.MINTING);

      // Poll minting status
      const pollRes = await pollRequestUntilTerminalState(requestId);
      if (pollRes) {
        const newPKP = {
          tokenId: pollRes.pkpTokenId,
          publicKey: pollRes.pkpPublicKey,
          ethAddress: pollRes.pkpEthAddress,
        };
        setView(LoginViews.MINTED);
        setPKP(newPKP);
      } else {
        throw new Error(`Unable to poll minting status: ${pollRes}`);
      }
    } catch (err) {
      onError(err.message);
    }
  }

  async function authThenGetSessionSigs(event) {
    event.preventDefault();

    setView(LoginViews.AUTHENTICATING);

    try {
      const authData = await authenticate(credential);

      let pkpToAuthWith = pkp;
      // if (!pkpToAuthWith) {
      //   const pkps = await fetchPKPs(authData);
      //   if (pkps.length === 0) {
      //     throw new Error(
      //       'No PKPs found for this passkey. Please register a new passkey to mint a new PKP.'
      //     );
      //   } else {
      //     pkpToAuthWith = pkps[0];
      //   }
      // }

      // Authenticate with a WebAuthn credential and create session sigs with authentication data
      setView(LoginViews.CREATING_SESSION);

      const sessionSigs = await getSessionSigsForWebAuthn(
        pkpToAuthWith.pkpPublicKey,
        authData
      );

      setView(LoginViews.SESSION_CREATED);

      dispatch({
        type: 'authenticated',
        isAuthenticated: true,
        currentUsername: username,
        currentPKP: pkpToAuthWith,
        sessionSigs: sessionSigs,
        sessionExpiration: DEFAULT_EXP,
      });
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <>
      {view === LoginViews.ERROR && (
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
            Uh oh!
          </h1>
          {errorMsg ? (
            <>
              <p className="mb-4">Something went wrong:</p>
              <p className="text-sm p-3 bg-red-900 bg-opacity-5 text-red-500 border border-red-500 border-opacity-40 mb-8">
                {errorMsg}
              </p>
            </>
          ) : (
            <p className="mb-8">Something went wrong.</p>
          )}
          {pkp ? (
            <button
              className="w-full border border-base-500 px-6 py-3 text-base text-base-300 hover:bg-base-1000 focus:outline-none focus:ring-2 focus:ring-base-500 focus:ring-offset-2"
              onClick={() => setView(LoginViews.MINTED)}
            >
              Try again
            </button>
          ) : (
            <button
              className="w-full border border-base-500 px-6 py-3 text-base text-base-300 hover:bg-base-1000 focus:outline-none focus:ring-2 focus:ring-base-500 focus:ring-offset-2"
              onClick={() => setView(LoginViews.SIGN_UP)}
            >
              Go back
            </button>
          )}
        </div>
      )}
      {view === LoginViews.SIGN_UP && (
        <div>
          <h1 className="text-3xl sm:text-4xl text-base-100 font-medium mb-4">
            The most secure and customizable wallet that&apos;s 100% yours.
          </h1>
          <p className="text-sm sm:text-base mb-6">
            Create a self-custody wallet in just a few taps using the latest
            auth flow&mdash;passkeys. No more passwords, no more seed phrases,
            no more extensions.
          </p>
          <form onSubmit={createPKPWithWebAuthn} className="w-100 mb-3">
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-base text-base-300"
              >
                Your passkey name
              </label>
              <div className="mt-1">
                <input
                  name="username"
                  type="text"
                  autoComplete="username webauthn"
                  aria-describedby="username-field"
                  placeholder='e.g. "Eth Denver 2023"'
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="block w-full border border-transparent bg-base-1000 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <p id="username-field" className="mt-2 text-sm text-base-500">
                Give your passkey a unique name.
              </p>
            </div>
            <button
              type="submit"
              className="w-full border border-indigo-500 px-6 py-3 text-base text-indigo-300 bg-indigo-600 bg-opacity-20 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Get started
            </button>
          </form>
          <div className="text-sm text-base-500 text-center">
            Have a wallet?{' '}
            <button
              className="text-indigo-400 hover:text-indigo-500 focus:outline-none hover:underline"
              onClick={() => setView(LoginViews.SIGN_IN)}
            >
              Sign in
            </button>
          </div>
        </div>
      )}
      {view === LoginViews.REGISTERING && (
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="animate-pulse w-10 h-10 text-base-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
          <h1 className="mt-6 text-3xl sm:text-4xl text-base-100 font-medium mb-4">
            Register your passkey
          </h1>
          <p className="text-sm sm:text-base mb-6">
            Follow your browser&apos;s prompts to create a passkey.
          </p>
        </div>
      )}
      {view === LoginViews.MINTING && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/loading.gif"
            className="w-20 object-contain"
            alt="Nyan Cat loading gif"
          ></img>

          <h1 className="mt-6 text-2xl sm:text-3xl text-base-100 font-medium mb-4">
            Registration successful! Minting your new wallet...
          </h1>
          <p className="text-sm sm:text-base mb-6">
            Hang tight and keep this page open as your cloud wallet is being
            minted on-chain.
          </p>
        </div>
      )}
      {view === LoginViews.MINTED && (
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-10 h-10 text-base-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
          <h1 className="mt-6 text-3xl sm:text-4xl text-base-100 font-medium mb-4">
            You&apos;ve created a wallet!
          </h1>
          <p className="text-sm sm:text-base mb-6">
            To start using your new cloud wallet, you&apos;ll need to
            authenticate with your newly registered passkey. Continue when
            you&apos;re ready.
          </p>
          <button
            className="w-full border border-indigo-500 px-6 py-3 text-base text-indigo-300 bg-indigo-600 bg-opacity-20 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={authThenGetSessionSigs}
          >
            Continue
          </button>
        </div>
      )}
      {view === LoginViews.AUTHENTICATING && (
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="animate-pulse w-10 h-10 text-base-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
          <h1 className="mt-6 text-3xl sm:text-4xl text-base-100 font-medium mb-4">
            Authenticate with your passkey
          </h1>
          <p className="text-sm sm:text-base mb-6">
            Follow your browser&apos;s prompts to authenticate with your
            passkey.
          </p>
        </div>
      )}
      {view === LoginViews.CREATING_SESSION && (
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="animate-pulse w-10 h-10 text-base-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          <h1 className="mt-6 text-2xl sm:text-3xl text-base-100 font-medium mb-4">
            Authentication successful! Securing your session...
          </h1>
          <p className="text-sm sm:text-base mb-6">
            Creating a secured session so you can use your new cloud wallet
            momentarily.
          </p>
        </div>
      )}
      {view === LoginViews.SESSION_CREATED && (
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-10 h-10 text-base-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
          <h1 className="mt-6 text-3xl sm:text-4xl text-base-100 font-medium mb-4">
            Successfully signed in with Lit
          </h1>
          <p className="text-sm sm:text-base mb-6">
            You should now be signed in. Refresh this page if you don&apos;t see
            your dashboard.
          </p>
        </div>
      )}
      {/* {view === LoginViews.SIGN_IN && (
        <div>
          <h1 className="text-3xl sm:text-4xl text-base-100 font-medium mb-4">
            Welcome back
          </h1>
          <p className="text-sm sm:text-base mb-8">
            Navigate the open web with a secure, self-custody wallet that you
            can easily tailor to your needs.
          </p>
          <div className="w-100 mb-3">
            <button
              onClick={authThenGetSessionSigs}
              className="w-full border border-indigo-500 px-6 py-3 text-base text-indigo-300 bg-indigo-600 bg-opacity-20 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Sign in
            </button>
          </div>
          <div className="text-sm text-base-500 text-center">
            Need a cloud wallet?{' '}
            <button
              onClick={() => setView(LoginViews.SIGN_UP)}
              className="text-indigo-400 hover:text-indigo-500 focus:outline-none hover:underline"
            >
              Create one
            </button>
          </div>
        </div>
      )} */}
      <Footer
        showDisclaimer={
          view === LoginViews.SIGN_UP || view === LoginViews.SIGN_IN
        }
      />
    </>
  );
}
