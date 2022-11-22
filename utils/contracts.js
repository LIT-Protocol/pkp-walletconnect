import { ethers } from 'ethers';
import { hexToDecimal, wei2eth } from './helpers';
import PKPNFT from './abis/PKPNFT.json';
import PubkeyRouter from './abis/PubkeyRouter.json';
import { ECDSA_KEY } from './constants';
import ContractAddresses from './abis/deployed-contracts.json';

let pkpContract = null;
let routerContract = null;

// Connect to smart contract
const getContract = (signer, contractAddress, contractABI) => {
  try {
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    return contract;
  } catch (error) {
    console.error('Unable to connect to contract due to: ', error);
  }
};

// Connect to PKPNFT contract
const connectPKPContract = signer => {
  const contractAddress = ContractAddresses.pkpNftContractAddress;
  const pkpContract = getContract(signer, contractAddress, PKPNFT.abi);
  return pkpContract;
};

// Connect to PubkeyRouter contract
const connectRouterContract = signer => {
  const contractAddress = ContractAddresses.pubkeyRouterContractAddress;
  const routerContract = getContract(signer, contractAddress, PubkeyRouter.abi);
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

export const getMintCost = async () => {
  if (!pkpContract) {
    throw new Error('Unable to connect to PKPNFT contract');
  }
  const mintCost = await pkpContract.mintCost();

  return wei2eth(mintCost);
};

export const mintPKP = async mintCost => {
  if (!pkpContract) {
    throw new Error('Unable to connect to PKPNFT contract');
  }
  const tx = await pkpContract.mintNext(ECDSA_KEY, mintCost);
  const res = await tx.wait();
  const tokenIdFromEvent = res.events[0].topics[3];

  return { tx, tokenId: tokenIdFromEvent };
};
