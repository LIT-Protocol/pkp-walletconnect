import LitJsSdk from 'lit-js-sdk';
import { ethers } from 'ethers';
import { recoverAddress } from '@ethersproject/transactions';
import { joinSignature } from '@ethersproject/bytes';
import {
  SignTypedDataVersion,
  TypedDataUtils,
  typedSignatureHash,
  recoverPersonalSignature,
  recoverTypedSignature,
} from '@metamask/eth-sig-util';
import { convertHexToUtf8, getSignVersionEnum } from './helpers';
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
  const sig = signatures.sig1;
  const dataSigned = sig.dataSigned;
  const encodedSig = joinSignature({
    r: '0x' + sig.r,
    s: '0x' + sig.s,
    v: sig.recid,
  });

  return encodedSig;
}

function verifySignPersonalMessage(message, signature, publicKey) {
  const ethAddress = ethers.utils.computeAddress(publicKey);

  // verifyMessage hashes the message for you
  // https://docs.ethers.io/v5/api/utils/signing-key/#utils-verifyMessage
  // const messageStr = convertHexToUtf8(message);
  // const recoveredAddress = verifyMessage(messageStr, signature);

  // options.data - The hex data that was signed.
  // https://github.com/MetaMask/eth-sig-util/blob/9f01c9d7922b717ddda3aa894c38fbba623e8bdf/src/personal-sign.ts#L53
  const recoveredAddress = recoverPersonalSignature({
    data: message,
    signature: signature,
  });

  return ethAddress.toLowerCase() === recoveredAddress.toLowerCase();
}

export async function signMessage(message, publicKey) {
  if (!litNodeClient) {
    await initLitNodeClient();
  }

  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: 'mumbai',
  });

  const messageHash = ethers.utils.hashMessage(message);
  const messageHashBytes = ethers.utils.arrayify(messageHash);

  const response = await litNodeClient.executeJs({
    code: SIGN_CODE,
    authSig,
    jsParams: {
      toSign: messageHashBytes,
      publicKey: publicKey,
      sigName: 'sig1',
    },
  });
  const signatures = response.signatures;
  const sig = signatures.sig1;
  const dataSigned = sig.dataSigned;
  const encodedSig = joinSignature({
    r: '0x' + sig.r,
    s: '0x' + sig.s,
    v: sig.recid,
  });

  return encodedSig;
}

function verifySignMessage(message, signature, publicKey) {
  const ethAddress = ethers.utils.computeAddress(publicKey);

  // verifyMessage hashes the message for you
  // https://docs.ethers.io/v5/api/utils/signing-key/#utils-verifyMessage
  // const recoveredAddress = verifyMessage(message, signature);

  // https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/util/docs/README.md#ecrecover
  const messageHash = ethers.utils.hashMessage(message);
  const sig = ethUtil.fromRpcSig(signature);
  const pubkey = ethUtil.ecrecover(
    ethUtil.toBuffer(messageHash),
    sig.v,
    sig.r,
    sig.s
  );
  const recoveredAddress = ethUtil.bufferToHex(ethUtil.publicToAddress(pubkey));

  return ethAddress.toLowerCase() === recoveredAddress.toLowerCase();
}

export async function signTypedData(data, version, publicKey) {
  let messageHash;

  if (version === SignTypedDataVersion.V1) {
    // https://github.com/MetaMask/eth-sig-util/blob/9f01c9d7922b717ddda3aa894c38fbba623e8bdf/src/sign-typed-data.ts#L435
    messageHash = typedSignatureHash(data);
  } else {
    const { types, domain, primaryType, message } = JSON.parse(data);
    delete types.EIP712Domain;
    const typedData = { types, primaryType, domain, message };
    // https://github.com/MetaMask/eth-sig-util/blob/main/src/sign-typed-data.ts#L382
    messageHash = TypedDataUtils.eip712Hash(typedData, version);
  }

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
      toSign: messageHash,
      publicKey: publicKey,
      sigName: 'sig1',
    },
  });
  const signatures = response.signatures;
  const sig = signatures.sig1;
  const dataSigned = sig.dataSigned;
  const encodedSig = joinSignature({
    r: '0x' + sig.r,
    s: '0x' + sig.s,
    v: sig.recid,
  });

  return encodedSig;
}

function verifySignTypedData(data, version, signature, publicKey) {
  const ethAddress = ethers.utils.computeAddress(publicKey);

  let checkData;

  if (version === SignTypedDataVersion.V1) {
    checkData = data;
  } else {
    const { types, domain, primaryType, message } = JSON.parse(data);
    delete types.EIP712Domain;
    checkData = { types, primaryType, domain, message };
  }

  // https://metamask.github.io/eth-sig-util/latest/modules.html#recoverTypedSignature
  const recoveredAddress = recoverTypedSignature({
    data: checkData,
    signature: signature,
    version: version,
  });

  return ethAddress.toLowerCase() === recoveredAddress.toLowerCase();
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
  const sig = response.signatures.sig1;
  const dataSigned = sig.dataSigned;
  const encodedSig = joinSignature({
    r: '0x' + sig.r,
    s: '0x' + sig.s,
    v: sig.recid,
  });

  const signedTxn = ethers.utils.serializeTransaction(
    transaction,
    sig.signature
  );
  console.log('signedTxn: ', signedTxn);

  return signedTxn;
}

function verifySignTransaction(dataSigned, encodedSig, publicKey) {
  const ethAddress = ethers.utils.computeAddress(publicKey);
  // const recoveredPubkey = recoverPublicKey(dataSigned, encodedSig);
  // console.log('uncompressed recoveredPubkey', recoveredPubkey);
  // const compressedRecoveredPubkey = computePublicKey(recoveredPubkey, true);
  // console.log('compressed recoveredPubkey', compressedRecoveredPubkey);
  const recoveredAddress = recoverAddress(dataSigned, encodedSig);

  return ethAddress.toLowerCase() === recoveredAddress.toLowerCase();
}

export async function sendTransaction(transaction, publicKey) {
  if (!litNodeClient) {
    await initLitNodeClient();
  }

  const signedTxn = await signTransaction(transaction, publicKey);

  const rpcUrl = SUPPORTED_CHAINS[transaction.chainId].rpc_url;
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const sentTxn = await provider.sendTransaction(signedTxn);
  console.log('sentTxn', sentTxn);

  return sentTxn;
}

export async function getAuthSig() {
  if (!litNodeClient) {
    await initLitNodeClient();
  }

  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: 'mumbai',
  });

  return authSig;
}
