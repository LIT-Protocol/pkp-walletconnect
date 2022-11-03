import { WagmiConfig, createClient, chain, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import '../styles/global.scss';

// Configure chains & providers for wagmi
const { chains, provider, webSocketProvider } = configureChains(
  [chain.polygonMumbai],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY }),
    publicProvider(),
  ]
);

// Set up wagmi client
const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'wagmi',
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
  ],
  provider,
  webSocketProvider,
});

export default function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig client={client}>
      <Component {...pageProps} />
    </WagmiConfig>
  );
}
