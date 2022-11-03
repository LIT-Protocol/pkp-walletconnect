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
  const [currentPKP, setCurrentPKP] = useState(undefined);
  const [myPKPs, setMyPKPs] = useState([]);

  const { address } = useAccount();
  const { data: signer } = useSigner();

  useEffect(() => {
    async function fetchMyPKPs() {
      const pkps = await fetchPKPsByAddress(address);

      if (pkps.length > 0) {
        setCurrentPKP(pkps[0]);
        setMyPKPs(pkps);
      } else {
        setCurrentPKP(null);
        setMyPKPs([]);
      }
    }

    // Check if wallet is connected
    if (address && signer) {
      // Check if contracts are connected
      if (!litContractsConnected) {
        connectLitContracts(signer);
      }

      // Fetch current user's PKPs if not previously fetched
      if (currentPKP === undefined) {
        fetchMyPKPs();
      }
    }
  }, [currentPKP, address, signer]);

  return {
    currentPKP,
    myPKPs,
  };
};

export default useCloudWallet;
