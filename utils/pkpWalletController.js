import { PKPWallet } from 'pkp-eth-signer';
import { ethers } from 'ethers';
import LitJsSdk from 'lit-js-sdk';
import {
  convertHexToUtf8,
  getSignVersionByMessageFormat,
  getSignVersionEnum,
  getTransactionToSign,
  getTransactionToSend,
  getRPCUrl,
} from './helpers';
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
import { PERSONAL_SIGN_CODE } from './constants';

class PKPWalletController {
  /**
   * Manages PKPWallet instance and holds PKP details
   *
   * @param {Object} options PKPWalletController options, which should include arguments for PKPWallet
   * @param {string} options.publicKey PKP public key
   * @param {string} options.address PKP address
   * @param {string} options.tokenId PKP token ID
   *
   * @returns {PKPWalletController} PKPWalletController instance
   */
  constructor(options) {
    this._publicKey = options.publicKey;
    this._address = options.address;
    this._tokenId = options.tokenId;
    this._wallet = null;
    this._initialized = false;
  }

  // -- Getters --

  /**
   * Returns PKP public key
   *
   * @returns {string} PKP public key
   */
  get publicKey() {
    return this._publicKey;
  }

  /**
   * Returns PKP address
   *
   * @returns {string} PKP address
   */
  get address() {
    return this._address;
  }

  /**
   * Returns PKP public key
   *
   * @returns {string} PKP public key
   */
  get tokenId() {
    return this._tokenId;
  }

  /**
   * Returns PKPWallet
   *
   * @returns {PKPWallet} PKPWallet instance
   */
  get wallet() {
    return this._wallet;
  }

  /**
   * Returns whether the PKPWallet is initialized
   *
   * @returns {boolean} true if PKPWallet is initialized
   */
  get initialized() {
    return this._initialized;
  }

  // -- Public methods --

  /**
   * Create PKPWallet
   *
   * @param {string} authSig auth signature from PKP owner
   * @param {*} rpcUrl
   */
  async initialize(authSig, rpcUrl) {
    const wallet = new PKPWallet({
      pkpPubKey: this.publicKey,
      controllerAuthSig: authSig,
      provider: rpcUrl,
    });
    await wallet.init();
    this._wallet = wallet;
    this._initialized = true;
  }

  /**
   * Sign message with PKPWallet
   *
   * @param {(Bytes | string)} message message to sign
   *
   * @returns {Promise<string>} signature
   */
  async signMessage(message) {
    if (!this.initialized) {
      throw new Error('PKPWallet is not initialized');
    }
    const signature = await this.wallet.signMessage(message);
    return signature;
  }

  /**
   * Sign typed data with PKPWallet
   *
   * @param {Object} msgParams message to sign
   * @param {SignTypedDataVersion} version method version to use
   *
   * @returns {Promise<string>} signature
   */
  async signTypedData(msgParams, version) {
    if (!this.initialized) {
      throw new Error('PKPWallet is not initialized');
    }

    let messageHash;
    let signature;
    let encodedSig;

    if (version === SignTypedDataVersion.V1) {
      // https://github.com/MetaMask/eth-sig-util/blob/9f01c9d7922b717ddda3aa894c38fbba623e8bdf/src/sign-typed-data.ts#L435
      messageHash = typedSignatureHash(msgParams);
      signature = await this.wallet.runLitAction(messageHash, 'sig1');
      encodedSig = joinSignature({
        r: '0x' + signature.r,
        s: '0x' + signature.s,
        v: signature.recid,
      });
    } else {
      const { types, domain, primaryType, message } = JSON.parse(msgParams);
      delete types.EIP712Domain;
      const typedData = { types, primaryType, domain, message };
      messageHash = TypedDataUtils.eip712Hash(typedData, version);
      // signature = await this.wallet._signTypedData(domain, types, message);
      signature = await this.wallet.runLitAction(messageHash, 'sig1');
      encodedSig = joinSignature({
        r: '0x' + signature.r,
        s: '0x' + signature.s,
        v: signature.recid,
      });
    }

    return encodedSig;
  }

  /**
   * Sign transaction with PKPWallet
   *
   * @param {Object} txParams transaction to sign
   *
   * @returns {Promise<Object>} signed transaction
   */
  async signTransaction(txParams) {
    if (!this.initialized) {
      throw new Error('PKPWallet is not initialized');
    }

    const signedTx = await this.wallet.signTransaction(txParams);
    console.log('signedTx:', signedTx);
    return signedTx;
  }

  /**
   * Send transaction with PKPWallet
   *
   * @param {Object} txParams transaction to send
   *
   * @returns {Promise<Object>} sent transaction
   */
  async sendTransaction(txParams) {
    if (!this.initialized) {
      throw new Error('PKPWallet is not initialized');
    }

    const signedTx = await this.wallet.signTransaction(txParams);
    console.log('signedTx:', signedTx);
    const sentTx = await this.wallet.sendTransaction(signedTx);
    console.log('sentTx:', sentTx);
    return sentTx;
  }

  /**
   * Parse Ethereum JSON-RPC API payloads and handle them if method is supported
   *
   * @param {Object} payload JSON RPC payload
   * @param {number} chainId chain id of network to use
   *
   * @returns {(Promise<string> | Promise<Object>)} signed message, signed data, signed transaction, or sent transaction
   */
  async handleJSONRPCCalls(payload, chainId) {
    if (!this.initialized) {
      throw new Error('PKPWallet is not initialized');
    }

    let message;
    let msgParams;
    let version;
    let txParams;
    let result;

    switch (payload.method) {
      case 'eth_sign':
        message = payload.params[1];
        result = await this.signMessage(message);
        break;
      case 'personal_sign':
        message = convertHexToUtf8(payload.params[0]);
        result = await this.signMessage(message);
        break;
      case 'eth_signTypedData':
        msgParams = payload.params[1];
        version = getSignVersionByMessageFormat(msgParams);
        result = await this.signTypedData(msgParams, version);
        break;
      case 'eth_signTypedData_v1':
        msgParams = payload.params[1];
        version = getSignVersionEnum('v1');
        result = await this.signTypedData(msgParams, version);
        break;
      case 'eth_signTypedData_v3':
        msgParams = payload.params[1];
        version = getSignVersionEnum('v3');
        result = await this.signTypedData(msgParams, version);
        break;
      case 'eth_signTypedData_v4':
        msgParams = payload.params[1];
        version = getSignVersionEnum('v4');
        result = await this.signTypedData(msgParams, version);
        break;
      case 'eth_signTransaction':
        txParams = getTransactionToSign(payload.params[0], chainId);
        result = await this.signTransaction(txParams);
        break;
      case 'eth_sendTransaction':
        txParams = getTransactionToSend(payload.params[0], chainId);
        result = await this.sendTransaction(txParams);
        break;
      default:
        throw new Error(
          `JSON-RPC call request "${payload.method}" is not supported`
        );
    }

    return result;
  }
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

export default PKPWalletController;
