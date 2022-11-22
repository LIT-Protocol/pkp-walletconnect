import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <div className="cloud-wallet">
        <Header></Header>
        {children}
        <Footer></Footer>
      </div>
    </div>
  );
}
