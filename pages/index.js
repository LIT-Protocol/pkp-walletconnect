import { useEffect, useState } from "react";
import Head from "next/head";
import LitJsSdk from "@lit-protocol/sdk-browser";
import WalletConnect from "@walletconnect/client";
import { ethers } from "ethers";
import { QrReader } from "react-qr-reader";
const BigNumber = ethers.BigNumber;

const publicKey =
  "0x04478d4d175f0f3e310f431224e169329be740db68f8bc224d2b57c3c6fc0e69671b233f570cd452b03431e40e5deac2780b7b68c00536bd7948c2c5de982542a3";
const ethAddress = ethers.utils.computeAddress(publicKey);
const networkId = 80001;
const rpcUrl = "https://matic-mumbai.chainstacklabs.com";

globalThis.ethAddress = ethAddress;
globalThis.LitJsSdk = LitJsSdk;
globalThis.ethers = ethers;

export default function Home() {
  const [litNodeClient, setLitNodeClient] = useState(null);
  const [walletConnector, setWalletConnector] = useState(null);
  const [data, setData] = useState(null);

  useEffect(async () => {
    const client = new LitJsSdk.LitNodeClient({
      litNetwork: "localhost",
      debug: false,
    });
    await client.connect();
    setLitNodeClient(client);

    // walletconnect id 7310597d2e34d8d9b01deb49e7ac0b7c
  }, []);

  const connect = async () => {
    // Create connector
    const connector = new WalletConnect({
      // Required
      uri: data,
      // Required
      clientMeta: {
        description: "Lit PKP Wallet",
        url: "https://litprotocol.com",
        name: "Lit PKP Wallet",
      },
    });
    console.log("created connector", connector);

    // Subscribe to session requests
    connector.on("session_request", (error, payload) => {
      if (error) {
        throw error;
      }
      console.log("session_request", payload);

      // Handle Session Request

      /* payload:
  {
    id: 1,
    jsonrpc: '2.0'.
    method: 'session_request',
    params: [{
      peerId: '15d8b6a3-15bd-493e-9358-111e3a4e6ee4',
      peerMeta: {
        name: "WalletConnect Example",
        description: "Try out WalletConnect v1.0",
        icons: ["https://example.walletconnect.org/favicon.ico"],
        url: "https://example.walletconnect.org"
      }
    }]
  }
  */

      // Approve Session
      connector.approveSession({
        accounts: [
          // required
          ethAddress,
        ],
        chainId: networkId, // required
      });
    });

    // Subscribe to call requests
    connector.on("call_request", async (error, payload) => {
      if (error) {
        throw error;
      }
      console.log("call request", payload);

      // Handle Call Request

      /* payload:
  {
    id: 1,
    jsonrpc: '2.0'.
    method: 'eth_sign',
    params: [
      "0xbc28ea04101f03ea7a94c1379bc3ab32e65e62d3",
      "My email is john@doe.com - 1537836206101"
    ]
  }
  */

      const txFromParams = payload.params[0];

      // need to massage a few things
      const txParams = {
        to: txFromParams.to,
        value: BigNumber.from("10"),
        nonce: txFromParams.nonce,
        maxFeePerGas: BigNumber.from("3395000013"),
        maxPriorityFeePerGas: BigNumber.from("3394999999"),
        gasLimit: BigNumber.from("21000"),
        data: txFromParams.data,
        type: 2,
        chainId: networkId,
      };
      console.log("txParams", txParams);

      const serializedTx = ethers.utils.serializeTransaction(txParams);
      console.log("serializedTx", serializedTx);

      const rlpEncodedTxn = ethers.utils.arrayify(serializedTx);
      console.log("rlpEncodedTxn: ", rlpEncodedTxn);

      const unsignedTxn = ethers.utils.keccak256(rlpEncodedTxn);
      console.log("unsignedTxn: ", unsignedTxn);

      // you need an AuthSig to auth with the nodes
      // this will get it from metamask or any browser wallet
      const authSig = await LitJsSdk.checkAndSignAuthMessage({
        chain: "mumbai",
      });

      const resp = await litNodeClient.executeJs({
        ipfsId: "QmRwN9GKHvCn4Vk7biqtr6adjXMs7PzzYPCzNCRjPFiDjm",
        authSig,
        // all jsParams can be used anywhere in your litActionCode
        jsParams: {
          // this is the string "Hello World" for testing
          toSign: ethers.utils.arrayify(unsignedTxn),
          publicKey,
          sigName: "sig1",
        },
      });
      console.log("resp: ", resp);
      const sig = resp.signatures.sig1;
      console.log("sig: ", sig);

      const signedTxn = ethers.utils.serializeTransaction(
        txParams,
        sig.signature
      );

      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      const sentTxn = await provider.sendTransaction(signedTxn);
      console.log("sentTxn", sentTxn);

      // Approve Call Request
      connector.approveRequest({
        id: payload.id,
        result: sentTxn.hash,
      });
    });

    connector.on("disconnect", (error, payload) => {
      if (error) {
        throw error;
      }

      // Delete connector
    });

    if (connector.connected) {
      console.log("it thinks it's connected?");
      const { chainId, accounts } = connector;
      console.log("chainId", chainId);
      console.log("accounts", accounts);
    }

    setWalletConnector(connector);
  };
  return (
    <div className="container">
      <Head>
        <title>Lit PKP Wallet Connect</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <button onClick={connect}>Connect</button>

        <QrReader
          onResult={(result, error) => {
            if (result) {
              console.log("result: ", result);
              setData(result.text);
            }

            if (error) {
              console.info(error);
            }
          }}
          containerStyle={{ width: 600, height: 600 }}
        />
        <p>{data}</p>
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by <img src="/vercel.svg" alt="Vercel" className="logo" />
        </a>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;

          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 45%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
