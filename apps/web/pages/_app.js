import { MetaMaskProvider } from "../components/MetamaskProvider";
import { NetworkProvider } from "../hooks/useNetwork";
import { useHasMounted } from "../hooks/useHasMounted";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return null;
  }

  return (
    <MetaMaskProvider>
      <NetworkProvider>
        <Component {...pageProps} />
      </NetworkProvider>
    </MetaMaskProvider>
  );
}
export default MyApp;
