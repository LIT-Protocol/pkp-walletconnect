import LitJsSdk from 'lit-js-sdk';

export const WC_SESSION_STORAGE_KEY = 'pkp_wc_session';
export const WC_RESULTS_STORAGE_KEY = 'pkp_wc_results';

// interface AddEthereumChainParameter {
//   chainId: string; // A 0x-prefixed hexadecimal string
//   chainName: string;
//   nativeCurrency: {
//     name: string;
//     symbol: string; // 2-6 characters long
//     decimals: 18;
//   };
//   rpcUrls: string[];
//   blockExplorerUrls?: string[];
//   iconUrls?: string[]; // Currently ignored.
// }

export const DEFAULT_CHAIN_ID = 80001;
export const DEFAULT_CHAINS = [
  LitJsSdk.LIT_CHAINS.ethereum,
  LitJsSdk.LIT_CHAINS.goerli,
  LitJsSdk.LIT_CHAINS.ropsten,
  LitJsSdk.LIT_CHAINS.polygon,
  LitJsSdk.LIT_CHAINS.mumbai,
];

export const PERSONAL_SIGN_CODE = `
  const go = async () => {
    const sigShare = await LitActions.ethPersonalSignMessageEcdsa({ message, publicKey, sigName });
  };
  
  go();
`;

export const SIGN_CODE = `
  const go = async () => {
    const sigShare = await LitActions.signEcdsa({ toSign, publicKey, sigName });
  };
  
  go();
`;

export const SIGN_TRANSACTION_FILE =
  'QmRwN9GKHvCn4Vk7biqtr6adjXMs7PzzYPCzNCRjPFiDjm';
