import converter from 'hex2dec';
import { ethers } from 'ethers';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';

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

export const getTransactionToSign = (txParams, chainId) => {
  let formattedTx = Object.assign({}, txParams);

  if (formattedTx.gas) {
    // formattedTx.gasLimit = formattedTx.gas;
    delete formattedTx.gas;
  }

  if (formattedTx.from) {
    delete formattedTx.from;
  }

  formattedTx.chainId = chainId;

  return formattedTx;
};

export const getTransactionToSend = (txParams, chainId) => {
  let formattedTx = getTransactionToSign(txParams);

  // if (formattedTx.gasPrice) {
  //   delete formattedTx.gasPrice;
  // }

  // formattedTx.value = txParams.value
  //   ? txParams.value
  //   : ethers.BigNumber.from('10');

  // formattedTx.nonce = txParams.nonce;

  // formattedTx.maxFeePerGas = txParams.maxFeePerGas
  //   ? txParams.maxFeePerGas
  //   : ethers.BigNumber.from('3395000013');
  // if (formattedTx.maxFeePerGas) {
  //   delete formattedTx.maxFeePerGas;
  // }

  // formattedTx.maxPriorityFeePerGas = txParams.maxPriorityFeePerGas
  //   ? txParams.maxPriorityFeePerGas
  //   : ethers.BigNumber.from('3394999999');
  // if (formattedTx.maxPriorityFeePerGas) {
  //   delete formattedTx.maxPriorityFeePerGas;
  // }

  formattedTx.chainId = chainId;

  // formattedTx.type = 2;

  return formattedTx;
};

export function getSignVersionEnum(str) {
  switch (str) {
    case 'v1':
      return SignTypedDataVersion.V1;
    case 'v3':
      return SignTypedDataVersion.V3;
    case 'v4':
      return SignTypedDataVersion.V4;
    default:
      break;
  }
}

export function getSignVersionByMessageFormat(data) {
  // V1 format: name, type, value
  // https://github.com/ethereum/EIPs/pull/712/commits/21abe254fe0452d8583d5b132b1d7be87c0439ca#diff-4a2296091e160bda9c4e9b47f34ea91420677e90d0454ededc48e31314d8642bR62
  if (
    data.length > 0 &&
    data[0]['name'] &&
    data[0]['type'] &&
    data[0]['value']
  ) {
    return SignTypedDataVersion.V1;
  } else {
    // Use encodeData to check if message provided is suitable for V3 or V4
    // https://github.com/MetaMask/eth-sig-util/blob/9f01c9d7922b717ddda3aa894c38fbba623e8bdf/src/sign-typed-data.ts#L193
    try {
      const { types, domain, primaryType, message } = JSON.parse(data);
      delete types.EIP712Domain;
      const encodedData = TypedDataUtils.encodeData(
        primaryType,
        message,
        types,
        SignTypedDataVersion.V4
      );
      return SignTypedDataVersion.V4;
    } catch (e) {
      return SignTypedDataVersion.V3;
    }
  }
}

export const isPayloadSupported = payload => {
  const supportedMethods = [
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
    'eth_signTransaction',
    'eth_sendTransaction',
  ];
  return supportedMethods.includes(payload.method);
};

export const getChain = (chainId, chains) => {
  const chain = Object.values(chains).find(chain => chain.chainId === chainId);
  return chain;
};

export const getRPCUrl = (chainId, chains) => {
  const chain = getChain(chainId, chains);
  const rpcUrl = chain?.rpcUrls[0] ? chain.rpcUrls[0] : null;
  return rpcUrl;
};
