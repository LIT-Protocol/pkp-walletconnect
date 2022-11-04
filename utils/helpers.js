import { ethers } from 'ethers';
import converter from 'hex2dec';

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

export const getMessageToSign = data => {
  return ethers.utils.arrayify(data);
};

export const getPersonalMessageToSign = data => {
  return ethers.utils.isHexString(data) ? ethers.utils.arrayify(data) : data;
};

export const getTypedDataToSign = data => {
  if (typeof data === 'string') {
    return JSON.parse(data);
  }

  return data;
};

export const getTransactionToSign = txParams => {
  let formattedTx = Object.assign({}, txParams);

  if (formattedTx.gas) {
    formattedTx.gasLimit = formattedTx.gas;
    delete formattedTx.gas;
  }

  if (formattedTx.from) {
    delete formattedTx.from;
  }

  return formattedTx;
};

export const getTransactionToSend = (txParams, chainId) => {
  let formattedTx = getTransactionToSign(txParams);

  if (formattedTx.gasPrice) {
    delete formattedTx.gasPrice;
  }

  formattedTx.value = txParams.value
    ? txParams.value
    : ethers.BigNumber.from('10');

  formattedTx.nonce = txParams.nonce;

  formattedTx.maxFeePerGas = txParams.maxFeePerGas
    ? txParams.maxFeePerGas
    : ethers.BigNumber.from('3395000013');

  formattedTx.maxPriorityFeePerGas = txParams.maxPriorityFeePerGas
    ? txParams.maxPriorityFeePerGas
    : ethers.BigNumber.from('3394999999');

  formattedTx.chainId = chainId;

  formattedTx.type = 2;

  return formattedTx;
};

export const getPayloadName = payload => {
  let name = 'Unknown';

  switch (payload.method) {
    case 'eth_sign':
    case 'personal_sign':
      name = 'Sign message';
      break;
    case 'eth_signTypedData':
      name = 'Sign typed data';
      break;
    case 'eth_signTransaction':
      name = 'Sign transaction';
      break;
    case 'eth_sendTransaction':
      name = 'Send transaction';
      break;
    default:
      break;
  }

  return name;
};
