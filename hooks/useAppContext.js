import { useContext } from 'react';
import AppContext from '../context/AppContextProvider';

const useAppContext = () => {
  return useContext(AppContext);
};

export default useAppContext;
