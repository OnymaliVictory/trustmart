import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Zap, Package, BarChart2, Users, DollarSign, Star, Brain } from "lucide-react";
import ProductCard, { ProductCardSkeleton } from "../components/ProductCard";
import AgentFeed from "../components/AgentFeed";
import { useWallet } from "../context/WalletContext";
import { CATEGORIES } from "../config/contracts";
import { formatVolume } from "../utils/helpers";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";

export default function Home() {
  const { contracts } = useWallet();
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [activeCategory, setCategory] = useState(-1);
  const [stats,       setStats]       = useState({ volume:"0", orders:"0", products:"0" });

  const fetchProducts = useCallback(async () => {
    if (!contracts?.productRegistry) { setLoading(false); return; }
    try {
      setLoading(true);
      const total = await contracts.productRegistry.getTotalProducts();
      const totalNum = total.toNumber();
      if (totalNum === 0) { setLoading(false); return; }
      const batch = await contracts.productRegistry.getProductsBatch(1, Math.min(12, totalNum));
      setProducts(batch.filter((p) => p.isActive).reverse());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [contracts]);

  const fetchStats = useCallback(async () => {
    if (!contracts?.escrowOrder || !contracts?.productRegistry) return;
    try {
      const [vol, orders, total] = await Promise.all([
        contracts.escrowOrder.totalVolume(),
        contracts.escrowOrder.totalOrders(),
        contracts.productRegistry.getTotalProducts(),
      ]);
      setStats({ volume: formatVolume(vol), orders: orders.toString(), products: total.toString() });
    } catch {}
  }, [contracts]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const matchCat = activeCategory === -1 || Number(p.category) === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <>
      <Head>
        <title>TrustMart – AI-Powered Web3 Marketplace on Kite Chain</title>
        <meta name="description" content="The first AI-arbitrated decentralized marketplace. Escrow + Claude AI + Kite Chain." />
      </Head>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-hero min-h-[500px] flex items-center">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-700/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary-700/30 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-ink-secondary">Live on Kite Chain · AI Agent Active</span>
              <Brain size={11} className="text-primary-400" />
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-6">
              The Marketplace Where{" "}
              <span className="gradient-text">AI Enforces</span>
              {" "}the Rules
            </motion.h1>

            <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              className="text-ink-secondary text-lg leading-relaxed mb-8 max-w-2xl">
              TrustMart combines smart contract escrow with Claude AI to automatically verify deliveries,
              detect fraud, and arbitrate disputes — all recorded permanently on Kite Chain.
            </motion.p>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
              className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="text" placeholder="Search products…" value={search}
                  onChange={(e) => setSearch(e.target.value)} className="input pl-11 h-12 text-base" />
              </div>
              <button className="btn-primary h-12 px-6 whitespace-nowrap">Search</button>
            </motion.div>

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
              className="flex flex-wrap gap-4 mt-8">
              {[
                { icon:<ShieldCheck size={14}/>, label:"Escrow Protected" },
                { icon:<Brain size={14}/>,       label:"AI Arbitration" },
                { icon:<Zap size={14}/>,         label:"Auto-Settlement" },
                { icon:<Star size={14}/>,         label:"NFT Reputation" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-ink-secondary">
                  <span className="text-accent-400">{item.icon}</span>{item.label}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { icon:<DollarSign size={18}/>, label:"Total Volume",   value:`${stats.volume} KITE`, color:"text-accent-400" },
              { icon:<Package size={18}/>,    label:"Total Orders",   value:stats.orders,            color:"text-primary-400" },
              { icon:<Users size={18}/>,      label:"Products Listed",value:stats.products,           color:"text-success" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-3 px-6 py-5">
                <div className={`${s.color} opacity-70`}>{s.icon}</div>
                <div>
                  <div className={`font-display font-bold text-lg ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-ink-muted">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Products (3/4 width) ─────────────────────── */}
          <div className="lg:col-span-3">
            {/* Category filters */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
              <button onClick={() => setCategory(-1)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === -1 ? "bg-primary-700 text-white shadow-glow-sm" : "bg-surface border border-border text-ink-secondary hover:border-rim"}`}>
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeCategory === cat.id ? "bg-primary-700 text-white shadow-glow-sm" : "bg-surface border border-border text-ink-secondary hover:border-rim"}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-2xl text-white">
                {search ? `Results for "${search}"` : "Latest Products"}
              </h2>
              <span className="text-sm text-ink-secondary">
                {loading ? "Loading…" : `${filtered.length} products`}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({length:6}).map((_,i) => <ProductCardSkeleton key={i}/>)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Package size={40} className="text-ink-muted mx-auto mb-4" />
                <p className="text-ink-secondary mb-4">No products found</p>
                <a href="/seller/add-product" className="btn-primary text-sm">List a Product</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((p, i) => <ProductCard key={p.id?.toString()} product={p} index={i} />)}
              </div>
            )}
          </div>

          {/* ── AI Agent Sidebar (1/4 width) ─────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <AgentFeed agentUrl={AGENT_URL} />
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="bg-surface/30 border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-white mb-3">AI-Enforced Trust</h2>
            <p className="text-ink-secondary max-w-lg mx-auto">
              Every transaction is protected by smart contracts + Claude AI working together.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step:"01", title:"Escrow Payment",    desc:"Buyer's KITE is locked in smart contract. Seller can't touch it.",         icon:<ShieldCheck size={22}/>, color:"from-primary-700 to-primary-900" },
              { step:"02", title:"Upload Proof",      desc:"Buyer uploads delivery photo. AI agent analyzes it with computer vision.", icon:<Brain size={22}/>,       color:"from-accent-600 to-primary-700" },
              { step:"03", title:"AI Decision",       desc:"Claude AI writes a binding decision + attestation to Kite Chain.",         icon:<Zap size={22}/>,         color:"from-success to-accent-600" },
              { step:"04", title:"Auto Settlement",   desc:"Funds release to seller OR refund to buyer based on AI ruling.",           icon:<Package size={22}/>,     color:"from-warning to-success" },
            ].map((s) => (
              <motion.div key={s.step} whileHover={{ y:-4 }} className="card p-5 border-border">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-glow-sm`}>
                  <span className="text-white">{s.icon}</span>
                </div>
                <div className="text-4xl font-display font-bold text-border mb-2">{s.step}</div>
                <h3 className="font-display font-semibold text-sm text-white mb-1">{s.title}</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
