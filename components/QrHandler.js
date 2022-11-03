// import { Fragment, useState } from 'react';
// import { Button } from '@mui/material';
// import { QrReader } from 'react-qr-reader';
// import styled from '@emotion/styled';
// import QrCodeRoundedIcon from '@mui/icons-material/QrCodeRounded';

// export default function QrHandler({ initWalletConnect }) {
//   const [show, setShow] = useState(false);

//   function onShowScanner() {
//     setShow(true);
//   }

//   return (
//     <QrContainer>
//       {show ? (
//         <Fragment>
//           <QrVideoMask>
//             <QrReader
//               style={{ width: '100%' }}
//               onResult={async (result, error) => {
//                 if (result && result.text) {
//                   console.log('result: ', result);
//                   await initWalletConnect(result.text);
//                   setShow(false);
//                 }

//                 if (error) {
//                   setShow(false);
//                   console.info(error);
//                 }
//               }}
//             />
//           </QrVideoMask>
//         </Fragment>
//       ) : (
//         <QrPlaceholder>
//           <QrCodeRoundedIcon
//             sx={{ fontSize: 128, mb: 2, color: 'rgba(139, 139, 139, 0.4)' }}
//           />
//           <Button variant="contained" onClick={onShowScanner} size="small">
//             Scan QR code
//           </Button>
//         </QrPlaceholder>
//       )}
//     </QrContainer>
//   );
// }

// const QrContainer = styled.div`
//   width: 100%;
//   height: calc(100% - 220px);
//   display: flex;
//   flex: 1;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
// `;

// const QrVideoMask = styled.div`
//   width: 100%;
//   border-radius: 15px;
//   overflow: hidden !important;
//   position: relative;
// `;

// const QrPlaceholder = styled.div`
//   border: 2px rgba(139, 139, 139, 0.4) dashed;
//   width: 100%;
//   border-radius: 15px;
//   padding: 50px;
//   height: calc(100% - 220px);
//   display: flex;
//   flex: 1;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
// `;
