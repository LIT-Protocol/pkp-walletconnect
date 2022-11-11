import { useAccount } from 'wagmi';

export default function Footer({ tab, setTab }) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <footer className="footer">
        <span className="footer__caption">Powered by Lit</span>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer__links">
        <button
          onClick={e => {
            e.preventDefault();
            setTab(1);
          }}
          className={
            tab === 1 ? 'footer__link footer__link--active' : 'footer__link'
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="footer__link__icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>

          <span className="sr-only">Home</span>
        </button>
        <button
          onClick={e => {
            e.preventDefault();
            setTab(2);
          }}
          className={
            tab === 2 ? 'footer__link footer__link--active' : 'footer__link'
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="footer__link__icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z"
            />
          </svg>

          <span className="sr-only">Connect</span>
        </button>
        <button
          onClick={e => {
            e.preventDefault();
            setTab(3);
          }}
          className={
            tab === 3 ? 'footer__link footer__link--active' : 'footer__link'
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="footer__link__icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            />
          </svg>

          <span className="sr-only">Activity</span>
        </button>
        <button
          onClick={e => {
            e.preventDefault();
            setTab(4);
          }}
          className={
            tab === 4 ? 'footer__link footer__link--active' : 'footer__link'
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="footer__link__icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>

          <span className="sr-only">Details</span>
        </button>
      </div>
    </footer>
  );
}
