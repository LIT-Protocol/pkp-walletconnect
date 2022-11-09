import LitJsSdk from 'lit-js-sdk';
import { ethers } from 'ethers';
import { serialize, recoverAddress } from '@ethersproject/transactions';
import {
  hexlify,
  splitSignature,
  hexZeroPad,
  joinSignature,
} from '@ethersproject/bytes';
import { recoverPublicKey, computePublicKey } from '@ethersproject/signing-key';
import { verifyMessage } from '@ethersproject/wallet';
import { providers } from 'ethers';

const PERSONAL_SIGN_CODE = `
  const go = async () => {
    const sigShare = await LitActions.ethPersonalSignMessageEcdsa({ message, publicKey, sigName });
  };
  
  go();
`;

const SIGN_CODE = `
  const go = async () => {
    const sigShare = await LitActions.signEcdsa({ toSign, publicKey, sigName });
  };
  
  go();
`;

const SIGN_TRANSACTION_FILE = 'QmRwN9GKHvCn4Vk7biqtr6adjXMs7PzzYPCzNCRjPFiDjm';

let litNodeClient = null;

export async function initLitNodeClient() {
  const client = new LitJsSdk.LitNodeClient({
    litNetwork: 'mumbai',
    debug: false,
  });
  await client.connect();
  litNodeClient = client;
}

export async function signPersonalMessage(message, publicKey) {
  if (!litNodeClient) {
    await initLitNodeClient();
  }

  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: 'mumbai',
  });

  const response = await litNodeClient.executeJs({
    code: PERSONAL_SIGN_CODE,
    authSig,
    jsParams: {
      message: message,
      publicKey: publicKey,
      sigName: 'sig1',
    },
  });
  const signatures = response.signatures;
  // console.log('signatures: ', signatures);
  const sig = signatures.sig1;
  const dataSigned = sig.dataSigned;
  const encodedSig = joinSignature({
    r: '0x' + sig.r,
    s: '0x' + sig.s,
    v: sig.recid,
  });
  console.log('encodedSig', encodedSig);
  console.log('sig length in bytes: ', encodedSig.substring(2).length / 2);
  console.log('dataSigned', dataSigned);
  const splitSig = splitSignature(encodedSig);
  console.log('splitSig', splitSig);

  const recoveredPubkey = recoverPublicKey(dataSigned, encodedSig);
  console.log('uncompressed recoveredPubkey', recoveredPubkey);
  const compressedRecoveredPubkey = computePublicKey(recoveredPubkey, true);
  console.log('compressed recoveredPubkey', compressedRecoveredPubkey);
  const recoveredAddress = recoverAddress(dataSigned, encodedSig);
  console.log('recoveredAddress', recoveredAddress);

  const recoveredAddressViaMessage = verifyMessage(message, encodedSig);
  console.log('recoveredAddressViaMessage', recoveredAddressViaMessage);

  return encodedSig;
}

export async function signMessage(message, publicKey) {
  if (!litNodeClient) {
    await initLitNodeClient();
  }

  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: 'mumbai',
  });

  const response = await litNodeClient.executeJs({
    code: SIGN_CODE,
    authSig,
    jsParams: {
      toSign: message,
      publicKey: publicKey,
      sigName: 'sig1',
    },
  });
  const signatures = response.signatures;
  // console.log('signatures: ', signatures);
  const sig = signatures.sig1;
  const dataSigned = sig.dataSigned;
  const encodedSig = joinSignature({
    r: '0x' + sig.r,
    s: '0x' + sig.s,
    v: sig.recid,
  });
  console.log('encodedSig', encodedSig);
  console.log('sig length in bytes: ', encodedSig.substring(2).length / 2);
  console.log('dataSigned', dataSigned);
  const splitSig = splitSignature(encodedSig);
  console.log('splitSig', splitSig);

  const recoveredPubkey = recoverPublicKey(dataSigned, encodedSig);
  console.log('uncompressed recoveredPubkey', recoveredPubkey);
  const compressedRecoveredPubkey = computePublicKey(recoveredPubkey, true);
  console.log('compressed recoveredPubkey', compressedRecoveredPubkey);
  const recoveredAddress = recoverAddress(dataSigned, encodedSig);
  console.log('recoveredAddress', recoveredAddress);

  return encodedSig;
}

export async function signTransaction(transaction, publicKey) {
  if (!litNodeClient) {
    await initLitNodeClient();
  }

  // console.log('transaction', transaction);

  const serializedTx = ethers.utils.serializeTransaction(transaction);
  // console.log('serializedTx', serializedTx);

  const rlpEncodedTxn = ethers.utils.arrayify(serializedTx);
  // console.log('rlpEncodedTxn: ', rlpEncodedTxn);

  const unsignedTxn = ethers.utils.keccak256(rlpEncodedTxn);
  // console.log('unsignedTxn: ', unsignedTxn);

  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: 'mumbai',
  });

  const response = await litNodeClient.executeJs({
    ipfsId: SIGN_TRANSACTION_FILE,
    authSig,
    jsParams: {
      toSign: ethers.utils.arrayify(unsignedTxn),
      publicKey,
      sigName: 'sig1',
    },
  });
  // console.log('response: ', response);
  const sig = response.signatures.sig1;
  // console.log('sig: ', sig);
  const dataSigned = sig.dataSigned;
  const encodedSig = joinSignature({
    r: '0x' + sig.r,
    s: '0x' + sig.s,
    v: sig.recid,
  });

  console.log('encodedSig', encodedSig);
  console.log('sig length in bytes: ', encodedSig.substring(2).length / 2);
  console.log('dataSigned', dataSigned);
  const splitSig = splitSignature(encodedSig);
  console.log('splitSig', splitSig);

  const recoveredPubkey = recoverPublicKey(dataSigned, encodedSig);
  console.log('uncompressed recoveredPubkey', recoveredPubkey);
  const compressedRecoveredPubkey = computePublicKey(recoveredPubkey, true);
  console.log('compressed recoveredPubkey', compressedRecoveredPubkey);
  const recoveredAddress = recoverAddress(dataSigned, encodedSig);
  console.log('recoveredAddress', recoveredAddress);

  const signedTxn = ethers.utils.serializeTransaction(
    transaction,
    sig.signature
  );
  console.log('signedTxn: ', signedTxn);

  return signedTxn;
}

export async function sendTransaction(transaction, publicKey, rpcUrl) {
  if (!litNodeClient) {
    await initLitNodeClient();
  }

  const signedTxn = await signTransaction(transaction, publicKey);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const sentTxn = await provider.sendTransaction(signedTxn);
  console.log('sentTxn', sentTxn);

  return sentTxn.hash;
}

export function getLitNodeClient() {
  return litNodeClient;
}
