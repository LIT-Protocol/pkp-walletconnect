import { AppProvider } from '../context/AppContext';
import '../styles/global.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <AppProvider>
      <main className="max-w-lg w-full grow border border-base-800 px-6 pt-8 pb-6 sm:px-10 sm:pt-12 sm:pb-8 flex flex-col justify-between">
        <Component {...pageProps} />
      </main>
    </AppProvider>
  );
}
