import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import {
  ShoppingCart, Shield, Star, Package, Truck, Clock,
  ArrowLeft, ExternalLink, AlertTriangle, CheckCircle, Zap, User
} from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import {
  formatKITEPrice, getCategoryLabel, getCategoryEmoji,
  getImageUrl, formatDate, shortAddress, explorerAddressLink,
  formatRating, getOrderStatus, bnToNumber,
} from "../../utils/helpers";
import { EXPLORER_URL } from "../../config/chain";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { account, contracts, sendTx, isCorrectNetwork, connect } = useWallet();

  const [product,   setProduct]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [quantity,  setQuantity]  = useState(1);
  const [buying,    setBuying]    = useState(false);
  const [notes,     setNotes]     = useState("");
  const [reviews,   setReviews]   = useState([]);
  const [sellerRep, setSellerRep] = useState(null);
  const [txHash,    setTxHash]    = useState(null);
  const [activeTab, setActiveTab] = useState("description");

  // ── Fetch product ─────────────────────────────────────
  const fetchProduct = useCallback(async () => {
    if (!id || !contracts?.productRegistry) return;
    try {
      setLoading(true);
      const p = await contracts.productRegistry.getProduct(id);
      setProduct(p);

      // Fetch seller reputation
      if (contracts.reputationSystem) {
        try {
          const rep = await contracts.reputationSystem.getSellerReputation(p.seller);
          setSellerRep({
            avgRating:     bnToNumber(rep.avgRating),
            reviewCount:   bnToNumber(rep.reviewCount),
            completedSales: bnToNumber(rep.completedSales),
            badgeLevel:    bnToNumber(rep.badgeLevel),
          });
        } catch {}
      }

      // Fetch product reviews
      if (contracts.reputationSystem) {
        try {
          const reviewIds = await contracts.reputationSystem.getProductReviewIds(id);
          const reviewData = await Promise.all(
            reviewIds.slice(-5).map((rid) => contracts.reputationSystem.getReview(rid))
          );
          setReviews(reviewData.reverse());
        } catch {}
      }
    } catch (err) {
      console.error("Product fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [id, contracts]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  // ── Buy now ───────────────────────────────────────────
  const handleBuy = async () => {
    if (!account) { connect(); return; }
    if (!isCorrectNetwork) { alert("Please switch to Kite Chain first."); return; }
    if (!contracts?.escrowOrder) return;

    setBuying(true);
    try {
      const totalAmount = ethers.BigNumber.from(product.price).mul(quantity);

      const receipt = await sendTx(
        contracts.escrowOrder.createOrder(id, quantity, notes, { value: totalAmount }),
        {
          pendingMsg: "Creating escrow order…",
          successMsg: `Order created! ${quantity} × ${product.name} secured in escrow.`,
          onSuccess: (r) => {
            const event = r.events?.find((e) => e.event === "OrderCreated");
            const orderId = event?.args?.orderId?.toString();
            if (orderId) {
              setTxHash(r.transactionHash);
              setTimeout(() => router.push("/buyer/dashboard"), 2000);
            }
          },
        }
      );
    } catch (err) {
      console.error("Buy failed:", err);
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-5 w-1/2 rounded" />
            <div className="skeleton h-12 w-1/3 rounded" />
            <div className="skeleton h-32 rounded-xl" />
            <div className="skeleton h-12 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Package size={48} className="text-ink-muted mb-4" />
        <h2 className="font-display font-bold text-xl text-white mb-2">Product not found</h2>
        <Link href="/" className="btn-primary mt-4 text-sm">← Back to Marketplace</Link>
      </div>
    );
  }

  const stock    = product ? bnToNumber(product.stock) : 0;
  const isSeller = account?.toLowerCase() === product?.seller?.toLowerCase();
  const canBuy   = stock > 0 && !isSeller && product?.isActive;
  const totalCost = product ? ethers.BigNumber.from(product.price).mul(quantity) : ethers.BigNumber.from(0);
  const platformFee = totalCost.mul(250).div(10000);
  const { display: avgRating, stars } = formatRating(
    sellerRep?.avgRating || 0, sellerRep?.reviewCount || 0
  );

  const BADGE_NAMES = ["", "🥉 Bronze", "🥈 Silver", "🥇 Gold", "💎 Platinum"];

  return (
    <>
      <Head>
        <title>{product?.name || "Product"} – TrustMart</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-ink-muted mb-8">
          <Link href="/" className="hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft size={14} />
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-ink-secondary">{getCategoryLabel(product?.category)}</span>
          <span>/</span>
          <span className="text-ink-primary truncate max-w-xs">{product?.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ── Product Image ──────────────────────── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative rounded-2xl overflow-hidden bg-surface border border-border aspect-square max-h-[480px]">
              <img
                src={getImageUrl(product?.imageUrl)}
                alt={product?.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = `https://picsum.photos/seed/${id}/600/600`; }}
              />
              <div className="absolute top-4 left-4">
                <span className="glass px-3 py-1.5 rounded-full text-sm font-medium text-white">
                  {getCategoryEmoji(product?.category)} {getCategoryLabel(product?.category)}
                </span>
              </div>
              {stock === 0 && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="font-display font-bold text-xl text-white">OUT OF STOCK</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Product Info + Buy ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-5"
          >
            {/* Name */}
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-white leading-tight mb-3">
                {product?.name}
              </h1>

              {/* Rating */}
              {(sellerRep?.reviewCount || 0) > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={14}
                        className={s <= Math.round(stars) ? "text-warning fill-warning" : "text-ink-muted"} />
                    ))}
                  </div>
                  <span className="text-sm text-ink-secondary">
                    {avgRating} ({sellerRep?.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="card p-5 border-border">
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display font-bold text-3xl text-white">
                  {formatKITEPrice(product?.price)}
                </span>
                <span className="text-ink-muted text-sm mb-1">per unit</span>
              </div>
              <div className="flex items-center gap-2">
                {stock > 0 ? (
                  <span className="badge-success text-xs">✓ In Stock ({stock} available)</span>
                ) : (
                  <span className="badge-danger text-xs">Out of Stock</span>
                )}
                {stock > 0 && stock <= 5 && (
                  <span className="badge-warning text-xs">Only {stock} left!</span>
                )}
              </div>
            </div>

            {/* Seller */}
            <div className="card p-4 border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-700 to-accent-500 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {shortAddress(product?.seller?.toString() || "")}
                      </span>
                      {sellerRep?.badgeLevel > 0 && (
                        <span className="badge-warning text-[10px]">
                          {BADGE_NAMES[sellerRep.badgeLevel]}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-ink-muted">
                      {sellerRep?.completedSales || 0} sales
                    </span>
                  </div>
                </div>
                <a href={explorerAddressLink(product?.seller?.toString())} target="_blank" rel="noreferrer"
                  className="btn-ghost text-xs px-2 py-1">
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Quantity + Notes */}
            {canBuy && (
              <div className="space-y-3">
                <div>
                  <label className="input-label">Quantity</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-surface border border-border hover:border-rim text-white font-bold transition-all">
                      −
                    </button>
                    <span className="w-12 text-center font-mono font-semibold text-white text-lg">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                      className="w-10 h-10 rounded-lg bg-surface border border-border hover:border-rim text-white font-bold transition-all">
                      +
                    </button>
                    <span className="text-sm text-ink-muted ml-2">of {stock} available</span>
                  </div>
                </div>
                <div>
                  <label className="input-label">Notes to seller <span className="text-ink-muted font-normal">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="Size, color, special instructions…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input text-sm"
                    maxLength={300}
                  />
                </div>
              </div>
            )}

            {/* Order summary */}
            {canBuy && quantity > 1 && (
              <div className="card p-4 border-border bg-gradient-card text-sm space-y-2">
                <div className="flex justify-between text-ink-secondary">
                  <span>{quantity} × {formatKITEPrice(product?.price)}</span>
                  <span>{ethers.utils.formatEther(totalCost)} KITE</span>
                </div>
                <div className="flex justify-between text-ink-secondary">
                  <span>Platform fee (2.5%)</span>
                  <span>{ethers.utils.formatEther(platformFee)} KITE</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-white">
                  <span>Total (locked in escrow)</span>
                  <span className="text-accent-400">{ethers.utils.formatEther(totalCost)} KITE</span>
                </div>
              </div>
            )}

            {/* Buy button */}
            {!account ? (
              <button onClick={connect} className="btn-primary w-full text-base py-4">
                <Zap size={18} /> Connect Wallet to Buy
              </button>
            ) : !isCorrectNetwork ? (
              <div className="card p-4 border-danger/20 bg-danger/5 text-danger text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> Switch to Kite Chain to buy
              </div>
            ) : isSeller ? (
              <div className="card p-4 border-border text-center text-ink-secondary text-sm">
                This is your product listing
              </div>
            ) : stock === 0 ? (
              <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed py-4">
                Out of Stock
              </button>
            ) : txHash ? (
              <div className="card p-4 border-success/20 bg-success/10 flex items-center gap-3">
                <CheckCircle size={20} className="text-success flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Order placed! Redirecting…</p>
                  <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noreferrer"
                    className="text-xs text-accent-400 flex items-center gap-1">
                    View transaction <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleBuy}
                disabled={buying}
                className="btn-primary w-full text-base py-4 disabled:opacity-70"
              >
                {buying ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : (
                  <><ShoppingCart size={18} /> Buy Now · {formatKITEPrice(totalCost)}</>
                )}
              </motion.button>
            )}

            {/* Escrow info */}
            <div className="flex items-start gap-2 text-xs text-ink-muted">
              <Shield size={13} className="text-primary-400 mt-0.5 flex-shrink-0" />
              <span>
                Payment is <strong className="text-ink-secondary">locked in smart contract escrow</strong>.
                Funds are only released when you confirm delivery. Disputes are resolved by TrustMart arbitrators.
              </span>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: <Shield size={14} />,  label: "Escrow Protected" },
                { icon: <Truck size={14} />,   label: "Tracked Shipping" },
                { icon: <Clock size={14} />,   label: "7-Day Guarantee" },
              ].map((g) => (
                <div key={g.label} className="card p-3 text-center border-border">
                  <div className="text-accent-400 flex justify-center mb-1">{g.icon}</div>
                  <div className="text-[10px] text-ink-muted">{g.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Tabs ───────────────────────────────────────── */}
        <div className="mt-12">
          <div className="flex gap-1 border-b border-border mb-6">
            {["description", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? "text-white border-primary-600"
                    : "text-ink-secondary border-transparent hover:text-white"
                }`}
              >
                {tab} {tab === "reviews" && `(${reviews.length})`}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
              <p className="text-ink-secondary leading-relaxed">
                {product?.description || "No description provided."}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="card p-4 border-border">
                  <div className="text-xs text-ink-muted mb-1">Product ID</div>
                  <div className="font-mono text-sm text-ink-primary">#{id}</div>
                </div>
                <div className="card p-4 border-border">
                  <div className="text-xs text-ink-muted mb-1">Listed on</div>
                  <div className="text-sm text-ink-primary">
                    {formatDate(product?.createdAt ? bnToNumber(product.createdAt) : 0)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-ink-muted">
                  <Star size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No reviews yet. Be the first buyer!</p>
                </div>
              ) : (
                reviews.map((review, i) => (
                  <div key={i} className="card p-4 border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={13}
                            className={s <= review.rating ? "text-warning fill-warning" : "text-ink-muted"} />
                        ))}
                      </div>
                      <span className="text-xs text-ink-muted">
                        {shortAddress(review.buyer?.toString() || "")}
                      </span>
                    </div>
                    <p className="text-sm text-ink-secondary">{review.comment}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <CheckCircle size={11} className="text-success" />
                      <span className="text-[10px] text-ink-muted">Verified Purchase</span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
