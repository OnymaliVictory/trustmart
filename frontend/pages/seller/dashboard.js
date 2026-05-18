import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import {
  Plus, Package, TrendingUp, DollarSign, Eye, EyeOff,
  Truck, AlertCircle, CheckCircle, Clock, BarChart2, Star, ExternalLink
} from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import {
  formatKITEPrice, formatKITE, getOrderStatus,
  getStatusBadgeClass, shortAddress, formatDate,
  getCategoryLabel, bnToNumber, explorerTxLink, truncate
} from "../../utils/helpers";
import { ORDER_STATUS, EXPLORER_URL } from "../../config/contracts";
import toast from "react-hot-toast";

export default function SellerDashboard() {
  const { account, contracts, sendTx, isCorrectNetwork, connect } = useWallet();

  const [products,     setProducts]     = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("products");
  const [trackingInputs, setTrackingInputs] = useState({});
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [stats, setStats] = useState({ totalEarned: "0", totalOrders: 0, totalProducts: 0, pendingOrders: 0 });

  // ── Fetch seller data ───────────────────────────────
  const fetchData = useCallback(async () => {
    if (!account || !contracts?.productRegistry || !contracts?.escrowOrder) return;
    setLoading(true);
    try {
      // Products
      const productIds = await contracts.productRegistry.getSellerProducts(account);
      const productData = await Promise.all(
        productIds.map((id) => contracts.productRegistry.getProduct(id))
      );
      setProducts(productData.reverse());

      // Orders
      const orderIds = await contracts.escrowOrder.getSellerOrders(account);
      const orderData = await Promise.all(
        orderIds.map((id) => contracts.escrowOrder.getOrder(id))
      );
      const sortedOrders = orderData.reverse();
      setOrders(sortedOrders);

      // Stats
      let totalEarned = ethers.BigNumber.from(0);
      let pendingOrders = 0;
      for (const o of sortedOrders) {
        if (bnToNumber(o.status) === 5) { // Completed
          const fee = ethers.BigNumber.from(o.platformFee);
          const earned = ethers.BigNumber.from(o.amount).sub(fee);
          totalEarned = totalEarned.add(earned);
        }
        if ([0, 1].includes(bnToNumber(o.status))) pendingOrders++;
      }

      setStats({
        totalEarned: ethers.utils.formatEther(totalEarned),
        totalOrders: sortedOrders.length,
        totalProducts: productData.length,
        pendingOrders,
      });
    } catch (err) {
      console.error("Seller fetch error:", err);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [account, contracts]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Mark shipped ────────────────────────────────────
  const handleMarkShipped = async (orderId) => {
    const tracking = trackingInputs[orderId]?.trim();
    if (!tracking) { toast.error("Enter tracking info first"); return; }

    await sendTx(
      contracts.escrowOrder.markShipped(orderId, tracking),
      {
        pendingMsg: "Marking order as shipped…",
        successMsg: "Order marked as shipped!",
        onSuccess: fetchData,
      }
    );
    setShippingOrderId(null);
    setTrackingInputs((prev) => ({ ...prev, [orderId]: "" }));
  };

  // ── Toggle product status ───────────────────────────
  const handleToggleProduct = async (productId, currentStatus) => {
    await sendTx(
      contracts.productRegistry.setProductStatus(productId, !currentStatus),
      {
        pendingMsg: currentStatus ? "Deactivating product…" : "Activating product…",
        successMsg: currentStatus ? "Product deactivated" : "Product activated!",
        onSuccess: fetchData,
      }
    );
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Package size={48} className="text-ink-muted" />
        <h2 className="font-display font-bold text-2xl text-white">Seller Dashboard</h2>
        <p className="text-ink-secondary">Connect your wallet to manage your listings</p>
        <button onClick={connect} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  const statCards = [
    { icon: <DollarSign size={20} />, label: "Total Earned",    value: `${parseFloat(stats.totalEarned).toFixed(4)} KITE`, color: "text-success" },
    { icon: <Package size={20} />,    label: "Total Orders",    value: stats.totalOrders,     color: "text-primary-400" },
    { icon: <BarChart2 size={20} />,  label: "Products Listed", value: stats.totalProducts,   color: "text-accent-400" },
    { icon: <Clock size={20} />,      label: "Pending Action",  value: stats.pendingOrders,   color: "text-warning" },
  ];

  const ORDER_STATUS_LABEL = {
    0: { label: "Awaiting Shipment", color: "badge-primary",  icon: <Clock size={12} /> },
    1: { label: "Shipped",           color: "badge-warning",  icon: <Truck size={12} /> },
    2: { label: "Delivered",         color: "badge-success",  icon: <CheckCircle size={12} /> },
    3: { label: "Disputed",          color: "badge-danger",   icon: <AlertCircle size={12} /> },
    4: { label: "Refunded",          color: "badge-cyan",     icon: <AlertCircle size={12} /> },
    5: { label: "Completed ✓",       color: "badge-success",  icon: <CheckCircle size={12} /> },
    6: { label: "Cancelled",         color: "badge-muted",    icon: <AlertCircle size={12} /> },
  };

  return (
    <>
      <Head><title>Seller Dashboard – TrustMart</title></Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Seller Dashboard</h1>
            <p className="text-ink-secondary mt-1 text-sm">
              {shortAddress(account)} · {stats.totalProducts} listings
            </p>
          </div>
          <Link href="/seller/add-product" className="btn-primary text-sm">
            <Plus size={16} /> List New Product
          </Link>
        </div>

        {/* ── SELLER CONTEXT BANNER ─────────────────────── */}
        <div className="card p-4 border-primary-700/20 bg-primary-700/10 flex items-center gap-3 mb-6 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-primary-700/30 flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-primary-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary-300">👤 Connected as: Seller</p>
            <p className="text-xs text-primary-200/80 mt-0.5">You cannot purchase your own listings. Switch to a buyer wallet to complete a purchase.</p>
          </div>
        </div>

        {/* Network warning */}
        {!isCorrectNetwork && (
          <div className="card p-4 border-warning/20 bg-warning/5 flex items-center gap-3 mb-6">
            <AlertCircle size={18} className="text-warning flex-shrink-0" />
            <span className="text-sm text-warning">Switch to Kite Chain to interact with contracts</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="card p-5 border-border">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <div className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</div>
              <div className="text-xs text-ink-muted mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {["products", "orders"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab ? "text-white border-primary-600" : "text-ink-secondary border-transparent hover:text-white"
              }`}>
              {tab === "products" ? `My Products (${products.length})` : `Orders (${orders.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : activeTab === "products" ? (

          /* ── Products Tab ─────────────────────── */
          <div>
            {products.length === 0 ? (
              <div className="text-center py-16">
                <Package size={40} className="text-ink-muted mx-auto mb-4" />
                <p className="text-ink-secondary mb-4">No products listed yet</p>
                <Link href="/seller/add-product" className="btn-primary text-sm">
                  <Plus size={15} /> List Your First Product
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((p, i) => (
                  <motion.div key={p.id?.toString()} initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`card p-4 border-border flex flex-col sm:flex-row gap-4 ${!p.isActive ? "opacity-60" : ""}`}>

                    {/* Image */}
                    <div className="w-full sm:w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface">
                      <img src={p.imageUrl || `https://picsum.photos/seed/${p.id}/200/200`}
                        alt={p.name} className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = `https://picsum.photos/seed/${p.id}/200/200`; }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm text-white">{truncate(p.name, 50)}</h3>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {getCategoryLabel(p.category)} · #{p.id?.toString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {p.isActive
                            ? <span className="badge-success text-[10px]">Active</span>
                            : <span className="badge-muted text-[10px]">Inactive</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-ink-secondary">
                        <span className="font-semibold text-accent-400">{formatKITEPrice(p.price)}</span>
                        <span>Stock: <strong className="text-white">{p.stock?.toString()}</strong></span>
                        <span>Sold: <strong className="text-white">{p.totalSold?.toString()}</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 items-start sm:items-end">
                      <Link href={`/product/${p.id}`}
                        className="btn-ghost text-xs py-1.5 px-3 border border-border rounded-lg">
                        <Eye size={12} /> View
                      </Link>
                      <button
                        onClick={() => handleToggleProduct(p.id, p.isActive)}
                        className={`text-xs py-1.5 px-3 rounded-lg border transition-all ${
                          p.isActive
                            ? "border-danger/20 text-danger hover:bg-danger/10"
                            : "border-success/20 text-success hover:bg-success/10"
                        }`}>
                        {p.isActive ? <><EyeOff size={12} className="inline mr-1" />Deactivate</> : <><Eye size={12} className="inline mr-1" />Activate</>}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        ) : (

          /* ── Orders Tab ───────────────────────── */
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Truck size={40} className="text-ink-muted mx-auto mb-4" />
                <p className="text-ink-secondary">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order, i) => {
                  const statusNum = bnToNumber(order.status);
                  const st = ORDER_STATUS_LABEL[statusNum] || { label: "Unknown", color: "badge-muted" };
                  const needsShipping = statusNum === 0;

                  return (
                    <motion.div key={order.id?.toString()} initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="card p-5 border-border space-y-3">

                      {/* Order header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-ink-muted">
                              Order #{order.id?.toString()}
                            </span>
                            <span className={`${st.color} text-[10px] flex items-center gap-1`}>
                              {st.icon} {st.label}
                            </span>
                          </div>
                          <div className="text-sm text-ink-secondary">
                            Buyer: <span className="text-white font-mono text-xs">
                              {shortAddress(order.buyer?.toString() || "")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm text-white">
                            {formatKITEPrice(order.amount)}
                          </div>
                          <div className="text-[10px] text-ink-muted">
                            Qty: {order.quantity?.toString()}
                          </div>
                        </div>
                      </div>

                      {/* Tracking info display */}
                      {order.trackingInfo && (
                        <div className="flex items-center gap-2 text-xs bg-surface/60 px-3 py-2 rounded-lg">
                          <Truck size={12} className="text-warning" />
                          <span className="text-ink-secondary">Tracking: </span>
                          <span className="text-white font-mono">{order.trackingInfo}</span>
                        </div>
                      )}

                      {/* Notes from buyer */}
                      {order.notes && (
                        <div className="text-xs text-ink-muted italic bg-surface/60 px-3 py-2 rounded-lg">
                          Buyer note: "{order.notes}"
                        </div>
                      )}

                      {/* Ship action */}
                      {needsShipping && (
                        <AnimatePresence>
                          {shippingOrderId === order.id?.toString() ? (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              className="flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="Tracking number / courier link"
                                value={trackingInputs[order.id?.toString()] || ""}
                                onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [order.id?.toString()]: e.target.value }))}
                                className="input text-sm flex-1 h-10"
                                onKeyDown={(e) => e.key === "Enter" && handleMarkShipped(order.id)}
                              />
                              <button onClick={() => handleMarkShipped(order.id)} className="btn-primary text-sm py-2 px-4">
                                Confirm
                              </button>
                              <button onClick={() => setShippingOrderId(null)} className="btn-secondary text-sm py-2 px-3">
                                Cancel
                              </button>
                            </motion.div>
                          ) : (
                            <button
                              onClick={() => setShippingOrderId(order.id?.toString())}
                              className="btn-primary text-sm py-2 w-full sm:w-auto"
                            >
                              <Truck size={14} /> Mark as Shipped
                            </button>
                          )}
                        </AnimatePresence>
                      )}

                      {/* Escrow amount note */}
                      {statusNum === 5 && (
                        <div className="flex items-center gap-2 text-xs text-success">
                          <CheckCircle size={12} />
                          You received {formatKITE(ethers.BigNumber.from(order.amount).sub(order.platformFee))} KITE
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
