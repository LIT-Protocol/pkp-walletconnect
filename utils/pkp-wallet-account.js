import {
  SignTypedDataVersion,
  typedSignatureHash,
} from '@metamask/eth-sig-util';
import { PKPWallet } from 'ethers';
import LitJsSdk from 'lit-js-sdk';

class PKPWalletAccount {
  /**
   * Creates account representation of PKPWallet with owner and PKP details
   *
   * @param {Object} options PKPWalletAccount options, which should include arguments for PKPWallet
   * @param {string} options.ownerAddress PKP owner address
   * @param {string} options.ownerAuthSig auth signature from PKP owner
   * @param {string} options.publicKey PKP public key
   * @param {string} options.address PKP address
   * @param {string} options.tokenId PKP token ID
   * @param {number} options.chainId chain id to get RPC url for PKPWallet
   *
   * @returns {PKPWalletAccount} PKPWalletAccount instance
   */
  constructor(options) {
    this._ownerAddress = options.ownerAddress;
    this._ownerAuthSig = options.ownerAuthSig;
    this._publicKey = options.publicKey;
    this._address = options.address;
    this._tokenId = options.tokenId;
    this._chainId = options.chainId;
    this._wallet = null;
  }

  // -- Getters --

  /**
   * Returns address of PKP owner
   *
   * @returns {string} PKP owner address
   */
  get ownerAddress() {
    return this._ownerAddress;
  }

  /**
   * Returns auth signature from PKP owner
   *
   * @returns {string} auth signature
   */
  get ownerAuthSig() {
    return this._ownerAuthSig;
  }

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
   * Returns chain id
   *
   * @returns {number} chain id
   */
  get chainId() {
    return this._chainId;
  }

  /**
   * Returns PKPWallet
   *
   * @returns {PKPWallet} PKPWallet instance
   */
  get wallet() {
    return this._wallet;
  }

  // -- Setters --

  /**
   * Sets PKPWallet
   *
   * @param {PKPWallet} wallet PKPWallet instance
   */
  set wallet(value) {
    this._wallet = value;
  }

  /**
   * Set chain id
   *
   * @param {number} chainId chain id
   */
  set chainId(value) {
    this._chainId = value;
  }

  // -- Private methods --

  /**
   * Create PKPWallet and set new wallet and chain ID
   *
   * @param {number} chainId chain id used to find RPC url for PKPWallet
   */
  async _initPKPWallet(chainId) {
    const supportedChains = LitJsSdk.LIT_CHAINS;
    const rpcUrl = supportedChains[chainId]
      ? supportedChains[chainId].rpcUrls[0]
      : null;
    if (!rpcUrl) {
      throw new Error('Chain is not supported by Lit JS SDK');
    }

    const wallet = new PKPWallet({
      pkpPubKey: this.publicKey,
      controllerAuthSig: this.ownerAuthSig,
      provider: rpcUrl,
    });
    await wallet.init();
    this.chainId = chainId;
    this.wallet = wallet;
  }

  // -- Public methods --

  /**
   * Create PKPWallet for this account
   *
   * @param {number} chainId
   */
  async initialize() {
    await this._initPKPWallet(this.chainId);
  }

  /**
   * Check if PKPWallet exists
   *
   * @returns {boolean} true if PKPWallet exists
   */
  initialized() {
    return this.wallet !== null;
  }

  /**
   * Sign message with PKPWallet
   *
   * @param {(Bytes | string)} message message to sign
   * @param {number} chainId chain id of network to use
   *
   * @returns {Promise<string>} signature
   */
  async signMessage(message, chainId) {
    if (this.chainId !== chainId) {
      await this._initPKPWallet(chainId);
    }
    const signature = await this.wallet.signMessage(message);
    return signature;
  }

  /**
   * Sign typed data with PKPWallet
   *
   * @param {Object} msgParams message to sign
   * @param {SignTypedDataVersion} version method version to use
   * @param {number} chainId chain id of network to use
   *
   * @returns {Promise<string>} signature
   */
  async signTypedData(msgParams, version, chainId) {
    if (this.chainId !== chainId) {
      await this._initPKPWallet(chainId);
    }

    let messageHash;
    let signature;

    if (version === SignTypedDataVersion.V1) {
      // https://github.com/MetaMask/eth-sig-util/blob/9f01c9d7922b717ddda3aa894c38fbba623e8bdf/src/sign-typed-data.ts#L435
      messageHash = typedSignatureHash(msgParams);
      signature = await this.wallet.runLitAction(messageHash, 'sig1');
    } else {
      const { types, domain, primaryType, message } = JSON.parse(msgParams);
      delete types.EIP712Domain;
      signature = await this.wallet._signTypedData(domain, types, message);
    }

    return signature;
  }

  /**
   * Sign transaction with PKPWallet
   *
   * @param {Object} txParams transaction to sign
   * @param {number} chainId chain id of network to use
   *
   * @returns {Promise<Object>} signed transaction
   */
  async signTransaction(txParams, chainId) {
    if (this.chainId !== chainId) {
      await this._initPKPWallet(chainId);
    }
    const signedTx = await this.wallet.signTransaction(txParams);
    console.log('signedTx:', signedTx);
    return signedTx;
  }

  /**
   * Send transaction with PKPWallet
   *
   * @param {Object} txParams transaction to send
   * @param {number} chainId chain id of network to use
   *
   * @returns {Promise<Object>} sent transaction
   */
  async sendTransaction(txParams, chainId) {
    if (this.chainId !== chainId) {
      await this._initPKPWallet(chainId);
    }
    const signedTx = await this.wallet.signTransaction(txParams);
    console.log('signedTx:', signedTx);
    const sentTx = await this.wallet.sendTransaction(signedTx);
    console.log('sentTx:', sentTx);
    return sentTx;
  }
}

export default PKPWalletAccount;
