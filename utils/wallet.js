import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { ethers } from 'ethers';

// TODO: temp as PKPClient is not yet published

export async function signEthereumRequest(pkp, sessionSigs, payload) {
  let address = ethers.utils.computeAddress(pkp.publicKey);

  let addressRequested = null;
  let message = null;
  let msgParams = null;
  let txParams = null;
  let transaction = null;
  let result = null;

  switch (payload.method) {
    case 'personal_sign':
      addressRequested = payload.params[1];
      if (address.toLowerCase() !== addressRequested.toLowerCase()) {
        throw new Error('PKPWallet address does not match address requested');
      }
      message = convertHexToUtf8(payload.params[0]);
      result = await signMessage(pkp, sessionSigs, message);
      break;
    default:
      throw new Error(
        `Ethereum JSON-RPC signing method "${payload.method}" is not supported`
      );
  }

  return result;
}

async function signMessage(pkp, sessionSigs, message) {
  const litNodeClient = new LitNodeClient({ litNetwork: 'serrano' });
  await litNodeClient.connect();

  const toSign = ethers.utils.arrayify(ethers.utils.hashMessage(message));
  const litActionCode = `
      const go = async () => {
        // this requests a signature share from the Lit Node
        // the signature share will be automatically returned in the response from the node
        // and combined into a full signature by the LitJsSdk for you to use on the client
        // all the params (toSign, publicKey, sigName) are passed in from the LitJsSdk.executeJs() function
        const sigShare = await LitActions.signEcdsa({ toSign, publicKey, sigName });
      };
      go();
    `;
  // Sign message
  const results = await litNodeClient.executeJs({
    code: litActionCode,
    sessionSigs,
    jsParams: {
      toSign: toSign,
      publicKey: pkp.publicKey,
      sigName: 'sig1',
    },
  });
  // Get signature
  const result = results.signatures['sig1'];
  const signature = ethers.utils.joinSignature({
    r: '0x' + result.r,
    s: '0x' + result.s,
    v: result.recid,
  });

  return signature;
}

function convertHexToUtf8(value) {
  try {
    if (ethers.utils.isHexString(value)) {
      return ethers.utils.toUtf8String(value);
    }
    return value;
  } catch (e) {
    return value;
  }
}
