import {
  DEFAULT_CHAIN_ID,
  DEFAULT_CHAINS,
  PERSONAL_SIGN_CODE,
  SIGN_CODE,
  SIGN_TRANSACTION_FILE,
} from './constants';
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
import * as ethUtil from 'ethereumjs-util';
import { convertHexToUtf8 } from './helpers';
import {
  litContractsConnected,
  connectLitContracts,
  fetchPKPsByAddress,
} from './lit-contracts';

class PKPWallet {
  constructor(options) {
    this._ownerAddress = options.ownerAddress;
    this._address = null;
    this._accounts = [];
    this._provider = options.provider;
    this._signer = options.signer;
    this._litNodeClientConfig = options.litNodeClientConfig;
    this._litNodeClient = null;
  }

  // -- Getters for PKPWallet properties --

  get ownerAddress() {
    return this._ownerAddress;
  }

  get address() {
    return this._address;
  }

  get accounts() {
    return this._accounts;
  }

  get litNodeClient() {
    return this._litNodeClient;
  }

  get litNodeClientConfig() {
    return this._litNodeClientConfig;
  }

  // -- Setters for PKPWallet properties --

  // -- Private methods --

  async _initLitNodeClient(config) {
    const newConfig = config
      ? config
      : {
          litNetwork: 'mumbai',
          debug: false,
        };

    const client = new LitJsSdk.LitNodeClient(newConfig);
    await client.connect();
    this._litNodeClient = client;
    this._litNodeClientConfig = newConfig;
  }

  async _getAuthSig(address, chainId) {
    let authSig = localStorage.getItem('lit-auth-signature');
    if (!authSig) {
      await LitJsSdk.signAndSaveAuthMessage({
        web3: this._provider,
        account: address,
        chainId: chainId,
      });
      authSig = localStorage.getItem('lit-auth-signature');
    }
    authSig = JSON.parse(authSig);
    return authSig;
  }

  async _fetchPKPs(ownerAddress) {
    if (!litContractsConnected) {
      connectLitContracts(this._signer);
    }

    const pkps = await fetchPKPsByAddress(ownerAddress);
    if (pkps.length > 0) {
      this._accounts = pkps;
      this._address = pkps[0].address;
    } else {
      this._accounts = [];
      this._address = null;
    }
  }

  // -- Public methods --

  async initialize() {
    await this._getAuthSig(this.ownerAddress, DEFAULT_CHAIN_ID);
    await this._fetchPKPs(this.ownerAddress);
    await this._initLitNodeClient(this.litNodeClientConfig);
  }

  initialized() {
    return this.address !== null;
  }

  getPublicKey(address) {
    const account = this.accounts.find(account => account.address === address);
    if (account) {
      return account.publicKey;
    } else {
      return null;
    }
  }

  useAccount(address) {
    const account = this.accounts.find(account => account.address === address);
    if (account) {
      this.address = account.address;
    } else {
      throw Error('Account not found');
    }
  }

  async signPersonalMessage(message, chainId) {
    if (!this.litNodeClient) {
      await this._initLitNodeClient(this.litNodeClientConfig);
    }

    const authSig = this._getAuthSig(this.address, chainId);
    const publicKey = this.getPublicKey(this.address);

    // Sign message string with ethPersonalSignMessageEcdsa
    // https://actions-docs.litprotocol.com/#ethpersonalsignmessageecdsa
    const messageStr = convertHexToUtf8(message);
    const response = await this.litNodeClient.executeJs({
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

  async signMessage(message, chainId) {
    if (!this.litNodeClient) {
      await this._initLitNodeClient(this.litNodeClientConfig);
    }

    const authSig = this._getAuthSig(this.address, chainId);
    const publicKey = this.getPublicKey(this.address);

    const messageHash = ethers.utils.hashMessage(message);
    const messageHashBytes = ethers.utils.arrayify(messageHash);

    const response = await this.litNodeClient.executeJs({
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

  async signTypedData(msgParams, version, chainId) {
    if (!this.litNodeClient) {
      await this._initLitNodeClient(this.litNodeClientConfig);
    }

    let messageHash;

    if (version === SignTypedDataVersion.V1) {
      // https://github.com/MetaMask/eth-sig-util/blob/9f01c9d7922b717ddda3aa894c38fbba623e8bdf/src/sign-typed-data.ts#L435
      messageHash = typedSignatureHash(msgParams);
    } else {
      const { types, domain, primaryType, message } = JSON.parse(msgParams);
      delete types.EIP712Domain;
      const typedData = { types, primaryType, domain, message };
      // https://github.com/MetaMask/eth-sig-util/blob/main/src/sign-typed-data.ts#L382
      messageHash = TypedDataUtils.eip712Hash(typedData, version);
    }

    const authSig = this._getAuthSig(this.address, chainId);
    const publicKey = this.getPublicKey(this.address);

    // Sign data with signEcdsa
    // https://actions-docs.litprotocol.com/#signecdsa
    const response = await this.litNodeClient.executeJs({
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

  async signTransaction(txParams, chainId) {
    if (!this.litNodeClient) {
      await this._initLitNodeClient(this.litNodeClientConfig);
    }

    // console.log('txParams', txParams);

    const serializedTx = ethers.utils.serializeTransaction(txParams);
    // console.log('serializedTx', serializedTx);

    const rlpEncodedTxn = ethers.utils.arrayify(serializedTx);
    // console.log('rlpEncodedTxn: ', rlpEncodedTxn);

    const unsignedTxn = ethers.utils.keccak256(rlpEncodedTxn);
    // console.log('unsignedTxn: ', unsignedTxn);

    const authSig = this._getAuthSig(this.address, chainId);
    const publicKey = this.getPublicKey(this.address);

    const response = await this.litNodeClient.executeJs({
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
      txParams,
      sig.signature
    );
    console.log('signedTxn: ', signedTxn);

    return signedTxn;
  }

  async sendTransaction(txParams) {
    if (!this.litNodeClient) {
      await this._initLitNodeClient(this.litNodeClientConfig);
    }

    const signedTxn = await signTransaction(txParams, txParams.chainId);

    const network = this.chains.find(
      chain => chain.chainId === txParams.chainId
    );
    const rpcUrl = network.rpcUrls[0];
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const sentTxn = await provider.sendTransaction(signedTxn);
    console.log('sentTxn', sentTxn);

    return sentTxn;
  }
}

// -- Public helpers --
export function verifySignPersonalMessage(message, signature) {
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

  return recoveredAddress;
}

export function verifySignMessage(message, signature) {
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

  return recoveredAddress;
}

export function verifySignTypedData(msgParams, version, signature) {
  let data;

  if (version === SignTypedDataVersion.V1) {
    data = msgParams;
  } else {
    const { types, domain, primaryType, message } = JSON.parse(msgParams);
    delete types.EIP712Domain;
    data = { types, primaryType, domain, message };
  }

  // https://metamask.github.io/eth-sig-util/latest/modules.html#recoverTypedSignature
  const recoveredAddress = recoverTypedSignature({
    data: data,
    signature: signature,
    version: version,
  });

  return recoveredAddress;
}

export default PKPWallet;
