import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Shield, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { shortAddress } from "../utils/helpers";
import { EXPLORER_URL } from "../config/chain";

const ICONS = {
  DELIVERY_VERIFY:   { icon: <CheckCircle size={12} />,   color: "text-success"      },
  FRAUD_CHECK:       { icon: <Shield size={12} />,         color: "text-warning"      },
  DISPUTE_ARBITRATE: { icon: <Brain size={12} />,          color: "text-primary-400"  },
  FUNDS_RELEASED:    { icon: <Zap size={12} />,            color: "text-accent-400"   },
  PRICE_ANOMALY:     { icon: <AlertTriangle size={12} />,  color: "text-danger"       },
};

export default function AgentFeed({ agentUrl }) {
  const [feed,    setFeed]    = useState([]);
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);

  const url = agentUrl || process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const [feedRes, statusRes] = await Promise.all([
          fetch(`${url}/api/attestations/feed/latest`),
          fetch(`${url}/api/agent/status`),
        ]);
        const feedData   = await feedRes.json();
        const statusData = await statusRes.json();
        if (feedData.ok)   setFeed((feedData.attestations || []).reverse().slice(0, 8));
        if (statusData.ok) setStatus(statusData.agent);
      } catch {
        // Agent not running — graceful degradation
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
    const iv = setInterval(fetchFeed, 15000);
    return () => clearInterval(iv);
  }, [url]);

  return (
    <div className="card border-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-700/20 border border-primary-700/30 flex items-center justify-center">
            <Brain size={16} className="text-primary-400" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-white">AI Agent Activity</h3>
            <p className="text-[10px] text-ink-muted">Live on Kite Chain</p>
          </div>
        </div>
        {status ? (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-ink-secondary">Agent Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
            <span className="text-[10px] text-ink-muted">Agent Offline</span>
          </div>
        )}
      </div>

      {/* Agent wallet info */}
      {status && (
        <div className="glass rounded-xl p-3 mb-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-ink-muted block text-[10px]">Agent Wallet</span>
              <a href={`${EXPLORER_URL}/address/${status.address}`} target="_blank" rel="noreferrer"
                className="font-mono text-accent-400 hover:underline flex items-center gap-1">
                {shortAddress(status.address)} <ExternalLink size={9} />
              </a>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px]">Balance</span>
              <span className="font-semibold text-white">{status.balance}</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {(status.capabilities || []).map((c) => (
              <span key={c} className="badge-primary text-[9px]">{c.replace("_", " ")}</span>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-8 text-ink-muted">
          {!status ? (
            <div>
              <Brain size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Start the agent server to enable AI features</p>
              <code className="text-[10px] text-primary-400 mt-1 block">cd agent && npm start</code>
            </div>
          ) : (
            <p className="text-xs">No AI activity yet — make a purchase to trigger the agent</p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {feed.map((att, i) => {
            const meta = ICONS[att.actionType] || ICONS.FRAUD_CHECK;
            const ts   = parseInt(att.timestamp?.toString() || "0");
            return (
              <motion.div key={att.id?.toString() || i} initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/3 transition-colors">
                <span className={`${meta.color} flex-shrink-0`}>{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white font-medium truncate">
                      {att.actionType?.replace(/_/g, " ")}
                    </span>
                    {att.orderId && parseInt(att.orderId.toString()) > 0 && (
                      <span className="text-[10px] text-ink-muted">Order #{att.orderId.toString()}</span>
                    )}
                  </div>
                  <span className="text-[9px] text-ink-muted truncate block">{att.reason?.slice(0, 60)}…</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[9px] font-semibold ${meta.color}`}>
                    {att.confidence?.toString()}%
                  </span>
                  {att.executedOnChain && (
                    <span className="block text-[8px] text-success">on-chain</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
