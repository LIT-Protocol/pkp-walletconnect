export const WC_STORAGE_KEY = 'pkp_wc_session';
export const WC_REQUESTS_STORAGE_KEY = 'pkp_wc_requests';
export const WC_RESULTS_STORAGE_KEY = 'pkp_wc_results';

export const DEFAULT_CHAIN_ID = 80001;
export const SUPPORTED_CHAINS = {
  137: {
    name: 'Polygon Mainnet',
    chain: 'Polygon',
    network: 'mainnet',
    chain_id: 137,
    network_id: 137,
    rpc_url: 'https://polygon-rpc.com/',
    block_explorer: 'https://polygonscan.com/',
  },
  80001: {
    name: 'Polygon Mumbai',
    chain: 'Polygon',
    network: 'mumbai',
    chain_id: 80001,
    network_id: 80001,
    rpc_url: 'https://matic-mumbai.chainstacklabs.com',
    block_explorer: 'https://mumbai.polygonscan.com/',
  },
  1: {
    name: 'Ethereum Mainnet',
    chain: 'ETH',
    network: 'mainnet',
    chain_id: 1,
    network_id: 1,
    rpc_url: 'https://cloudflare-eth.com/',
    block_explorer: 'https://etherscan.io/',
  },
  5: {
    name: 'Ethereum Görli',
    chain: 'ETH',
    network: 'goerli',
    chain_id: 5,
    network_id: 5,
    rpc_url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    block_explorer: 'https://goerli.etherscan.io/',
  },
};
