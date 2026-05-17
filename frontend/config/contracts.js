let deployedAddresses = {};
try { deployedAddresses = require("./deployedAddresses.json"); } catch {}

export const CONTRACT_ADDRESSES = {
  productRegistry:     process.env.NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS     || deployedAddresses?.contracts?.ProductRegistry     || "",
  escrowOrder:         process.env.NEXT_PUBLIC_ESCROW_ORDER_ADDRESS          || deployedAddresses?.contracts?.EscrowOrder          || "",
  disputeResolver:     process.env.NEXT_PUBLIC_DISPUTE_RESOLVER_ADDRESS      || deployedAddresses?.contracts?.DisputeResolver      || "",
  reputationSystem:    process.env.NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS     || deployedAddresses?.contracts?.ReputationSystem     || "",
  attestationRegistry: process.env.NEXT_PUBLIC_ATTESTATION_REGISTRY_ADDRESS  || deployedAddresses?.contracts?.AttestationRegistry  || "",
};

function loadABI(name) {
  try { return require(`../abis/${name}.json`).abi; }
  catch { console.warn(`[TrustMart] ABI missing: ${name} — run deploy script`); return []; }
}

export const ABIS = {
  ProductRegistry:     loadABI("ProductRegistry"),
  EscrowOrder:         loadABI("EscrowOrder"),
  DisputeResolver:     loadABI("DisputeResolver"),
  ReputationSystem:    loadABI("ReputationSystem"),
  AttestationRegistry: loadABI("AttestationRegistry"),
};

export const PLATFORM_FEE_PERCENT  = 2.5;
export const LISTING_FEE_KITE      = 0.001;
export const CANCEL_WINDOW_SECS    = 3600;
export const SHIPPING_TIMEOUT_DAYS = 7;
export const AUTO_RELEASE_DAYS     = 21;
export const EXPLORER_URL          = "https://testnet.kitescan.ai";

export const CATEGORIES = [
  { id: 0, label: "Electronics", emoji: "💻" },
  { id: 1, label: "Clothing",    emoji: "👗" },
  { id: 2, label: "Food",        emoji: "🍎" },
  { id: 3, label: "Books",       emoji: "📚" },
  { id: 4, label: "Sports",      emoji: "⚽" },
  { id: 5, label: "Home",        emoji: "🏠" },
  { id: 6, label: "Services",    emoji: "🔧" },
  { id: 7, label: "Other",       emoji: "📦" },
];

export const ORDER_STATUS = {
  0: { label: "Paid",      color: "info",    description: "Payment locked in escrow" },
  1: { label: "Shipped",   color: "warning", description: "Seller has shipped" },
  2: { label: "Delivered", color: "success", description: "Delivery confirmed" },
  3: { label: "Disputed",  color: "danger",  description: "Dispute in progress" },
  4: { label: "Refunded",  color: "cyan",    description: "Payment refunded" },
  5: { label: "Completed", color: "success", description: "Order complete" },
  6: { label: "Cancelled", color: "muted",   description: "Order cancelled" },
};

export const BADGE_LEVELS = {
  0: { name: "None",     color: "#475569", emoji: "",   sales: 0   },
  1: { name: "Bronze",   color: "#cd7f32", emoji: "🥉", sales: 5   },
  2: { name: "Silver",   color: "#9e9e9e", emoji: "🥈", sales: 25  },
  3: { name: "Gold",     color: "#ffd700", emoji: "🥇", sales: 100 },
  4: { name: "Platinum", color: "#e5e4e2", emoji: "💎", sales: 500 },
};
