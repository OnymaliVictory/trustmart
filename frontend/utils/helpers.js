import { ethers } from "ethers";
import { format, formatDistanceToNow } from "date-fns";
import { CATEGORIES, ORDER_STATUS, BADGE_LEVELS, EXPLORER_URL } from "../config/contracts";

// ── KITE token formatters ─────────────────────────────────

export function formatKITE(weiValue, decimals = 4) {
  if (!weiValue) return "0";
  try {
    const val = parseFloat(ethers.utils.formatEther(weiValue));
    return val.toLocaleString("en-US", { maximumFractionDigits: decimals });
  } catch {
    return "0";
  }
}

export function parseKITE(amount) {
  try {
    return ethers.utils.parseEther(String(amount));
  } catch {
    return ethers.BigNumber.from(0);
  }
}

export function formatKITEPrice(weiValue) {
  const formatted = formatKITE(weiValue);
  return `${formatted} KITE`;
}

// ── Address formatting ────────────────────────────────────

export function shortAddress(addr, front = 6, back = 4) {
  if (!addr) return "";
  return `${addr.slice(0, front)}…${addr.slice(-back)}`;
}

export function explorerTxLink(hash) {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddressLink(addr) {
  return `${EXPLORER_URL}/address/${addr}`;
}

// ── Date / time ────────────────────────────────────────────

export function formatDate(timestamp) {
  if (!timestamp) return "—";
  const ts = typeof timestamp === "number" ? timestamp * 1000 : timestamp;
  return format(new Date(ts), "MMM d, yyyy");
}

export function formatDateTime(timestamp) {
  if (!timestamp) return "—";
  const ts = typeof timestamp === "number" ? timestamp * 1000 : timestamp;
  return format(new Date(ts), "MMM d, yyyy HH:mm");
}

export function timeAgo(timestamp) {
  if (!timestamp) return "—";
  const ts = typeof timestamp === "number" ? timestamp * 1000 : timestamp;
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

export function timeUntilExpiry(timestamp, durationSecs) {
  if (!timestamp) return null;
  const expiry = (Number(timestamp) + durationSecs) * 1000;
  const now = Date.now();
  if (now >= expiry) return "Expired";
  return formatDistanceToNow(new Date(expiry), { addSuffix: true });
}

// ── Order status ──────────────────────────────────────────

export function getOrderStatus(statusCode) {
  return ORDER_STATUS[statusCode] || { label: "Unknown", color: "muted", description: "" };
}

export function getStatusBadgeClass(statusCode) {
  const status = ORDER_STATUS[statusCode];
  if (!status) return "badge-muted";
  const map = {
    info:    "badge-primary",
    warning: "badge-warning",
    success: "badge-success",
    danger:  "badge-danger",
    cyan:    "badge-cyan",
    muted:   "badge-muted",
  };
  return map[status.color] || "badge-muted";
}

// ── Category helpers ──────────────────────────────────────

export function getCategoryLabel(id) {
  return CATEGORIES.find((c) => c.id === Number(id))?.label || "Other";
}

export function getCategoryEmoji(id) {
  return CATEGORIES.find((c) => c.id === Number(id))?.emoji || "📦";
}

// ── Badge helpers ─────────────────────────────────────────

export function getBadgeInfo(level) {
  return BADGE_LEVELS[level] || BADGE_LEVELS[0];
}

// ── Star rating ───────────────────────────────────────────

export function formatRating(avgRating100x, reviewCount) {
  if (!reviewCount || reviewCount === 0) return { display: "No reviews", stars: 0 };
  const stars = avgRating100x / 100;
  return { display: stars.toFixed(1), stars };
}

// ── Gas estimate helper ───────────────────────────────────

export async function estimateGas(contractMethod, args = [], value = "0") {
  try {
    const gasEstimate = await contractMethod.estimateGas(...args, {
      value: ethers.utils.parseEther(value),
    });
    return gasEstimate.toString();
  } catch (err) {
    return null;
  }
}

// ── Platform stats formatter ──────────────────────────────

export function formatVolume(weiVolume) {
  const kite = parseFloat(ethers.utils.formatEther(weiVolume || "0"));
  if (kite >= 1_000_000) return `${(kite / 1_000_000).toFixed(1)}M`;
  if (kite >= 1_000)     return `${(kite / 1_000).toFixed(1)}K`;
  return kite.toFixed(2);
}

// ── Image URL fallback ────────────────────────────────────

export function getImageUrl(url, fallback = "/images/placeholder.png") {
  if (!url || url.trim() === "") return fallback;
  if (url.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${url.replace("ipfs://", "")}`;
  }
  return url;
}

// ── Truncate text ─────────────────────────────────────────

export function truncate(text, maxLen = 80) {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

// ── Copy to clipboard ────────────────────────────────────

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ── BigNumber safe conversion ────────────────────────────

export function bnToNumber(bn) {
  try {
    return ethers.BigNumber.from(bn).toNumber();
  } catch {
    return 0;
  }
}

export function bnToString(bn) {
  try {
    return ethers.BigNumber.from(bn).toString();
  } catch {
    return "0";
  }
}
