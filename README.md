# Lit PKP x WalletConnect

Interact with dapps using your PKPs through WalletConnect! Check out the [live demo](https://pkp-walletconnect.vercel.app/).

## Dev setup

To run this app locally, you'll need an existing dev environment that includes `node` and `npm`. To set up your local environment, check out this [guide](https://cloud.google.com/nodejs/docs/setup). Using the latest LTS version of `Node.js` is recommended.

Once you have your environment set up, clone this repo and install the dependencies:

```bash
git clone https://github.com/LIT-Protocol/pkp-walletconnect
cd pkp-walletconnect
yarn install
```

Create `.env.local` in the root directory, and add your [Alchemy API key](https://docs.alchemy.com/docs/alchemy-quickstart-guide#1key-create-an-alchemy-key) to the file:

```bash
NEXT_PUBLIC_ALCHEMY_API_KEY=<your Alchemy API Key>
```

Start your development server:

```bash
yarn dev
```

## Testing

To play with the Lit PKP x WalletConnect demo, you can connect your PKP to these testnet dapps:

- [WalletConnect V1 example dapp](https://example.walletconnect.org/)
- [Opensea testnet dapp](https://testnets.opensea.io/)
- [Zora testnet dapp](https://testnet.create.zora.co/)
- [Aave testnet dapp](https://staging.aave.com/)

To add test tokens to your PKP, check out these faucets:

- [Polygon Matic faucet](https://faucet.polygon.technology/)
- [Ethereum Goerli faucet](https://goerlifaucet.com/)

PKPs are still in development on the Serrano Testnet, so do **not** storing anything of value on your PKPs at this time.
