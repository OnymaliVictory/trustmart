// ── Kite Chain Network Configuration ─────────────────────

export const KITE_CHAIN = {
  chainId: 2368,
  chainIdHex: "0x940",
  chainName: "Kite Chain Testnet",
  nativeCurrency: {
    name: "KITE",
    symbol: "KITE",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-testnet.gokite.ai/"],
  blockExplorerUrls: ["https://testnet.kitescan.ai"],
};

export const CHAIN_ID         = 2368;
export const EXPLORER_URL     = "https://testnet.kitescan.ai";
export const CURRENCY_SYMBOL  = "KITE";
export const CURRENCY_DECIMALS = 18;

// Helper: build block explorer links
export const explorerTx      = (hash)    => `${EXPLORER_URL}/tx/${hash}`;
export const explorerAddress = (address) => `${EXPLORER_URL}/address/${address}`;
export const explorerToken   = (address) => `${EXPLORER_URL}/token/${address}`;

// ── MetaMask network switch ───────────────────────────────
export async function switchToKiteChain() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: KITE_CHAIN.chainIdHex }],
    });
  } catch (switchError) {
    // Chain not added yet – add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: KITE_CHAIN.chainIdHex,
            chainName: KITE_CHAIN.chainName,
            nativeCurrency: KITE_CHAIN.nativeCurrency,
            rpcUrls: KITE_CHAIN.rpcUrls,
            blockExplorerUrls: KITE_CHAIN.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}
