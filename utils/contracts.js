import { ethers } from 'ethers';
import PKPPermissions from './abis/PKPPermissions.json';
import ContractAddresses from './abis/deployed-contracts.json';

function getContract(contractAddress, contractABI) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      'https://polygon-mumbai.g.alchemy.com/v2/onvoLvV97DDoLkAmdi0Cj7sxvfglKqDh'
    );
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );
    return contract;
  } catch (error) {
    console.error('Unable to connect to contract due to: ', error);
  }
}

function getPkpPermissionsContract() {
  const contractAddress = ContractAddresses.pkpPermissionsContractAddress;
  const pkpContract = getContract(contractAddress, PKPPermissions.abi);
  return pkpContract;
}

export async function getUserPubkeyForAuthMethod(authMethodType, id) {
  const contract = getPkpPermissionsContract();
  if (!contract) {
    throw new Error('Unable to connect to contract');
  }
  const userPubkey = await contract.getUserPubkeyForAuthMethod(
    authMethodType,
    id
  );
  return userPubkey;
}

export async function getTokenIdsForAuthMethod(authMethodType, id) {
  const contract = getPkpPermissionsContract();
  if (!contract) {
    throw new Error('Unable to connect to contract');
  }
  const tokenIds = await contract.getTokenIdsForAuthMethod(authMethodType, id);
  return tokenIds;
}

export async function getEthAddress(tokenId) {
  const contract = getPkpPermissionsContract();
  if (!contract) {
    throw new Error('Unable to connect to contract');
  }
  const ethAddress = await contract.getEthAddress(tokenId);
  return ethAddress;
}

export async function getPubkey(tokenId) {
  const contract = getPkpPermissionsContract();
  if (!contract) {
    throw new Error('Unable to connect to contract');
  }
  const pubkey = await contract.getPubkey(tokenId);
  return pubkey;
}
