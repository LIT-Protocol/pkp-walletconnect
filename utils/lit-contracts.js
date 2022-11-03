import { ethers } from 'ethers';
import { hexToDecimal } from './helpers';
import PKPNFTABI from './abis/PKPNFT.json';
import PubkeyRouterABI from './abis/PubkeyRouter.json';

let pkpContract = null;
let routerContract = null;

// Connect to smart contract
const getContract = (signer, contractAddress, contractABI) => {
  try {
    // const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    return contract;
  } catch (error) {
    console.error('Unable to connect to contract due to: ', error);
  }
};

// Connect to PKPNFT contract
const connectPKPContract = signer => {
  const contractAddress = process.env.NEXT_PUBLIC_PKPNFT_CONTRACT_ADDRESS;
  const pkpContract = getContract(signer, contractAddress, PKPNFTABI);
  return pkpContract;
};

// Connect to PubkeyRouter contract
const connectRouterContract = signer => {
  const contractAddress =
    process.env.NEXT_PUBLIC_PUBKEY_ROUTER_CONTRACT_ADDRESS;
  const routerContract = getContract(signer, contractAddress, PubkeyRouterABI);
  return routerContract;
};

// Check if Lit contracts are initialized
export const litContractsConnected =
  pkpContract !== null && routerContract !== null;

// Initialize Lit contracts
export const connectLitContracts = signer => {
  pkpContract = connectPKPContract(signer);
  routerContract = connectRouterContract(signer);
};

// Remove Lit contracts
export const disconnectLitContracts = () => {
  pkpContract = null;
  routerContract = null;
};

// Get public key of the given PKP NFT token ID
export const getPubkey = async tokenId => {
  if (!routerContract) {
    throw new Error('Unable to connect to PubkeyRouter contract');
  }
  const pubkey = await routerContract.getPubkey(tokenId);

  return pubkey;
};

// Get a list of all PKP NFT token IDs owned by the given address
export const getPKPNFTTokenIdsByAddress = async address => {
  if (!pkpContract) {
    throw new Error('Unable to connect to PKPNFT contract');
  }

  if (!ethers.utils.isAddress(address)) {
    throw new Error(`Given string is not a valid address "${address}"`);
  }

  let tokens = [];

  for (let i = 0; ; i++) {
    let token;

    try {
      token = await pkpContract.tokenOfOwnerByIndex(address, i);
      token = hexToDecimal(token.toHexString());
      tokens.push(token);
    } catch (e) {
      console.log(`[getPKPNFTTokenIdsByAddress] Ended search on index: ${i}`);
      break;
    }
  }

  return tokens;
};
