import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import {
  Shield, AlertCircle, CheckCircle, BarChart2, Users,
  DollarSign, Package, TrendingUp, Zap, ExternalLink,
  UserPlus, UserMinus, RefreshCw, Eye
} from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import {
  formatKITE, shortAddress, formatDate,
  bnToNumber, explorerTxLink
} from "../../utils/helpers";
import { EXPLORER_URL } from "../../config/contracts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const { account, contracts, sendTx, isAdmin, connect } = useWallet();

  const [disputes,    setDisputes]    = useState([]);
  const [analytics,   setAnalytics]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("disputes");
  const [resolveModal, setResolveModal] = useState(null);
  const [resolution,  setResolution]  = useState("");
  const [newArbitrator, setNewArbitrator] = useState("");
  const [disputeStats, setDisputeStats] = useState({ total: 0, pending: 0, forBuyer: 0, forSeller: 0 });

  // ── Fetch data ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!contracts?.escrowOrder || !contracts?.disputeResolver) return;
    setLoading(true);
    try {
      // Analytics
      const [vol, orders, fees, refunded, escrowBal] = await Promise.all([
        contracts.escrowOrder.totalVolume(),
        contracts.escrowOrder.totalOrders(),
        contracts.escrowOrder.totalFeesCollected(),
        contracts.escrowOrder.totalRefunded(),
        contracts.escrowOrder.getEscrowBalance(),
      ]);
      setAnalytics({ vol, orders: orders.toNumber(), fees, refunded, escrowBal });

      // Disputes
      const disputeIds = await contracts.disputeResolver.getAllDisputeIds();
      const disputeData = await Promise.all(
        disputeIds.map(async (id) => {
          const d = await contracts.disputeResolver.getDispute(id);
          return { orderId: id, ...d };
        })
      );
      setDisputes(disputeData.reverse());

      // Dispute stats
      const stats = await contracts.disputeResolver.getStats();
      setDisputeStats({
        total: stats._total.toNumber(),
        pending: stats._pending.toNumber(),
        forBuyer: stats._forBuyer.toNumber(),
        forSeller: stats._forSeller.toNumber(),
      });
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Resolve dispute ──────────────────────────────────
  const handleResolve = async (orderId, refundBuyer) => {
    if (!resolution.trim()) { toast.error("Resolution note required"); return; }

    await sendTx(
      contracts.disputeResolver.resolveDispute(orderId, refundBuyer, resolution.trim()),
      {
        pendingMsg: "Resolving dispute…",
        successMsg: `Dispute resolved — ${refundBuyer ? "Buyer refunded" : "Seller paid"}`,
        onSuccess: () => {
          setResolveModal(null);
          setResolution("");
          fetchData();
        },
      }
    );
  };

  // ── Add arbitrator ───────────────────────────────────
  const handleAddArbitrator = async () => {
    if (!ethers.utils.isAddress(newArbitrator)) { toast.error("Invalid address"); return; }
    await sendTx(
      contracts.disputeResolver.addArbitrator(newArbitrator),
      {
        pendingMsg: "Adding arbitrator…",
        successMsg: "Arbitrator added!",
        onSuccess: () => setNewArbitrator(""),
      }
    );
  };

  const STATUS_LABELS = ["Pending", "Under Review", "Resolved", "Escalated"];
  const STATUS_COLORS = ["text-warning", "text-primary-400", "text-success", "text-danger"];

  const pieData = [
    { name: "For Buyer",  value: disputeStats.forBuyer,  color: "#06b6d4" },
    { name: "For Seller", value: disputeStats.forSeller, color: "#7c3aed" },
    { name: "Pending",    value: disputeStats.pending,   color: "#f59e0b" },
  ];

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Shield size={48} className="text-ink-muted" />
        <p className="text-ink-secondary">Connect wallet to access admin panel</p>
        <button onClick={connect} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  if (!isAdmin && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Shield size={48} className="text-danger" />
        <h2 className="font-display font-bold text-xl text-white">Access Denied</h2>
        <p className="text-ink-secondary">Only the contract owner can access this panel</p>
      </div>
    );
  }

  const statCards = [
    { icon: <DollarSign size={20} />, label: "Total Volume",    value: analytics ? `${formatKITE(analytics.vol, 2)} KITE` : "…",   color: "text-accent-400" },
    { icon: <Package size={20} />,    label: "Total Orders",    value: analytics?.orders || "…",   color: "text-primary-400" },
    { icon: <TrendingUp size={20} />, label: "Fees Collected",  value: analytics ? `${formatKITE(analytics.fees, 4)} KITE` : "…",  color: "text-success" },
    { icon: <Zap size={20} />,        label: "Escrow Balance",  value: analytics ? `${formatKITE(analytics.escrowBal, 4)} KITE` : "…", color: "text-warning" },
  ];

  return (
    <>
      <Head><title>Admin Panel – TrustMart</title></Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
              <Shield size={20} className="text-warning" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Admin Panel</h1>
              <p className="text-xs text-ink-muted">TrustMart Platform Administration</p>
            </div>
          </div>
          <button onClick={fetchData} className="btn-ghost p-2 rounded-lg">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="card p-5 border-border">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <div className={`font-display font-bold text-xl ${s.color}`}>{s.value}</div>
              <div className="text-xs text-ink-muted mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Dispute stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Pie chart */}
          <div className="card p-5 border-border">
            <h3 className="font-semibold text-sm text-white mb-4">Dispute Outcomes</h3>
            {disputeStats.total > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0e0e1f", border: "1px solid #1a1a38", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-ink-muted text-sm">
                No disputes yet
              </div>
            )}
            <div className="flex gap-4 justify-center mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-ink-secondary">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                  {d.name}: <strong className="text-white">{d.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="card p-5 border-border space-y-4">
            <h3 className="font-semibold text-sm text-white">Dispute Overview</h3>
            {[
              { label: "Total Disputes",     value: disputeStats.total,    color: "text-white" },
              { label: "Pending Review",     value: disputeStats.pending,  color: "text-warning" },
              { label: "Resolved for Buyer", value: disputeStats.forBuyer, color: "text-accent-400" },
              { label: "Resolved for Seller",value: disputeStats.forSeller,color: "text-primary-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-ink-secondary">{item.label}</span>
                <span className={`font-bold text-lg font-mono ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {["disputes", "arbitrators"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab ? "text-white border-primary-600" : "text-ink-secondary border-transparent hover:text-white"
              }`}>
              {tab === "disputes" ? `Disputes (${disputes.length})` : "Arbitrator Management"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : activeTab === "disputes" ? (

          /* ── Disputes Tab ─────────────────────── */
          <div>
            {disputes.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle size={40} className="text-ink-muted mx-auto mb-4" />
                <p className="text-ink-secondary">No disputes on record</p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((d, i) => {
                  const statusNum = bnToNumber(d.status);
                  const isPending = statusNum === 0;
                  return (
                    <motion.div key={d.orderId?.toString()} initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="card p-5 border-border">

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs text-ink-muted">Order #{d.orderId?.toString()}</span>
                            <span className={`badge text-[10px] ${
                              isPending ? "badge-warning" :
                              statusNum === 1 ? "badge-primary" :
                              statusNum === 2 ? "badge-success" : "badge-danger"
                            }`}>
                              {STATUS_LABELS[statusNum] || "Unknown"}
                            </span>
                          </div>
                          <p className="text-sm text-ink-primary mb-2">"{d.reason}"</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-ink-muted">
                            <span>Buyer: <span className="text-white font-mono">{shortAddress(d.buyer?.toString() || "")}</span></span>
                            <span>Seller: <span className="text-white font-mono">{shortAddress(d.seller?.toString() || "")}</span></span>
                          </div>
                          {statusNum === 2 && (
                            <p className="text-xs text-ink-secondary mt-2 italic">
                              Resolution: "{d.resolution}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {(isPending || statusNum === 1) && (
                          <button
                            onClick={() => { setResolveModal(d.orderId?.toString()); setResolution(""); }}
                            className="btn-primary text-xs py-2 px-4 whitespace-nowrap flex-shrink-0"
                          >
                            <Shield size={13} /> Resolve
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        ) : (

          /* ── Arbitrators Tab ──────────────────── */
          <div className="max-w-lg">
            <div className="card p-5 border-border mb-4">
              <h3 className="font-semibold text-sm text-white mb-3">Add Arbitrator</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x… wallet address"
                  value={newArbitrator}
                  onChange={(e) => setNewArbitrator(e.target.value)}
                  className="input flex-1 text-sm font-mono"
                />
                <button onClick={handleAddArbitrator} className="btn-primary text-sm py-2 px-4">
                  <UserPlus size={14} /> Add
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-2">
                Arbitrators can review evidence and resolve disputes.
              </p>
            </div>

            <div className="card p-4 border-border text-sm text-ink-secondary">
              <p>Contract addresses:</p>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {Object.entries({
                  DisputeResolver: contracts?.disputeResolver?.address,
                  EscrowOrder: contracts?.escrowOrder?.address,
                }).map(([name, addr]) => addr && (
                  <li key={name} className="flex items-center gap-2">
                    <span className="text-ink-muted">{name}:</span>
                    <a href={`${EXPLORER_URL}/address/${addr}`} target="_blank" rel="noreferrer"
                      className="text-accent-400 hover:underline flex items-center gap-1">
                      {shortAddress(addr)} <ExternalLink size={10} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ── Resolve Modal ────────────────────────────────── */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="card border-border w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
                <Shield size={18} className="text-warning" />
              </div>
              <div>
                <h3 className="font-bold text-white">Resolve Dispute</h3>
                <p className="text-xs text-ink-muted">Order #{resolveModal}</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="input-label">Resolution Note *</label>
              <textarea value={resolution} onChange={(e) => setResolution(e.target.value)}
                placeholder="Explain your decision…"
                rows={3} maxLength={1000} className="input resize-none" />
            </div>

            <p className="text-xs text-ink-secondary mb-4">
              Choose who wins. This action is <strong className="text-white">irreversible</strong>.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleResolve(resolveModal, true)}
                className="py-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm font-semibold hover:bg-accent-500/20 transition-all">
                Refund Buyer
              </button>
              <button onClick={() => handleResolve(resolveModal, false)}
                className="py-3 rounded-xl bg-primary-700/10 border border-primary-700/20 text-primary-400 text-sm font-semibold hover:bg-primary-700/20 transition-all">
                Pay Seller
              </button>
            </div>

            <button onClick={() => setResolveModal(null)} className="btn-ghost w-full mt-3 text-sm">
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
