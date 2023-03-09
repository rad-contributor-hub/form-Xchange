import { PropsWithChildren, useContext, useReducer } from "react";

import { metaMask } from "../../lib/metaMask";
import reducer, { initialState } from "./reducer";
import { isAccountList, networks } from "../../utils/networks";
import ConnectionContext from "./context";

const NetworkProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const metaMaskSdk = metaMask();

  const {
    connectWallet,
    getBalance,
    getChainId,
    listenToAccounts,
    listenToChain,
    isMetaMaskInstalled,
    switchEthereumChain,
  } = metaMaskSdk;

  /**
   * Initializes the page
   */
  const initPage = () => {
    const local = window.localStorage.getItem("metamaskState");

    // user was previously connected, start listening to MM
    if (local) {
      listenToAccounts(handleAccountChanged);

      listenToChain(handleChainChanged);
    }

    // local could be null if not present in LocalStorage
    const { wallet, balance } = local
      ? JSON.parse(local)
      : // backup if local storage is empty
        { wallet: null, balance: null };

    const chainId = getChainId();
    let wrongNetwork = false;

    if (chainId !== networks.development.network_id) {
      wrongNetwork = true;
    }

    dispatch({
      type: "page_loaded",
      payload: {
        isMetaMaskInstalled,
        wallet,
        balance,
        wrongNetwork,
        isConnected: Boolean(wallet),
      },
    });
  };

  const connect = async () => {
    const wallet = await connectWallet();
    const balance = await getBalance(wallet);
    const chainId = getChainId();

    let wrongNetwork = false;

    if (chainId !== networks.development.network_id) {
      wrongNetwork = true;
    }
    const narrowedBalance = typeof balance === "string" ? balance : "";

    dispatch({
      type: "connect",
      payload: {
        wallet,
        balance: narrowedBalance,
        chainId,
        wrongNetwork,
        isConnected: true,
      },
    });

    //@ts-ignore
    setLocalStorage(wallet, balance);

    listenToAccounts(handleAccountChanged);

    listenToChain(handleChainChanged);
  };

  const handleAccountChanged = async (newAccounts: unknown) => {
    if (isAccountList(newAccounts) && newAccounts.length > 0) {
      const newBalance = await getBalance(newAccounts[0]);

      const narrowedBalance = typeof newBalance === "string" ? newBalance : "";

      dispatch({
        type: "change_account",
        payload: {
          wallet: newAccounts[0],
          balance: narrowedBalance,
        },
      });
      setLocalStorage(newAccounts[0], narrowedBalance);
    } else {
      dispatch({
        type: "disconnect",
        payload: {},
      });
      window.localStorage.clear();
    }
  };

  const handleChainChanged = async (newChain: string) => {
    let wrongNetwork = false;

    if (parseInt(newChain) !== networks.development.chain_id) {
      wrongNetwork = true;
    }

    const wallet = await connectWallet();

    const newBalance = await getBalance(wallet);

    dispatch({
      type: "change_network",
      payload: {
        chainId: newChain,
        wrongNetwork,
        wallet,
        balance: typeof newBalance === "string" ? newBalance : "",
      },
    });
  };
  const switchChain = async () => {
    await switchEthereumChain();
  };

  const setLocalStorage = (wallet: string, balance: string) => {
    window.localStorage.setItem(
      "metamaskState",
      JSON.stringify({ wallet, balance })
    );
  };

  return (
    <ConnectionContext.Provider
      value={{ state, connect, initPage, switchChain }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

const useNetwork = () => {
  const context = useContext(ConnectionContext);

  if (context === undefined) {
    throw new Error("useNetwork hook must be used within a NetworkProvider");
  }
  return context;
};

export { NetworkProvider, useNetwork };