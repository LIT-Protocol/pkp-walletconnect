import { AppContextProvider } from '../context/AppContextProvider';
import '../styles.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <AppContextProvider>
      <Component {...pageProps} />
    </AppContextProvider>
  );
}
