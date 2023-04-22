import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { ethers } from 'ethers';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import base64url from 'base64url';

/**
 * WebAuthn helpers
 *
 * TEMP: Porting things over to the TS SDK
 */

export const DEFAULT_EXP = new Date(
  Date.now() + 1000 * 60 * 60 * 24 * 7
).toISOString();

const relayServerUrl =
  process.env.NEXT_PUBLIC_RELAY_API_URL ||
  'https://relay-server-staging.herokuapp.com';
const relayApiKey = process.env.NEXT_PUBLIC_RELAY_API_KEY || 'test';
const rpcUrl = 'https://chain-rpc.litprotocol.com/http';

// Register WebAuthn credential
export async function register(username) {
  // Generate registration options for the browser to pass to a supported authenticator
  let publicKeyCredentialCreationOptions = null;

  let url = `${relayServerUrl}/auth/webauthn/generate-registration-options`;
  if (username !== '') {
    url = `${url}?username=${encodeURIComponent(username)}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'api-key': relayApiKey,
    },
  });
  if (response.status < 200 || response.status >= 400) {
    const errorJson = await response.json();
    const errorMsg = errorJson.error || 'Unknown error';
    const relayErr = new Error(`Unable to register credential: ${errorMsg}`);
    throw relayErr;
  }

  // Pass the options to the authenticator and wait for a response
  publicKeyCredentialCreationOptions = await response.json();
  // console.log(publicKeyCredentialCreationOptions);

  // Require a resident key for this demo
  publicKeyCredentialCreationOptions.authenticatorSelection.residentKey =
    'required';
  publicKeyCredentialCreationOptions.authenticatorSelection.requireResidentKey = true;
  publicKeyCredentialCreationOptions.extensions = {
    credProps: true,
  };

  return publicKeyCredentialCreationOptions;
}

export async function verifyRegistration(options) {
  // Submit registration options to the authenticator
  const attResp = await startRegistration(options);

  // Send the credential to the relying party for verification
  let verificationJSON = null;

  const response = await fetch(
    `${relayServerUrl}/auth/webauthn/verify-registration`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': relayApiKey,
      },
      body: JSON.stringify({ credential: attResp }),
    }
  );
  if (response.status < 200 || response.status >= 400) {
    const errorJson = await response.json();
    const errorMsg = errorJson.error || 'Unknown error';
    const relayErr = new Error(`Unable to verify registration: ${errorMsg}`);
    throw relayErr;
  }

  verificationJSON = await response.json();
  // console.log('verificationJSON', verificationJSON);

  // If the credential was verified and registration successful, minting has kicked off
  if (verificationJSON && verificationJSON.requestId) {
    return verificationJSON.requestId;
  } else {
    const err = new Error(
      `WebAuthn registration error: ${JSON.stringify(verificationJSON)}`
    );
    throw err;
  }
}

// Poll the relay server for status of minting request
export async function pollRequestUntilTerminalState(requestId) {
  const maxPollCount = 20;
  for (let i = 0; i < maxPollCount; i++) {
    const response = await fetch(`${relayServerUrl}/auth/status/${requestId}`, {
      method: 'GET',
      headers: {
        'api-key': relayApiKey,
      },
    });

    if (response.status < 200 || response.status >= 400) {
      const err = new Error(
        `Unable to poll the status of this mint PKP transaction: ${requestId}`
      );
      throw err;
    }

    const resBody = await response.json();
    if (resBody.error) {
      // Exit loop since error
      const err = new Error(resBody.error);
      throw err;
    } else if (resBody.status === 'Succeeded') {
      // Exit loop since success
      return resBody;
    }

    // otherwise, sleep then continue polling
    await new Promise(r => setTimeout(r, 1000));
  }

  // At this point, polling ended and still no success, set failure status
  // console.error(`Hmm this is taking longer than expected...`);
  const err = new Error('Polling for mint PKP transaction status timed out');
  throw err;
}

// Authenticate with WebAuthn credential and mint PKP
export async function authenticate() {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const block = await provider.getBlock('latest');
  const blockHash = block.hash;

  // Turn into byte array.
  const blockHashBytes = ethers.utils.arrayify(blockHash);
  // console.log(
  //   'blockHash',
  //   blockHash,
  //   blockHashBytes,
  //   base64url(Buffer.from(blockHashBytes))
  // );

  // Construct authentication options.
  const rpId = getDomainFromOrigin(window.location.origin);
  // console.log('Using rpId: ', { rpId });
  const authenticationOptions = {
    challenge: base64url(Buffer.from(blockHashBytes)),
    timeout: 60000,
    userVerification: 'preferred',
    rpId,
  };

  // Authenticate with WebAuthn.
  const authenticationResponse = await startAuthentication(
    authenticationOptions
  );
  // console.log('authenticationResponse', authenticationResponse);

  // BUG: We need to make sure userHandle is base64url encoded.
  // Deep copy the authentication response.
  const actualAuthenticationResponse = JSON.parse(
    JSON.stringify(authenticationResponse)
  );
  actualAuthenticationResponse.response.userHandle = base64url.encode(
    authenticationResponse.response.userHandle
  );

  return authenticationResponse;
}

export async function getSessionSigsForWebAuthn(pkpPublicKey, authData) {
  const litNodeClient = new LitNodeClient({
    litNetwork: 'serrano',
    debug: false,
  });
  await litNodeClient.connect();

  // Generate authMethod
  const authMethod = litNodeClient.generateAuthMethodForWebAuthn(authData);

  // Get sessionSigs
  const authNeededCallback = async params => {
    const resp = await litNodeClient.signSessionKey({
      authMethods: [authMethod],
      pkpPublicKey,
      expiration: params.expiration,
      resources: params.resources,
      chainId: 1,
    });
    return resp.authSig;
  };

  const sessionSigs = await litNodeClient.getSessionSigs({
    expiration: DEFAULT_EXP,
    chain: 'ethereum',
    resources: ['litAction://*'],
    switchChain: false,
    authNeededCallback: authNeededCallback,
  });

  return sessionSigs;
}

export async function fetchPKPs(authData) {
  const fetchRes = await fetch(`${relayServerUrl}/auth/webauthn/userinfo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': relayApiKey,
    },
    body: JSON.stringify({ credential: authData }),
  });
  if (fetchRes.status < 200 || fetchRes.status >= 400) {
    const errorJson = await fetchRes.json();
    const errorMsg = errorJson.error || 'Unknown error';
    const relayErr = new Error(`Unable to fetch PKPs: ${errorMsg}`);
    throw relayErr;
  }
  const fetchJSON = await fetchRes.json();
  return fetchJSON.pkps;
}

function getDomainFromOrigin(origin) {
  // remove protocol with regex
  let newOrigin = origin.replace(/(^\w+:|^)\/\//, '');
  // remove port with regex
  return newOrigin.replace(/:\d+$/, '');
}
