import {
  convertHexToUtf8,
  getSignVersionByMessageFormat,
  getTransactionToSign,
  getTransactionToSend,
} from './helpers';

class PKPWalletConnector {
  /**
   * Creates WalletConnect client
   *
   * @param {Object} options WalletConnect client options, which should include uri or session
   * @param {string} [options.uri] WalletConnect URI
   * @param {Object} [options.session] WalletConnect session
   * @param {Object} [options.clientMeta] WalletConnect client metadata
   */
  constructor(options) {
    this._connector = new WalletConnect(options);
  }

  // -- Getters

  /**
   * Return WalletConnect client
   *
   * @returns {WalletConnect} WalletConnect client
   */
  get connector() {
    return this._connector;
  }

  /**
   * Return WalletConnect session details
   *
   * @returns {Object} WalletConnect session
   */
  get session() {
    return this.connector.session;
  }

  // -- Public methods

  /**
   * Create session if WalletConnect is not connected
   */
  async connect() {
    if (!this.connector.connected) {
      await this.connector.createSession();
    }
  }

  /**
   * Disconnect WalletConnect session
   */
  async disconnect() {
    await this.connector.killSession();
  }

  /**
   * Approve WalletConnect session request
   *
   * @param {PKPWalletAccount} pkpAccount PKP to use in approval
   * @param {number} chainId chain ID to use in approval
   */
  async approveSession(pkpAccount, chainId) {
    console.log('Approve WalletConnect session');

    await this.connector.approveSession({
      accounts: [pkpAccount.address],
      chainId: chainId,
    });
  }

  /**
   * Reject WalletConnect session request
   */
  async rejectSession() {
    console.log('Reject WalletConnect session');
    await this.connector.rejectSession();
  }

  /**
   * Update account address and chain ID for WalletConnect client
   *
   * @param {PKPWalletAccount} pkpAccount PKP to use in approval
   * @param {number} chainId chain ID to use in update
   */
  async updateSession(pkpAccount, chainId) {
    await this.connector.updateSession({
      accounts: [pkpAccount.address],
      chainId: chainId,
    });
  }

  /**
   * Handle signing and sending methods that require PKP
   *
   * @param {Object} payload call request to approve
   * @param {PKPWalletAccount} pkpAccount PKP to sign with
   * @param {number} chainId chain ID to use for handling requests
   * @returns {(string | Object)} signed message, signed data, signed transaction, or sent transaction
   */
  async handleSignSendRequest(payload, pkpAccount, chainId) {
    let message;
    let msgParams;
    let version;
    let txParams;
    let result;

    switch (payload.method) {
      case 'eth_sign':
        message = payload.params[1];
        result = await pkpAccount.wallet.signMessage(message, chainId);
        break;
      case 'personal_sign':
        message = convertHexToUtf8(payload.params[0]);
        result = await pkpAccount.wallet.signMessage(message, chainId);
        break;
      case 'eth_signTypedData':
        msgParams = payload.params[1];
        version = getSignVersionByMessageFormat(msgParams);
        result = await pkpAccount.wallet.signTypedData(
          msgParams,
          version,
          chainId
        );
        break;
      case 'eth_signTypedData_v1':
        msgParams = payload.params[1];
        version = getSignVersionEnum('v1');
        result = await pkpAccount.wallet.signTypedData(
          msgParams,
          version,
          chainId
        );
        break;
      case 'eth_signTypedData_v3':
        msgParams = payload.params[1];
        version = getSignVersionEnum('v3');
        result = await pkpAccount.wallet.signTypedData(
          msgParams,
          version,
          chainId
        );
        break;
      case 'eth_signTypedData_v4':
        msgParams = payload.params[1];
        version = getSignVersionEnum('v4');
        result = await pkpAccount.wallet.signTypedData(
          msgParams,
          version,
          chainId
        );
        break;
      case 'eth_signTransaction':
        txParams = getTransactionToSign(payload.params[0]);
        result = await pkpAccount.wallet.signTransaction(txParams, chainId);
        break;
      case 'eth_sendTransaction':
        txParams = getTransactionToSend(payload.params[0]);
        result = await pkpAccount.wallet.sendTransaction(txParams, chainId);
        break;
      default:
        throw new Error(`Method ${payload.method} is not supported`);
    }

    return result;
  }

  /**
   * Approve WalletConnect call request
   *
   * @param {Object} payload call request to approve
   * @param {Object} result result of handling call request
   */
  async approveRequest(payload, result) {
    console.log('Approve request via WalletConnect', payload);
    await this.connector.approveRequest({
      id: payload.id,
      result: result,
    });
  }

  /**
   * Reject WalletConnect call request
   *
   * @param {Object} payload call request to reject
   */
  async rejectRequest(payload) {
    console.log('Reject request via WalletConnect');
    await this.connector.rejectRequest({
      id: payload.id,
      error: { message: 'User rejected WalletConnect request' },
    });
  }
}

export default PKPWalletConnector;
