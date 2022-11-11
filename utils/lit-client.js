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
import {
  SignTypedDataVersion,
  TypedDataUtils,
  recoverPersonalSignature,
  recoverTypedSignature,
} from '@metamask/eth-sig-util';
import {
  convertHexToUtf8,
  getMessageToSign,
  getPersonalMessageToSign,
  hashMessage,
  hashTypedDataMessage,
} from './helpers';
import * as ethUtil from 'ethereumjs-util';

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

  // Sign message string with ethPersonalSignMessageEcdsa
  // https://actions-docs.litprotocol.com/#ethpersonalsignmessageecdsa
  const messageStr = convertHexToUtf8(message);
  const response = await litNodeClient.executeJs({
    code: PERSONAL_SIGN_CODE,
    authSig,
    jsParams: {
      message: messageStr,
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

  // verifyMessage hashes the message for you
  // https://docs.ethers.io/v5/api/utils/signing-key/#utils-verifyMessage
  const recoveredAddressViaMessage = verifyMessage(messageStr, encodedSig);
  console.log('recoveredAddressViaMessage', recoveredAddressViaMessage);

  // options.data - The hex data that was signed.
  // https://github.com/MetaMask/eth-sig-util/blob/9f01c9d7922b717ddda3aa894c38fbba623e8bdf/src/personal-sign.ts#L53
  console.log(
    'recoverPersonalSignature',
    recoverPersonalSignature({ data: message, signature: encodedSig })
  );

  return encodedSig;
}

export async function signMessage(message, publicKey) {
  if (!litNodeClient) {
    await initLitNodeClient();
  }

  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: 'mumbai',
  });

  const toSign = ethers.utils.arrayify(ethers.utils.hashMessage(message));

  const response = await litNodeClient.executeJs({
    code: SIGN_CODE,
    authSig,
    jsParams: {
      toSign: toSign,
      publicKey: publicKey,
      sigName: 'sig1',
    },
  });
  console.log('response', response);
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

  // verifyMessage hashes the message for you
  // https://docs.ethers.io/v5/api/utils/signing-key/#utils-verifyMessage
  const recoveredAddressViaMessage = verifyMessage(message, encodedSig);
  console.log('recoveredAddressViaMessage', recoveredAddressViaMessage);

  const testparams = ethUtil.fromRpcSig(encodedSig);
  console.log('ethUtil testparams', testparams);
  const testresult = ethUtil.ecrecover(
    ethUtil.toBuffer(ethers.utils.hashMessage(message)),
    testparams.v,
    testparams.r,
    testparams.s
  );
  console.log('ethUtil testresult', testresult);
  const testsigner = ethUtil.bufferToHex(ethUtil.publicToAddress(testresult));
  console.log('ethUtil testsigner', testsigner);

  return encodedSig;
}

export async function signTypedData(data, version, publicKey) {
  const { types, domain, primaryType, message } = JSON.parse(data);
  delete types.EIP712Domain;
  const typedData = { types, primaryType, domain, message };
  const versionEnum =
    version === 'V3' ? SignTypedDataVersion.V3 : SignTypedDataVersion.V4;
  const hash = TypedDataUtils.eip712Hash(typedData, versionEnum);

  if (!litNodeClient) {
    await initLitNodeClient();
  }

  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: 'mumbai',
  });

  // Sign data with signEcdsa
  // https://actions-docs.litprotocol.com/#signecdsa
  const response = await litNodeClient.executeJs({
    code: SIGN_CODE,
    authSig,
    jsParams: {
      toSign: hash,
      publicKey: publicKey,
      sigName: 'sig1',
    },
  });
  console.log('response', response);
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

  // data: typed data
  // https://metamask.github.io/eth-sig-util/latest/modules.html#recoverTypedSignature
  console.log(
    'recoverTypedSignature',
    recoverTypedSignature({
      data: typedData,
      signature: encodedSig,
      version: versionEnum,
    })
  );

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

  return sentTxn;
}

export function getLitNodeClient() {
  return litNodeClient;
}
