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
