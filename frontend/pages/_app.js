// pages/_app.js
import '../styles/styles.css'; // Import your global CSS file

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
