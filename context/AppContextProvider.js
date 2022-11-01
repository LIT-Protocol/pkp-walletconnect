import { createContext, useState } from 'react';
import { ethers } from 'ethers';

const AppContext = createContext({});

const PUBKEY =
  '0x046cf164e0907d8a3190c7bacd6597ad427822a2436fc186e234a6b71df2e4ddf7f70bbbc50b0c855ec2214b2193b9eb24ecbd969fc9fa5c1bf9ba80602e6162a6';
const ETH_ADDRESS = ethers.utils.computeAddress(PUBKEY);

export const AppContextProvider = ({ children }) => {
  const [currentPKP, setCurrentPKP] = useState({
    pubkey: PUBKEY,
    ethAddress: ETH_ADDRESS,
  });
  const [myPKPs, setMyPKPs] = useState([currentPKP]);

  return (
    <AppContext.Provider
      value={{
        currentPKP,
        myPKPs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
