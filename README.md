# Lit PKP x WalletConnect

Connect your Lit PKP to dApps via WalletConnect! Check out the [live demo](https://pkp-walletconnect.vercel.app/).

## Overview

Learn about the core pieces you need to integrate [Lit PKPs](https://developer.litprotocol.com/coreConcepts/LitActionsAndPKPs/PKPs) and [WalletConnect V1](https://docs.walletconnect.com/1.0/client-api) in your app in this [guide](https://github.com/LIT-Protocol/pkp-walletconnect/blob/main/GUIDE.md). Be sure to check out the code in this repo to see those pieces in action.

## Dev setup

To run this app locally, you'll need an existing dev environment that includes `node` and `npm`. To set up your local environment, check out this [guide](https://cloud.google.com/nodejs/docs/setup). Using the latest LTS version of `Node.js` is recommended.

Once you have your environment set up, clone this repo:

```bash
git clone https://github.com/LIT-Protocol/pkp-walletconnect
```

Navigate to the project directory and install dependencies:

```bash
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

When playing with the Lit PKP x WalletConnect demo, connect your PKP to these testnet dApps:

- [WalletConnect V1 example dapp](https://example.walletconnect.org/)
- [Opensea testnet dapp](https://testnets.opensea.io/)
- [Zora testnet dapp](https://testnet.create.zora.co/)
- [Aave testnet dapp](https://staging.aave.com/)

To add test tokens to your PKP, check out these faucets:

- [Polygon Matic faucet](https://faucet.polygon.technology/)
- [Ethereum Goerli faucet](https://goerlifaucet.com/)

PKPs are still in development on the Serrano Testnet, so do **not** store anything of value on your PKPs at this time.

## Resources

- [About Lit PKPs](https://developer.litprotocol.com/coreconcepts/litactionsandpkps/pkps/)
- [Lit Actions & PKPs SDK](https://developer.litprotocol.com/SDK/Explanation/litActions)
- [WalletConnect V1 SDK](https://docs.walletconnect.com/1.0/client-api)
- [WalletConnect V1 wallet example](https://github.com/WalletConnect/walletconnect-test-wallet)
- [Ethereum JSON RPC spec](https://ethereum.github.io/execution-apis/api-documentation/)
