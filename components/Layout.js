import Header from './header';
// import Footer from './footer';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <div className="cloud-wallet">
        <Header />
        {children}
        {/* <main className="container">{children}</main>
        <Footer /> */}
      </div>
    </div>
  );
}
