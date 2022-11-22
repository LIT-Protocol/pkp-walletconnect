import converter from 'hex2dec';
import { ethers } from 'ethers';
import { convertHexToNumber } from '@walletconnect/utils';
import { getPKPNFTTokenIdsByAddress, getPubkey } from './contracts';

export const a11yProps = index => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

export const truncate = str => {
  return `${str.substring(0, 5)}...${str.substring(str.length - 5)}`;
};

export const wei2eth = value => {
  let cost = {
    wei: value,
    // eth: ethers.utils.formatEther(value),
    eth: ethers.utils.formatUnits(value),
    arg: ethers.BigNumber.from(value),
  };

  return cost;
};

export const hexToDecimal = value => {
  return converter.hexToDec(value);
};

export function convertHexToUtf8(value) {
  if (ethers.utils.isHexString(value)) {
    return ethers.utils.toUtf8String(value);
  }

  return value;
}

export const getTransactionToSign = txParams => {
  let formattedTx = Object.assign({}, txParams);

  if (formattedTx.gas) {
    // formattedTx.gasLimit = formattedTx.gas;
    delete formattedTx.gas;
  }

  if (formattedTx.from) {
    delete formattedTx.from;
  }

  return formattedTx;
};

export const getChain = (chainId, chains) => {
  if (chainId) {
    const chain = Object.values(chains).find(
      chain => chain.chainId === chainId
    );
    return chain;
  }
  return null;
};

export const getRPCUrl = (chainId, chains) => {
  if (chainId) {
    const chain = getChain(chainId, chains);
    const rpcUrl = chain?.rpcUrls[0] ? chain.rpcUrls[0] : null;
    return rpcUrl;
  }
  return null;
};

export const renderRequest = (payload, peerMeta, chains) => {
  let title;
  let description;
  let message;
  let data;

  const appName = peerMeta?.name ? peerMeta.name : 'An unknown app';

  switch (payload.method) {
    case 'eth_sign':
      title = 'Sign message';
      description = `${appName} wants you to sign the following message:`;
      message = payload.params[1];
      break;
    case 'personal_sign':
      title = 'Sign message';
      description = `${appName} wants you to sign the following message:`;
      message = convertHexToUtf8(payload.params[0]);
      break;
    case 'eth_signTypedData':
    case 'eth_signTypedData_v1':
    case 'eth_signTypedData_v3':
    case 'eth_signTypedData_v4':
      title = 'Sign typed data';
      description = `${appName} wants you to sign the following typed data:`;
      data = JSON.stringify(JSON.parse(payload.params[1]), null, 2);
      break;
    case 'eth_signTransaction':
      title = 'Sign transaction';
      description = `${appName} 
      wants you to sign the following transaction:`;
      data = JSON.stringify(getTransactionToSign(payload.params[0]), null, 2);
      break;
    case 'eth_sendTransaction':
      title = 'Send transaction';
      description = `${appName} 
      wants you to sign and send the following transaction:`;
      data = JSON.stringify(getTransactionToSign(payload.params[0]), null, 2);
      break;
    case 'wallet_addEthereumChain':
      title = 'Add network';
      description = `${appName} 
      wants you to add the following network:`;
      data = JSON.stringify(payload.params[0], null, 2);
      break;
    case 'wallet_switchEthereumChain':
      title = 'Switch network';
      description = `${appName} 
      wants you to switch to the following network:`;
      const newChainId = convertHexToNumber(payload.params[0].chainId);
      const newChain = getChain(newChainId, chains);
      data = JSON.stringify(newChain, null, 2);
      break;
    default:
      title = 'Unsupported request';
      description = `Unable to handle this request: ${payload.method}.`;
      data = params;
  }

  return { title, description, message, data };
};

// Fetch PKPs by address
export const fetchPKPsByAddress = async address => {
  const tokenIds = await getPKPNFTTokenIdsByAddress(address);
  let pkps = {};

  if (tokenIds.length > 0) {
    for (let i = 0; i < tokenIds.length; i++) {
      const pubkey = await getPubkey(tokenIds[i]);
      const ethAddress = ethers.utils.computeAddress(pubkey);
      pkps[ethAddress] = {
        tokenId: tokenIds[i],
        publicKey: pubkey,
        address: ethAddress,
      };
    }
  }

  return pkps;
};
