import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CHAIN_ID, switchToKiteChain } from "../config/chain";
import { CONTRACT_ADDRESSES, ABIS } from "../config/contracts";
import toast from "react-hot-toast";

const WalletContext = createContext(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}

export function WalletProvider({ children }) {
  const [account,          setAccount]          = useState(null);
  const [provider,         setProvider]         = useState(null);
  const [signer,           setSigner]           = useState(null);
  const [chainId,          setChainId]          = useState(null);
  const [balance,          setBalance]          = useState("0");
  const [isConnecting,     setIsConnecting]     = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isAdmin,          setIsAdmin]          = useState(false);
  const [contracts,        setContracts]        = useState({
    productRegistry: null, escrowOrder: null,
    disputeResolver: null, reputationSystem: null, attestationRegistry: null,
  });

  const hasMetaMask =
    typeof window !== "undefined" &&
    typeof window.ethereum !== "undefined";

  // ── Build contract instances ──────────────────────────
  const buildContracts = useCallback((_signer) => {
    if (!_signer) return;
    const a = CONTRACT_ADDRESSES;
    setContracts({
      productRegistry:     a.productRegistry     && ABIS.ProductRegistry.length     ? new ethers.Contract(a.productRegistry,     ABIS.ProductRegistry,     _signer) : null,
      escrowOrder:         a.escrowOrder         && ABIS.EscrowOrder.length          ? new ethers.Contract(a.escrowOrder,         ABIS.EscrowOrder,         _signer) : null,
      disputeResolver:     a.disputeResolver     && ABIS.DisputeResolver.length      ? new ethers.Contract(a.disputeResolver,     ABIS.DisputeResolver,     _signer) : null,
      reputationSystem:    a.reputationSystem    && ABIS.ReputationSystem.length     ? new ethers.Contract(a.reputationSystem,    ABIS.ReputationSystem,    _signer) : null,
      attestationRegistry: a.attestationRegistry && ABIS.AttestationRegistry?.length ? new ethers.Contract(a.attestationRegistry, ABIS.AttestationRegistry, _signer) : null,
    });
  }, []);

  // ── Refresh balance ───────────────────────────────────
  const refreshBalance = useCallback(async (_provider, _account) => {
    if (!_provider || !_account) return;
    try {
      const bal = await _provider.getBalance(_account);
      setBalance(ethers.utils.formatEther(bal));
    } catch { /* ignore */ }
  }, []);

  // ── Check admin ───────────────────────────────────────
  const checkAdmin = useCallback(async (_signer, _account) => {
    if (!_signer || !_account || !CONTRACT_ADDRESSES.escrowOrder || !ABIS.EscrowOrder.length) return;
    try {
      const c = new ethers.Contract(CONTRACT_ADDRESSES.escrowOrder, ABIS.EscrowOrder, _signer);
      const owner = await c.owner();
      setIsAdmin(owner.toLowerCase() === _account.toLowerCase());
    } catch { setIsAdmin(false); }
  }, []);

  // ── initWallet — only called after we KNOW accounts exist ──
  const initWallet = useCallback(async (ethereum) => {
    try {
      const web3Provider = new ethers.providers.Web3Provider(ethereum, "any");
      const [network, accounts] = await Promise.all([
        web3Provider.getNetwork(),
        web3Provider.listAccounts(),
      ]);

      if (!accounts || accounts.length === 0) return;

      const _account   = accounts[0];
      const _chainId   = network.chainId;
      const _signer    = web3Provider.getSigner();
      const _isCorrect = _chainId === CHAIN_ID;

      setProvider(web3Provider);
      setSigner(_signer);
      setAccount(_account);
      setChainId(_chainId);
      setIsCorrectNetwork(_isCorrect);

      await refreshBalance(web3Provider, _account);
      if (_isCorrect) {
        buildContracts(_signer);
        await checkAdmin(_signer, _account);
      }
    } catch (err) {
      // Silently swallow — user simply hasn't approved the site yet
      console.warn("[TrustMart] initWallet:", err.message);
    }
  }, [buildContracts, refreshBalance, checkAdmin]);

  // ── connect — triggered by user clicking the button ───
  const connect = useCallback(async () => {
    if (!hasMetaMask) {
      toast.error("MetaMask not found — please install it.");
      setTimeout(() => window.open("https://metamask.io/download/", "_blank"), 300);
      return;
    }

    setIsConnecting(true);
    try {
      // eth_requestAccounts shows the MetaMask popup
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      if (!accounts || accounts.length === 0) {
        toast.error("No accounts returned from MetaMask.");
        return;
      }

      await initWallet(window.ethereum);
      toast.success("Wallet connected!");
    } catch (err) {
      if (err.code === 4001)   toast.error("Rejected — please approve in MetaMask.");
      else if (err.code === -32002) toast.error("MetaMask popup already open — check the extension.");
      else {
        toast.error("Connection failed: " + (err.message || "unknown error"));
        console.error("[TrustMart] connect:", err);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [hasMetaMask, initWallet]);

  // ── disconnect ────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance("0");
    setIsCorrectNetwork(false);
    setIsAdmin(false);
    setContracts({ productRegistry: null, escrowOrder: null, disputeResolver: null, reputationSystem: null, attestationRegistry: null });
    toast("Wallet disconnected", { icon: "👋" });
  }, []);

  // ── switchNetwork ─────────────────────────────────────
  const switchNetwork = useCallback(async () => {
    try { await switchToKiteChain(); }
    catch (err) { toast.error("Switch failed: " + (err.message || "Try manually in MetaMask")); }
  }, []);

  // ── MetaMask event listeners + silent auto-reconnect ──
  useEffect(() => {
    if (!hasMetaMask) return;

    const onAccountsChanged = async (accs) => {
      if (!accs || accs.length === 0) { disconnect(); return; }
      await initWallet(window.ethereum);
    };

    const onChainChanged = async (hex) => {
      const newId  = parseInt(hex, 16);
      const correct = newId === CHAIN_ID;
      setChainId(newId);
      setIsCorrectNetwork(correct);
      if (correct) {
        await initWallet(window.ethereum);
        toast.success("Switched to Kite Chain ✓");
      } else {
        setContracts({ productRegistry: null, escrowOrder: null, disputeResolver: null, reputationSystem: null, attestationRegistry: null });
        toast.error("Wrong network — switch to Kite Chain.");
      }
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged",    onChainChanged);

    // ── KEY FIX: use eth_accounts (NO POPUP) to silently check ──
    // Never call initWallet() directly on mount — it creates a
    // Web3Provider before MetaMask approves the site, which throws.
    window.ethereum
      .request({ method: "eth_accounts" })   // returns [] if not approved yet
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          // User already approved this site — safe to init
          initWallet(window.ethereum);
        }
        // Otherwise do nothing — wait for user to click Connect
      })
      .catch(() => { /* MetaMask not ready — ignore */ });

    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged",    onChainChanged);
    };
  }, [hasMetaMask, initWallet, disconnect]);

  // ── Balance polling ───────────────────────────────────
  useEffect(() => {
    if (!provider || !account) return;
    const iv = setInterval(() => refreshBalance(provider, account), 15000);
    return () => clearInterval(iv);
  }, [provider, account, refreshBalance]);

  // ── sendTx helper ─────────────────────────────────────
  const sendTx = useCallback(async (txPromise, { pendingMsg = "Pending…", successMsg = "Confirmed!", onSuccess } = {}) => {
    const id = toast.loading(pendingMsg);
    try {
      const tx      = await txPromise;
      toast.loading(`Confirming… ${tx.hash.slice(0, 10)}…`, { id });
      const receipt = await tx.wait(1);
      toast.success(successMsg, { id, duration: 5000 });
      await refreshBalance(provider, account);
      onSuccess?.(receipt);
      return receipt;
    } catch (err) {
      const msg = err?.reason || err?.data?.message || err?.message || "Transaction failed";
      toast.error(msg.slice(0, 140), { id, duration: 6000 });
      throw err;
    }
  }, [provider, account, refreshBalance]);

  const shortAddress     = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : null;
  const formattedBalance = parseFloat(balance).toFixed(4);

  return (
    <WalletContext.Provider value={{
      account, provider, signer, chainId, balance, formattedBalance,
      shortAddress, isConnecting, isCorrectNetwork, isAdmin, hasMetaMask,
      contracts, connect, disconnect, switchNetwork, sendTx,
      refreshBalance: () => refreshBalance(provider, account),
    }}>
      {children}
    </WalletContext.Provider>
  );
}
