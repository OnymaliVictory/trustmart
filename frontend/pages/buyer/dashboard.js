import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import {
  Package, CheckCircle, AlertCircle, Truck, Clock,
  Star, Brain, Upload, ExternalLink, RefreshCw, Image, ShieldAlert
} from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import {
  formatKITEPrice, shortAddress, formatDate,
  bnToNumber, explorerTxLink
} from "../../utils/helpers";
import { EXPLORER_URL } from "../../config/chain";
import { SHIPPING_TIMEOUT_DAYS } from "../../config/contracts";
import AttestationTrail from "../../components/AttestationTrail";
import toast from "react-hot-toast";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";

export default function BuyerDashboard() {
  const { account, contracts, sendTx, isCorrectNetwork, connect } = useWallet();

  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [products,      setProducts]      = useState({});
  const [activeFilter,  setActiveFilter]  = useState("all");
  const [reviewModal,   setReviewModal]   = useState(null);
  const [disputeModal,  setDisputeModal]  = useState(null);
  const [proofModal,    setProofModal]    = useState(null);
  const [reviewForm,    setReviewForm]    = useState({ rating: 5, comment: "" });
  const [disputeReason, setDisputeReason] = useState("");
  const [proofUrl,      setProofUrl]      = useState("");
  const [proofFile,     setProofFile]     = useState(null);
  const [aiAnalyzing,   setAiAnalyzing]   = useState(false);
  const [aiResult,      setAiResult]      = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // ── Fetch orders ─────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!account || !contracts?.escrowOrder) return;
    setLoading(true);
    try {
      const ids  = await contracts.escrowOrder.getBuyerOrders(account);
      const data = await Promise.all(ids.map((id) => contracts.escrowOrder.getOrder(id)));
      const sorted = data.reverse();
      setOrders(sorted);

      if (contracts.productRegistry) {
        const pids = [...new Set(sorted.map((o) => o.productId.toString()))];
        const pData = {};
        await Promise.all(pids.map(async (pid) => {
          try { pData[pid] = await contracts.productRegistry.getProduct(pid); } catch {}
        }));
        setProducts(pData);
      }
    } catch (err) {
      console.error("Order fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [account, contracts]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Actions ───────────────────────────────────────────
  const handleConfirmDelivery = async (orderId) => {
    await sendTx(contracts.escrowOrder.confirmDelivery(orderId), {
      pendingMsg: "Confirming delivery…",
      successMsg: "Delivery confirmed! Funds released to seller.",
      onSuccess:  fetchOrders,
    });
  };

  const handleCancel = async (orderId) => {
    if (!confirm("Cancel this order? Your KITE will be refunded.")) return;
    await sendTx(contracts.escrowOrder.cancelOrder(orderId), {
      pendingMsg: "Cancelling order…",
      successMsg: "Order cancelled. Refund incoming!",
      onSuccess:  fetchOrders,
    });
  };

  const handleAutoRefund = async (orderId) => {
    await sendTx(contracts.escrowOrder.autoRefund(orderId), {
      pendingMsg: "Requesting auto-refund…",
      successMsg: "Auto-refund triggered! KITE returned.",
      onSuccess:  fetchOrders,
    });
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) { toast.error("Please provide a reason"); return; }
    await sendTx(contracts.escrowOrder.raiseDispute(disputeModal, disputeReason.trim()), {
      pendingMsg: "Raising dispute…",
      successMsg: "Dispute raised — our AI agent will review shortly.",
      onSuccess:  () => { setDisputeModal(null); setDisputeReason(""); fetchOrders(); },
    });
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) { toast.error("Please write a comment"); return; }
    if (!contracts?.reputationSystem) { toast.error("Reputation contract not connected"); return; }
    await sendTx(
      contracts.reputationSystem.submitReview(reviewModal, reviewForm.rating, reviewForm.comment.trim()),
      {
        pendingMsg: "Submitting review…",
        successMsg: "Review submitted! Thank you.",
        onSuccess:  () => { setReviewModal(null); setReviewForm({ rating: 5, comment: "" }); },
      }
    );
  };

  // ── AI Delivery Verification ──────────────────────────
  const handleAIVerify = async () => {
    if (!proofUrl.trim() && !proofFile) {
      toast.error("Please provide an image URL or upload a photo");
      return;
    }
    setAiAnalyzing(true);
    setAiResult(null);

    try {
      const order   = orders.find((o) => o.id?.toString() === proofModal?.toString());
      const product = products[order?.productId?.toString()];

      let imageUrl = proofUrl.trim();

      // If file uploaded, convert to base64 data URL (for demo)
      if (proofFile && !imageUrl) {
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(proofFile);
        });
      }

      const res = await fetch(`${AGENT_URL}/api/verify-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:   proofModal,
          imageUrl,
          orderData: {
            productName: product?.name || "Unknown product",
            amount:      ethers.utils.formatEther(order?.amount || "0"),
            notes:       order?.notes || "",
          },
        }),
      });

      const data = await res.json();
      setAiResult(data);

      if (data.autoReleased) {
        toast.success("🤖 AI verified delivery & auto-released funds!");
        setTimeout(fetchOrders, 2000);
      } else if (data.analysis?.decision === "APPROVED") {
        toast.success("✅ AI verified delivery — please confirm in dashboard");
      } else {
        toast.error("⚠️ AI could not verify — " + (data.analysis?.reason || ""));
      }
    } catch (err) {
      toast.error("Agent not running — start it with: cd agent && npm start");
      console.error(err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ── Filters ──────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    const s = bnToNumber(o.status);
    if (activeFilter === "active")    return [0, 1].includes(s);
    if (activeFilter === "completed") return [2, 5].includes(s);
    if (activeFilter === "disputes")  return [3, 4, 6].includes(s);
    return true;
  });

  const STATUS_CFG = {
    0: { label: "Awaiting Shipment", badge: "badge-primary",  actions: ["cancel", "dispute", "ai-verify"] },
    1: { label: "Shipped",           badge: "badge-warning",  actions: ["confirm", "dispute", "ai-verify"] },
    2: { label: "Delivered",         badge: "badge-success",  actions: ["review"] },
    3: { label: "Disputed",          badge: "badge-danger",   actions: [] },
    4: { label: "Refunded",          badge: "badge-cyan",     actions: [] },
    5: { label: "Completed",         badge: "badge-success",  actions: ["review"] },
    6: { label: "Cancelled",         badge: "badge-muted",    actions: [] },
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Package size={48} className="text-ink-muted" />
        <h2 className="font-display font-bold text-2xl text-white">My Orders</h2>
        <p className="text-ink-secondary">Connect your wallet to view orders</p>
        <button onClick={connect} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  return (
    <>
      <Head><title>My Orders – TrustMart</title></Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">My Orders</h1>
            <p className="text-ink-secondary text-sm mt-1">{orders.length} total orders</p>
          </div>
          <button onClick={fetchOrders} className="btn-ghost p-2 rounded-lg" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {[
            { id: "all",       label: "All" },
            { id: "active",    label: "Active" },
            { id: "completed", label: "Completed" },
            { id: "disputes",  label: "Disputes" },
          ].map((f) => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeFilter === f.id ? "bg-primary-700 text-white" : "bg-surface border border-border text-ink-secondary hover:border-rim"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="text-ink-muted mx-auto mb-4" />
            <p className="text-ink-secondary mb-4">No orders yet</p>
            <Link href="/" className="btn-primary text-sm">Browse Marketplace</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, i) => {
              const statusNum = bnToNumber(order.status);
              const st        = STATUS_CFG[statusNum] || { label: "Unknown", badge: "badge-muted", actions: [] };
              const product   = products[order.productId?.toString()];
              const createdTs = bnToNumber(order.createdAt);
              const canAutoRefund = statusNum === 0 && createdTs > 0 &&
                Date.now() / 1000 >= createdTs + SHIPPING_TIMEOUT_DAYS * 86400;
              const isExpanded = expandedOrder === order.id?.toString();

              return (
                <motion.div key={order.id?.toString()} initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card border-border overflow-hidden">

                  {/* Status stripe */}
                  <div className={`h-0.5 w-full ${
                    statusNum === 5 || statusNum === 2 ? "bg-success" :
                    statusNum === 3 ? "bg-danger" : statusNum === 1 ? "bg-warning" : "bg-primary-700"
                  }`} />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {product?.imageUrl && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={product.imageUrl} alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = "https://picsum.photos/seed/order/100/100"; }} />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-white">
                              {product?.name ? product.name.slice(0, 45) + (product.name.length > 45 ? "…" : "") : `Order #${order.id?.toString()}`}
                            </span>
                            <span className={`${st.badge} text-[10px]`}>{st.label}</span>
                            {bnToNumber(order.id) > 0 && orders.find(o => o.id?.toString() === order.id?.toString() && true)?.agentVerified && (
                              <span className="badge-success text-[10px]">🤖 AI Verified</span>
                            )}
                          </div>
                          <div className="text-xs text-ink-muted mt-0.5">
                            Order #{order.id?.toString()} · {formatDate(createdTs)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base text-white">{formatKITEPrice(order.amount)}</div>
                        <div className="text-xs text-ink-muted">Qty: {order.quantity?.toString()}</div>
                      </div>
                    </div>

                    {/* Seller + tracking */}
                    <div className="text-xs text-ink-muted mb-3">
                      Seller: <span className="text-white font-mono">{shortAddress(order.seller?.toString() || "")}</span>
                    </div>
                    {order.trackingInfo && (
                      <div className="flex items-center gap-2 text-xs bg-surface/60 px-3 py-2 rounded-lg mb-3">
                        <Truck size={12} className="text-warning" />
                        <span className="text-ink-secondary">Tracking: </span>
                        <span className="text-white font-mono">{order.trackingInfo}</span>
                      </div>
                    )}
                    {canAutoRefund && (
                      <div className="flex items-center gap-2 text-xs bg-warning/10 border border-warning/20 px-3 py-2 rounded-lg mb-3">
                        <AlertCircle size={12} className="text-warning" />
                        <span className="text-warning">Seller hasn't shipped in 7 days — you can claim a refund</span>
                      </div>
                    )}
                    {statusNum === 3 && (
                      <div className="flex items-center gap-2 text-xs bg-danger/10 border border-danger/20 px-3 py-2 rounded-lg mb-3">
                        <ShieldAlert size={12} className="text-danger" />
                        <span className="text-danger">Dispute in progress — AI agent is reviewing</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {st.actions.includes("confirm") && (
                        <button onClick={() => handleConfirmDelivery(order.id)} className="btn-primary text-xs py-2 px-4">
                          <CheckCircle size={13} /> Confirm Delivery
                        </button>
                      )}
                      {st.actions.includes("ai-verify") && (
                        <button onClick={() => { setProofModal(order.id?.toString()); setAiResult(null); setProofUrl(""); setProofFile(null); }}
                          className="btn-secondary text-xs py-2 px-4 border-primary-700/30 text-primary-400 hover:bg-primary-700/10">
                          <Brain size={13} /> AI Verify Delivery
                        </button>
                      )}
                      {st.actions.includes("dispute") && (
                        <button onClick={() => setDisputeModal(order.id?.toString())} className="btn-danger text-xs py-2 px-4">
                          <AlertCircle size={13} /> Raise Dispute
                        </button>
                      )}
                      {st.actions.includes("cancel") && !canAutoRefund && (
                        <button onClick={() => handleCancel(order.id)}
                          className="text-xs py-2 px-4 rounded-xl border border-danger/20 text-danger hover:bg-danger/10 transition-all">
                          Cancel
                        </button>
                      )}
                      {canAutoRefund && (
                        <button onClick={() => handleAutoRefund(order.id)} className="btn-danger text-xs py-2 px-4">
                          Claim Auto-Refund
                        </button>
                      )}
                      {st.actions.includes("review") && (
                        <button onClick={() => setReviewModal(order.id?.toString())} className="btn-secondary text-xs py-2 px-4">
                          <Star size={13} /> Leave Review
                        </button>
                      )}

                      {/* Attestation Trail toggle */}
                      <button onClick={() => setExpandedOrder(isExpanded ? null : order.id?.toString())}
                        className="btn-ghost text-xs py-2 px-3 border border-border rounded-lg">
                        <Brain size={12} /> AI Trail
                      </button>
                    </div>

                    {/* Attestation trail (expandable) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                          <div className="border-t border-border pt-4">
                            <p className="text-xs font-semibold text-ink-secondary mb-2 flex items-center gap-1.5">
                              <Brain size={12} /> AI Attestation Trail
                            </p>
                            <AttestationTrail orderId={order.id?.toString()} agentUrl={AGENT_URL} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── AI Verify Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {proofModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} className="card border-border w-full max-w-md p-6">

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary-700/20 border border-primary-700/30 flex items-center justify-center">
                  <Brain size={20} className="text-primary-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI Delivery Verification</h3>
                  <p className="text-xs text-ink-muted">Order #{proofModal} · Powered by Claude</p>
                </div>
              </div>

              <div className="card p-3 border-primary-700/20 bg-primary-700/5 text-xs text-primary-400 mb-5">
                Upload delivery proof — the AI agent will analyze it and may automatically release escrow funds.
              </div>

              {/* Image URL input */}
              <div className="mb-4">
                <label className="input-label">Delivery Photo URL</label>
                <div className="flex gap-2">
                  <input type="url" value={proofUrl} onChange={(e) => { setProofUrl(e.target.value); setProofFile(null); }}
                    placeholder="https://… (Imgur, Cloudinary, etc.)" className="input flex-1 text-sm" />
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-ink-muted">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* File upload */}
              <div className="mb-5">
                <label className="input-label">Upload Photo</label>
                <label className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  proofFile ? "border-primary-600 bg-primary-700/10" : "border-border hover:border-rim"
                }`}>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { setProofFile(e.target.files[0]); setProofUrl(""); }} />
                  {proofFile ? (
                    <div className="text-center">
                      <Image size={20} className="text-primary-400 mx-auto mb-1" />
                      <span className="text-xs text-primary-400">{proofFile.name}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload size={20} className="text-ink-muted mx-auto mb-1" />
                      <span className="text-xs text-ink-muted">Click to upload delivery photo</span>
                    </div>
                  )}
                </label>
              </div>

              {/* AI Result */}
              <AnimatePresence>
                {aiResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`card p-4 mb-4 border ${
                      aiResult.analysis?.decision === "APPROVED"
                        ? "border-success/20 bg-success/5"
                        : "border-danger/20 bg-danger/5"
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {aiResult.analysis?.decision === "APPROVED"
                        ? <CheckCircle size={16} className="text-success" />
                        : <AlertCircle size={16} className="text-danger" />}
                      <span className="text-sm font-semibold text-white">
                        {aiResult.analysis?.decision} ({aiResult.analysis?.confidence}% confidence)
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary">{aiResult.analysis?.reason}</p>
                    {aiResult.autoReleased && (
                      <p className="text-xs text-success mt-2 font-semibold">
                        ⚡ Funds auto-released by AI agent!
                      </p>
                    )}
                    {aiResult.attestation && (
                      <p className="text-[10px] text-ink-muted mt-2">
                        Attestation #{aiResult.attestation.attestationId} written on Kite Chain
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <button onClick={handleAIVerify} disabled={aiAnalyzing || (!proofUrl.trim() && !proofFile)}
                  className="btn-primary flex-1 disabled:opacity-60">
                  {aiAnalyzing
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing…</>
                    : <><Brain size={15} /> Verify with AI</>}
                </button>
                <button onClick={() => { setProofModal(null); setAiResult(null); }}
                  className="btn-secondary px-5">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Review Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="card border-border w-full max-w-md p-6">
              <h3 className="font-bold text-xl text-white mb-1">Leave a Review</h3>
              <p className="text-sm text-ink-muted mb-5">Order #{reviewModal}</p>
              <div className="mb-4">
                <label className="input-label">Rating</label>
                <div className="flex gap-2 mt-1">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} onClick={() => setReviewForm((p) => ({ ...p, rating: s }))}
                      className="transition-transform hover:scale-110">
                      <Star size={28} className={s <= reviewForm.rating ? "text-warning fill-warning" : "text-ink-muted"} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <label className="input-label">Your Review</label>
                <textarea value={reviewForm.comment}
                  onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="How was your experience?" rows={3} maxLength={500} className="input resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSubmitReview} className="btn-primary flex-1"><Star size={15} /> Submit</button>
                <button onClick={() => setReviewModal(null)} className="btn-secondary px-5">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dispute Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {disputeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="card border-border w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain size={20} className="text-primary-400" />
                <div>
                  <h3 className="font-bold text-white">Raise a Dispute</h3>
                  <p className="text-xs text-ink-muted">AI agent will arbitrate this automatically</p>
                </div>
              </div>
              <div className="card p-3 border-warning/20 bg-warning/5 text-xs text-warning flex gap-2 mb-5">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                Our AI agent will review the evidence from both sides and make a binding decision on-chain.
              </div>
              <div className="mb-5">
                <label className="input-label">Reason *</label>
                <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Item not received, damaged, not as described…"
                  rows={4} maxLength={500} className="input resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleRaiseDispute} className="btn-danger flex-1"><AlertCircle size={15} /> Submit</button>
                <button onClick={() => setDisputeModal(null)} className="btn-secondary px-5">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
