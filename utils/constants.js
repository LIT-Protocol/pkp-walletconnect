import LitJsSdk from 'lit-js-sdk';

export const ECDSA_KEY = 2;

export const DEFAULT_CHAIN_ID = 80001;
export const DEFAULT_CHAINS = [
  LitJsSdk.LIT_CHAINS.ethereum,
  LitJsSdk.LIT_CHAINS.goerli,
  LitJsSdk.LIT_CHAINS.ropsten,
  LitJsSdk.LIT_CHAINS.polygon,
  LitJsSdk.LIT_CHAINS.mumbai,
];

export const CURRENT_PKP_STORAGE_KEY = 'current_pkp';
export const PKPS_STORAGE_KEY = 'my_pkps';
export const WC_RESULTS_STORAGE_KEY = 'pkp_wc_results';
export const AUTH_SIG_STORAGE_KEY = 'lit-auth-signature';
