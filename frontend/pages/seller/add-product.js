import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import {
  Package, ImageIcon, DollarSign, Tag, Archive,
  AlertCircle, CheckCircle, Info, ArrowLeft, Zap
} from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { CATEGORIES, LISTING_FEE_KITE } from "../../config/contracts";
import { getImageUrl } from "../../utils/helpers";
import Link from "next/link";

const LISTING_FEE_WEI = ethers.utils.parseEther(String(LISTING_FEE_KITE));

export default function AddProduct() {
  const router = useRouter();
  const { account, contracts, sendTx, isCorrectNetwork, connect } = useWallet();

  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    stock: "",
    category: "0",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImg, setPreviewImg] = useState("");

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (field === "imageUrl") setPreviewImg(e.target.value);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.length > 100)  errs.name = "Name required (max 100 chars)";
    if (!form.description.trim())                      errs.description = "Description required";
    if (form.description.length > 1000)                errs.description = "Max 1000 characters";
    if (!form.imageUrl.trim())                         errs.imageUrl = "Image URL required";
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0)
      errs.price = "Valid price required";
    if (!form.stock || isNaN(form.stock) || parseInt(form.stock) < 1 || parseInt(form.stock) > 10000)
      errs.stock = "Stock must be between 1 and 10,000";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) { connect(); return; }
    if (!validate()) return;
    if (!contracts?.productRegistry) { alert("Contracts not loaded"); return; }

    setSubmitting(true);
    try {
      const priceWei = ethers.utils.parseEther(form.price);
      await sendTx(
        contracts.productRegistry.createProduct(
          form.name.trim(),
          form.description.trim(),
          form.imageUrl.trim(),
          priceWei,
          parseInt(form.stock),
          parseInt(form.category),
          { value: LISTING_FEE_WEI }
        ),
        {
          pendingMsg: "Creating product listing…",
          successMsg: `"${form.name}" listed successfully!`,
          onSuccess: () => {
            setTimeout(() => router.push("/seller/dashboard"), 1500);
          },
        }
      );
    } catch (err) {
      console.error("Listing failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head><title>List a Product – TrustMart</title></Head>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/seller/dashboard" className="btn-ghost text-sm p-2 rounded-lg">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">List a Product</h1>
            <p className="text-ink-secondary text-sm">Fill in the details to create your listing on Kite Chain</p>
          </div>
        </div>

        {/* Listing fee notice */}
        <div className="card p-4 border-primary-700/20 bg-primary-700/5 flex items-start gap-3 mb-6">
          <Info size={18} className="text-primary-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-white font-medium">Listing fee: {LISTING_FEE_KITE} KITE </span>
            <span className="text-ink-secondary">
              — A small fee is charged to prevent spam listings. It goes to the platform treasury.
            </span>
          </div>
        </div>

        {!account ? (
          <div className="text-center py-16 card border-border">
            <Package size={40} className="text-ink-muted mx-auto mb-4" />
            <p className="text-ink-secondary mb-4">Connect your wallet to list products</p>
            <button onClick={connect} className="btn-primary">Connect Wallet</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Left column: form fields ─────── */}
              <div className="lg:col-span-2 space-y-5">

                {/* Name */}
                <div>
                  <label className="input-label">Product Name *</label>
                  <input type="text" value={form.name} onChange={set("name")}
                    placeholder="e.g. Sony WH-1000XM5 Headphones"
                    className={`input ${errors.name ? "border-danger" : ""}`}
                    maxLength={100} />
                  {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
                  <p className="text-xs text-ink-muted mt-1">{form.name.length}/100</p>
                </div>

                {/* Description */}
                <div>
                  <label className="input-label">Description *</label>
                  <textarea value={form.description} onChange={set("description")}
                    placeholder="Describe your product in detail — condition, specs, what's included…"
                    rows={4}
                    className={`input resize-none ${errors.description ? "border-danger" : ""}`}
                    maxLength={1000} />
                  {errors.description && <p className="text-danger text-xs mt-1">{errors.description}</p>}
                  <p className="text-xs text-ink-muted mt-1">{form.description.length}/1000</p>
                </div>

                {/* Image URL */}
                <div>
                  <label className="input-label">Image URL *</label>
                  <div className="flex gap-2">
                    <input type="url" value={form.imageUrl} onChange={set("imageUrl")}
                      placeholder="https://… or ipfs://…"
                      className={`input flex-1 ${errors.imageUrl ? "border-danger" : ""}`} />
                  </div>
                  {errors.imageUrl && <p className="text-danger text-xs mt-1">{errors.imageUrl}</p>}
                  <p className="text-xs text-ink-muted mt-1">
                    Use Unsplash, Imgur, Cloudinary, or IPFS (ipfs://CID)
                  </p>
                </div>

                {/* Price + Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Price (KITE) *</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input type="number" value={form.price} onChange={set("price")}
                        placeholder="0.05"
                        min="0.000001" step="0.0001"
                        className={`input pl-9 ${errors.price ? "border-danger" : ""}`} />
                    </div>
                    {errors.price && <p className="text-danger text-xs mt-1">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="input-label">Stock Quantity *</label>
                    <div className="relative">
                      <Archive size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input type="number" value={form.stock} onChange={set("stock")}
                        placeholder="10"
                        min="1" max="10000" step="1"
                        className={`input pl-9 ${errors.stock ? "border-danger" : ""}`} />
                    </div>
                    {errors.stock && <p className="text-danger text-xs mt-1">{errors.stock}</p>}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="input-label">Category *</label>
                  <select value={form.category} onChange={set("category")} className="input">
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Right column: preview ─────────── */}
              <div className="lg:col-span-1">
                <p className="input-label mb-2">Preview</p>
                <div className="card border-border overflow-hidden sticky top-20">
                  {/* Image preview */}
                  <div className="h-44 bg-surface overflow-hidden">
                    {previewImg ? (
                      <img src={getImageUrl(previewImg)} alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = "https://picsum.photos/seed/preview/400/300"; }} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted">
                        <ImageIcon size={32} className="mb-2 opacity-30" />
                        <span className="text-xs">Image preview</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-white line-clamp-2">
                      {form.name || "Product Name"}
                    </h3>
                    <p className="text-xs text-ink-muted line-clamp-2">
                      {form.description || "Product description…"}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-bold text-accent-400">
                        {form.price ? `${form.price} KITE` : "0 KITE"}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {form.stock ? `${form.stock} units` : ""}
                      </span>
                    </div>
                    {form.category !== "" && (
                      <span className="badge-muted text-[10px]">
                        {CATEGORIES.find((c) => c.id === parseInt(form.category))?.emoji}{" "}
                        {CATEGORIES.find((c) => c.id === parseInt(form.category))?.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cost summary */}
                <div className="mt-4 card p-4 border-border text-sm space-y-2">
                  <div className="flex justify-between text-ink-secondary">
                    <span>Listing fee</span>
                    <span>{LISTING_FEE_KITE} KITE</span>
                  </div>
                  <div className="flex justify-between text-ink-secondary">
                    <span>Platform fee (per sale)</span>
                    <span>2.5%</span>
                  </div>
                  <div className="divider pt-2 flex justify-between text-white font-semibold">
                    <span>You receive per sale</span>
                    <span className="text-success">
                      {form.price ? `${(parseFloat(form.price) * 0.975).toFixed(4)} KITE` : "97.5%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4 pt-2">
              <motion.button
                type="submit"
                disabled={submitting || !isCorrectNetwork}
                whileHover={{ scale: submitting ? 1 : 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="btn-primary text-base py-3.5 px-8 disabled:opacity-60"
              >
                {submitting ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing…</>
                ) : (
                  <><Zap size={18} /> Publish Listing · {LISTING_FEE_KITE} KITE</>
                )}
              </motion.button>
              <Link href="/seller/dashboard" className="btn-secondary text-sm py-3 px-5">
                Cancel
              </Link>
            </div>

            {!isCorrectNetwork && (
              <p className="text-warning text-sm flex items-center gap-2">
                <AlertCircle size={14} /> Switch to Kite Chain to publish
              </p>
            )}
          </form>
        )}
      </div>
    </>
  );
}
