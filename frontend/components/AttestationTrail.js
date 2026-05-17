import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle, AlertTriangle, Brain, ExternalLink, Clock, ChevronDown } from "lucide-react";
import { formatDate, shortAddress } from "../utils/helpers";
import { EXPLORER_URL } from "../config/chain";

const ACTION_META = {
  DELIVERY_VERIFY:   { label: "Delivery Verified",  icon: <CheckCircle size={14} />, color: "text-success",  bg: "bg-success/10 border-success/20" },
  FRAUD_CHECK:       { label: "Fraud Check",         icon: <Shield size={14} />,       color: "text-warning",  bg: "bg-warning/10 border-warning/20" },
  DISPUTE_ARBITRATE: { label: "Dispute Arbitrated",  icon: <Brain size={14} />,        color: "text-primary-400", bg: "bg-primary-700/10 border-primary-700/20" },
  FUNDS_RELEASED:    { label: "Funds Released",      icon: <CheckCircle size={14} />,  color: "text-accent-400",bg: "bg-accent-500/10 border-accent-500/20" },
  PRICE_ANOMALY:     { label: "Price Anomaly",        icon: <AlertTriangle size={14} />,color: "text-danger",   bg: "bg-danger/10 border-danger/20" },
};

const DECISION_BADGE = {
  APPROVED:     "badge-success",
  REJECTED:     "badge-danger",
  NEEDS_REVIEW: "badge-warning",
  REFUND_BUYER: "badge-cyan",
  PAY_SELLER:   "badge-primary",
  FRAUD:        "badge-danger",
  APPROVE:      "badge-success",
  FLAG:         "badge-warning",
  REMOVE:       "badge-danger",
  ESCALATE:     "badge-muted",
  FUNDS_RELEASED: "badge-success",
};

export default function AttestationTrail({ orderId, productId, agentUrl }) {
  const [attestations, setAttestations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [expanded,     setExpanded]     = useState({});

  const url = agentUrl || process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";

  useEffect(() => {
    if (!orderId && !productId) { setLoading(false); return; }

    const fetchAttestations = async () => {
      try {
        const endpoint = orderId
          ? `${url}/api/attestations/${orderId}`
          : `${url}/api/attestations/product/${productId}`;

        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.ok) {
          // Normalize BigNumber-like fields
          const normalized = (data.attestations || []).map((a) => ({
            ...a,
            id:         a.id?.toString()         || "0",
            orderId:    a.orderId?.toString()     || "0",
            productId:  a.productId?.toString()   || "0",
            timestamp:  a.timestamp?.toString()   || "0",
            confidence: typeof a.confidence === "object" ? parseInt(a.confidence.hex || "0x64", 16) : a.confidence,
          }));
          setAttestations(normalized.reverse());
        }
      } catch (err) {
        console.warn("AttestationTrail fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttestations();
    const iv = setInterval(fetchAttestations, 20000);
    return () => clearInterval(iv);
  }, [orderId, productId, url]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
      </div>
    );
  }

  if (attestations.length === 0) {
    return (
      <div className="card p-5 border-border text-center">
        <Brain size={28} className="text-ink-muted mx-auto mb-2 opacity-40" />
        <p className="text-sm text-ink-muted">No AI attestations yet</p>
        <p className="text-xs text-ink-muted mt-1">
          AI actions on this order will appear here, permanently recorded on Kite Chain
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attestations.map((att, i) => {
        const meta    = ACTION_META[att.actionType] || ACTION_META.FRAUD_CHECK;
        const badge   = DECISION_BADGE[att.decision] || "badge-muted";
        const tsNum   = parseInt(att.timestamp);
        const isOpen  = expanded[att.id];

        return (
          <motion.div key={att.id} initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`card border rounded-xl overflow-hidden ${meta.bg}`}>

            {/* Header row */}
            <button
              onClick={() => setExpanded((p) => ({ ...p, [att.id]: !p[att.id] }))}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              {/* Icon */}
              <div className={`${meta.color} flex-shrink-0`}>{meta.icon}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">{meta.label}</span>
                  <span className={`badge text-[10px] ${badge}`}>{att.decision}</span>
                  {att.executedOnChain && (
                    <span className="badge-success text-[10px]">⚡ On-chain</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-ink-muted">
                    {tsNum > 0 ? formatDate(tsNum) : "Just now"}
                  </span>
                  <span className="text-[10px] text-ink-muted">·</span>
                  <span className="text-[10px] text-ink-muted">
                    Confidence: <strong className={meta.color}>{att.confidence}%</strong>
                  </span>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${att.confidence >= 80 ? "bg-success" : att.confidence >= 60 ? "bg-warning" : "bg-danger"}`}
                    style={{ width: `${att.confidence}%` }}
                  />
                </div>
              </div>

              <ChevronDown size={13} className={`text-ink-muted transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Expanded detail */}
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}
                  exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5">
                    {/* Reason */}
                    <p className="text-xs text-ink-secondary mt-3">
                      <strong className="text-white">AI Reasoning: </strong>
                      {att.reason}
                    </p>

                    {/* Agent + Attestation ID */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-ink-muted">
                      <div>
                        <span className="block text-ink-muted">Agent Wallet</span>
                        <span className="font-mono text-white">{shortAddress(att.agent || "")}</span>
                      </div>
                      <div>
                        <span className="block text-ink-muted">Attestation ID</span>
                        <span className="font-mono text-white">#{att.id}</span>
                      </div>
                    </div>

                    {/* Metadata preview */}
                    {att.metadata && att.metadata !== "{}" && (
                      <div className="bg-black/20 rounded-lg p-2 text-[10px] font-mono text-ink-muted overflow-auto">
                        {att.metadata.slice(0, 200)}{att.metadata.length > 200 ? "…" : ""}
                      </div>
                    )}

                    {/* Explorer link */}
                    <a
                      href={`${EXPLORER_URL}/address/${att.agent}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-accent-400 hover:underline"
                    >
                      <ExternalLink size={10} /> View agent on Kite Chain Explorer
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <p className="text-[10px] text-ink-muted text-center pt-1">
        🔒 All AI decisions are permanently recorded on Kite Chain
      </p>
    </div>
  );
}
