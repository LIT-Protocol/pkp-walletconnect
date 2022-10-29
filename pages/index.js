import { useEffect, useState } from 'react';
import Head from 'next/head';
import LitJsSdk from 'lit-js-sdk';
import WalletConnect from '@walletconnect/client';
import { ethers } from 'ethers';
import { QrReader } from 'react-qr-reader';
import {
  hexlify,
  splitSignature,
  hexZeroPad,
  joinSignature,
} from '@ethersproject/bytes';
import { verifyMessage } from '@ethersproject/wallet';

const BigNumber = ethers.BigNumber;

const publicKey =
  '0x04c5f019b99796e26aa2835fe6ece2aad23dac1ca523b67c7ffde880776db1368ba37812b961f43197b3f473ad89b9c474051f83cce64d9d006aabd245b91794ef';
const ethAddress = ethers.utils.computeAddress(publicKey);
const networkId = 80001;
const rpcUrl = 'https://matic-mumbai.chainstacklabs.com';

// globalThis.ethAddress = ethAddress;
globalThis.LitJsSdk = LitJsSdk;
// globalThis.ethers = ethers;

export default function Home() {
  const [litNodeClient, setLitNodeClient] = useState(null);
  const [walletConnector, setWalletConnector] = useState(null);
  const [data, setData] = useState('');

  useEffect(() => {
    async function init() {
      const litNodeClient = new LitJsSdk.LitNodeClient({
        litNetwork: 'mumbai',
      });
      await litNodeClient.connect();
      setLitNodeClient(litNodeClient);
    }

    init();

    // walletconnect id 7310597d2e34d8d9b01deb49e7ac0b7c
  }, []);

  const connect = async () => {
    // Create connector
    const connector = new WalletConnect({
      // Required
      uri: data,
      // Required
      clientMeta: {
        description: 'Lit PKP Wallet',
        url: 'https://litprotocol.com',
        name: 'Lit PKP Wallet',
      },
    });
    console.log('created connector', connector);

    // Subscribe to session requests
    connector.on('session_request', (error, payload) => {
      if (error) {
        throw error;
      }
      console.log('session_request', payload);

      // Handle Session Request

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
    connector.on('call_request', async (error, payload) => {
      if (error) {
        throw error;
      }
      console.log('call request', payload);

      // Handle Call Request

      let dataToSign = null;
      let addressRequested = null;

      switch (payload.method) {
        case 'eth_sign':
          dataToSign = payload.params[1];
          addressRequested = payload.params[0];
          signMessage(ethers.utils.arrayify(dataToSign));
          break;
        case 'personal_sign':
          dataToSign = payload.params[0];
          addressRequested = payload.params[1];
          signPersonalMessage(dataToSign);
          break;
        case 'eth_signTypedData':
          dataToSign = payload.params[1];
          addressRequested = payload.params[0];
          signMessage(dataToSign);
          break;
        case 'eth_signTransaction':
          dataToSign = payload.params[0];
          signTransaction(dataToSign);
          break;
        case 'eth_sendTransaction':
          dataToSign = payload.params[0];
          sendTransaction(dataToSign);
          break;
        default:
          break;
      }

      async function signPersonalMessage(message) {
        const litActionCode = `
          const go = async () => {
            const sigShare = await LitActions.ethPersonalSignMessageEcdsa({ message, publicKey, sigName });
          };
          
          go();
        `;

        const authSig = await LitJsSdk.checkAndSignAuthMessage({
          chain: 'mumbai',
        });

        const response = await litNodeClient.executeJs({
          code: litActionCode,
          authSig,
          jsParams: {
            message: message,
            publicKey: publicKey,
            sigName: 'sig1',
          },
        });
        const signatures = response.signatures;
        console.log('signatures: ', signatures);
        const sig = signatures.sig1;

        const encodedSig = joinSignature({
          r: '0x' + sig.r,
          s: '0x' + sig.s,
          v: sig.recid,
        });
        console.log('encodedSig', encodedSig);

        // Approve Call Request
        connector.approveRequest({
          id: payload.id,
          result: encodedSig,
        });
      }

      async function signMessage(toSign) {
        const litActionCode = `
          const go = async () => {
            const sigShare = await LitActions.signEcdsa({ toSign, publicKey, sigName });
          };
          
          go();
        `;

        const authSig = await LitJsSdk.checkAndSignAuthMessage({
          chain: 'mumbai',
        });

        const response = await litNodeClient.executeJs({
          code: litActionCode,
          authSig,
          jsParams: {
            toSign: toSign,
            publicKey: publicKey,
            sigName: 'sig1',
          },
        });
        const signatures = response.signatures;
        console.log('signatures: ', signatures);
        const sig = signatures.sig1;

        const encodedSig = joinSignature({
          r: '0x' + sig.r,
          s: '0x' + sig.s,
          v: sig.recid,
        });
        console.log('encodedSig', encodedSig);

        // Approve Call Request
        connector.approveRequest({
          id: payload.id,
          result: encodedSig,
        });
      }

      async function signTransaction(dataToSign) {
        let txParams = dataToSign;
        if (dataToSign && dataToSign.from) {
          delete dataToSign.from;
        }
        dataToSign.gasLimit = dataToSign.gas;
        delete dataToSign.gas;

        console.log('txParams', txParams);

        const serializedTx = ethers.utils.serializeTransaction(txParams);
        console.log('serializedTx', serializedTx);

        const rlpEncodedTxn = ethers.utils.arrayify(serializedTx);
        console.log('rlpEncodedTxn: ', rlpEncodedTxn);

        const unsignedTxn = ethers.utils.keccak256(rlpEncodedTxn);
        console.log('unsignedTxn: ', unsignedTxn);

        // you need an AuthSig to auth with the nodes
        // this will get it from metamask or any browser wallet
        const authSig = await LitJsSdk.checkAndSignAuthMessage({
          chain: 'mumbai',
        });

        const resp = await litNodeClient.executeJs({
          ipfsId: 'QmRwN9GKHvCn4Vk7biqtr6adjXMs7PzzYPCzNCRjPFiDjm',
          authSig,
          // all jsParams can be used anywhere in your litActionCode
          jsParams: {
            // this is the string "Hello World" for testing
            toSign: ethers.utils.arrayify(unsignedTxn),
            publicKey,
            sigName: 'sig1',
          },
        });
        console.log('resp: ', resp);
        const sig = resp.signatures.sig1;
        console.log('sig: ', sig);

        const signedTxn = ethers.utils.serializeTransaction(
          txParams,
          sig.signature
        );
        console.log('signedTxn: ', signedTxn);

        // Approve Call Request
        connector.approveRequest({
          id: payload.id,
          result: signedTxn,
        });
      }

      async function sendTransaction(txFromParams) {
        // need to massage a few things
        const txParams = {
          to: txFromParams.to,
          value: txFromParams.value,
          nonce: txFromParams.nonce,
          maxFeePerGas: BigNumber.from('3395000013'),
          maxPriorityFeePerGas: BigNumber.from('3394999999'),
          gasLimit: txFromParams.gas ? txFromParams.gas : txFromParams.gasLimit,
          data: txFromParams.data,
          type: 2,
          chainId: networkId,
        };
        console.log('txParams', txParams);

        const serializedTx = ethers.utils.serializeTransaction(txParams);
        console.log('serializedTx', serializedTx);

        const rlpEncodedTxn = ethers.utils.arrayify(serializedTx);
        console.log('rlpEncodedTxn: ', rlpEncodedTxn);

        const unsignedTxn = ethers.utils.keccak256(rlpEncodedTxn);
        console.log('unsignedTxn: ', unsignedTxn);

        // you need an AuthSig to auth with the nodes
        // this will get it from metamask or any browser wallet
        const authSig = await LitJsSdk.checkAndSignAuthMessage({
          chain: 'mumbai',
        });

        const resp = await litNodeClient.executeJs({
          ipfsId: 'QmRwN9GKHvCn4Vk7biqtr6adjXMs7PzzYPCzNCRjPFiDjm',
          authSig,
          // all jsParams can be used anywhere in your litActionCode
          jsParams: {
            // this is the string "Hello World" for testing
            toSign: ethers.utils.arrayify(unsignedTxn),
            publicKey,
            sigName: 'sig1',
          },
        });
        console.log('resp: ', resp);
        const sig = resp.signatures.sig1;
        console.log('sig: ', sig);

        const signedTxn = ethers.utils.serializeTransaction(
          txParams,
          sig.signature
        );

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        const sentTxn = await provider.sendTransaction(signedTxn);
        console.log('sentTxn', sentTxn);

        // Approve Call Request
        connector.approveRequest({
          id: payload.id,
          result: sentTxn.hash,
        });
      }
    });

    connector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }

      // Delete connector
    });

    if (connector.connected) {
      console.log("it thinks it's connected?");
      const { chainId, accounts } = connector;
      console.log('chainId', chainId);
      console.log('accounts', accounts);
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

        {/* <QrReader
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
        /> */}
        <input
          id="wallet-name"
          value={data}
          onChange={e => setData(e.target.value)}
          aria-label="wc url connect input"
          placeholder="e.g. wc:a281567bb3e4..."
        ></input>
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
