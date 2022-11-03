import Navbar from './navbar';
import Footer from './footer';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <div className="cloud-wallet">
        <Navbar />
        <main className="container">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
