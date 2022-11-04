import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { ethers } from 'ethers';
import {
  connectLitContracts,
  litContractsConnected,
  getPKPNFTTokenIdsByAddress,
  getPubkey,
} from '../utils/lit-contracts';

const fetchPKPsByAddress = async address => {
  const tokenIds = await getPKPNFTTokenIdsByAddress(address);
  let pkps = [];

  if (tokenIds.length > 0) {
    for (let i = 0; i < tokenIds.length; i++) {
      const pubkey = await getPubkey(tokenIds[i]);
      console.log(`pubkey index ${i}`, pubkey);
      const ethAddress = ethers.utils.computeAddress(pubkey);
      pkps.push({
        tokenId: tokenIds[i],
        pubkey: pubkey,
        ethAddress: ethAddress,
      });
    }
  }

  return pkps;
};

const useCloudWallet = () => {
  const [loading, setLoading] = useState(true);
  const [currentOwner, setCurrentOwner] = useState(null);
  const [currentPKP, setCurrentPKP] = useState(null);
  const [myPKPs, setMyPKPs] = useState([]);

  const { address } = useAccount();
  const { data: signer } = useSigner();

  // Disconnect from WalletConnect
  const cwDisconnect = useCallback(async () => {
    console.log('Clear cloud wallet');

    try {
      setCurrentOwner(null);
      setCurrentPKP(null);
      setMyPKPs([]);
      setLoading(false);
    } catch (error) {
      console.error('Error trying to clear cloud wallet session: ', error);
    }
  }, []);

  useEffect(() => {
    async function fetchMyPKPs() {
      setLoading(true);

      const pkps = await fetchPKPsByAddress(address);

      if (pkps.length > 0) {
        setCurrentPKP(pkps[0]);
        setMyPKPs(pkps);
      } else {
        setCurrentPKP(null);
        setMyPKPs([]);
      }

      setCurrentOwner(address);
      setLoading(false);
    }

    // Check if wallet is connected
    if (address && signer) {
      // Check if contracts are connected
      if (!litContractsConnected) {
        connectLitContracts(signer);
      }

      // Fetch current user's PKPs if not previously fetched or if addresses changed
      if (!currentPKP || currentOwner !== address) {
        fetchMyPKPs();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [currentOwner, currentPKP, address, signer]);

  return {
    loading,
    currentPKP,
    myPKPs,
    cwDisconnect,
  };
};

export default useCloudWallet;
