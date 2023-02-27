import converter from 'hex2dec';
import { ethers } from 'ethers';
import { convertHexToNumber } from '@walletconnect/utils';
import { getTokenIdsForAuthMethod, getPubkey } from './contracts';
import { AuthMethodTypes } from './constants';

export function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function truncateAddress(str) {
  return `${str.substring(0, 5)}...${str.substring(str.length - 5)}`;
}

export function replaceWithBreaks(str) {
  try {
    const newStr = str.replace(/\n/g, '<br />');
    return newStr;
  } catch (e) {
    return str;
  }
}

export function wei2eth(value) {
  let cost = {
    wei: value,
    // eth: ethers.utils.formatEther(value),
    eth: ethers.utils.formatUnits(value),
    arg: ethers.BigNumber.from(value),
  };

  return cost;
}

export function hexToDecimal(value) {
  return converter.hexToDec(value);
}

export function convertHexToUtf8(value) {
  try {
    if (ethers.utils.isHexString(value)) {
      return ethers.utils.toUtf8String(value);
    }
    return value;
  } catch (e) {
    return value;
  }
}

export function getTransactionToSign(txParams) {
  let formattedTx = Object.assign({}, txParams);

  if (formattedTx.gas) {
    // formattedTx.gasLimit = formattedTx.gas;
    delete formattedTx.gas;
  }

  if (formattedTx.from) {
    delete formattedTx.from;
  }

  return formattedTx;
}

export function getChain(chainId, chains) {
  if (chainId) {
    const chain = chains.find(chain => chain.chainId === chainId);
    return chain;
  }
  return null;
}

export function getRPCUrl(chainId, chains) {
  if (chainId) {
    const chain = getChain(chainId, chains);
    const rpcUrl = chain?.rpcUrls[0] ? chain.rpcUrls[0] : null;
    return rpcUrl;
  }
  return null;
}

export function renderTxDetails(payload) {
  let txDetails = [
    { label: 'From', value: payload.params[0].from },
    { label: 'To', value: payload.params[0].to },
    {
      label: 'Gas Limit',
      value: payload.params[0].gas
        ? convertHexToNumber(payload.params[0].gas)
        : payload.params[0].gasLimit
        ? convertHexToNumber(payload.params[0].gasLimit)
        : '',
    },
    {
      label: 'Gas Price',
      value: convertHexToNumber(payload.params[0].gasPrice),
    },
    {
      label: 'Nonce',
      value: convertHexToNumber(payload.params[0].nonce),
    },
    {
      label: 'Value',
      value: payload.params[0].value
        ? convertHexToNumber(payload.params[0].value)
        : '',
    },
    { label: 'Data', value: payload.params[0].data },
  ];
  return txDetails;
}

export function getWebAuthnAuthMethodId(username) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`${username}:lit`));
}

export function getDefaultAuthNeededCallback(authMethods, pkpPublicKey) {
  const defaultCallback = async ({
    chain,
    resources,
    expiration,
    uri,
    litNodeClient,
  }) => {
    const sessionSig = await litNodeClient.signSessionKey({
      sessionKey: uri,
      authMethods: authMethods,
      pkpPublicKey: pkpPublicKey,
      expiration,
      resources,
      chain,
    });
    return sessionSig;
  };

  return defaultCallback;
}

export async function getPKPPublicKeyByWebAuthnId(id) {
  const tokenIds = await getTokenIdsForAuthMethod(AuthMethodTypes.WEBAUTHN, id);
  if (tokenIds.length === 0) {
    return null;
  }
  // Username:credentialPubKey is 1:1 for now
  const pkpPublicKey = await getPubkey(tokenIds[0]);
  return pkpPublicKey;
}

export async function getPKPsForAuthMethod({
  authMethodType,
  idForAuthMethod,
}) {
  if (!authMethodType || !idForAuthMethod) {
    throw new Error(
      'Auth method type and id are required to fetch PKPs by auth method'
    );
  }

  try {
    const tokenIds = await getTokenIdsForAuthMethod(
      authMethodType,
      idForAuthMethod
    );
    const pkps = [];
    for (let i = 0; i < tokenIds.length; i++) {
      const pubkey = await getPubkey(tokenIds[i]);
      if (pubkey) {
        const ethAddress = ethers.utils.computeAddress(pubkey);
        pkps.push({
          tokenId: tokenIds[i],
          publicKey: pubkey,
          ethAddress: ethAddress,
        });
      }
    }
    return pkps;
  } catch (err) {
    throw new Error('Unable to get PKPs for auth method');
  }
}
