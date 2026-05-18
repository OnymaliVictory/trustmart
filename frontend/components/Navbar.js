import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Menu, X, Wallet, ChevronDown, ExternalLink,
  LogOut, Package, LayoutDashboard, Shield, Zap, AlertTriangle, Copy, Check, ShoppingCart
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { CHAIN_ID, EXPLORER_URL } from "../config/chain";
import { shortAddress, explorerAddressLink, copyToClipboard } from "../utils/helpers";
import toast from "react-hot-toast";

const NAV_LINKS = [
  { href: "/",                 label: "Browse Products", icon: ShoppingCart },
  { href: "/seller/dashboard", label: "Sell Products", icon: Package },
  { href: "/buyer/dashboard",  label: "My Orders", icon: LayoutDashboard },
];

export default function Navbar() {
  const router = useRouter();
  const {
    account, shortAddress: shortAddr, formattedBalance,
    isConnecting, isCorrectNetwork, isAdmin,
    connect, disconnect, switchNetwork, chainId,
  } = useWallet();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [walletOpen,  setWalletOpen]  = useState(false);
  const [copied,      setCopied]      = useState(false);

  const isActive = (href) => router.pathname === href;

  const handleCopy = async () => {
    await copyToClipboard(account);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────── */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-700 to-accent-500 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-all">
                <ShoppingBag size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-white">
                Trust<span className="gradient-text">Mart</span>
              </span>
            </Link>

            {/* ── Desktop Nav ──────────────────────── */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
                    isActive(link.href)
                      ? "text-white bg-primary-700/20 border border-primary-700/30"
                      : "text-ink-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  <link.icon size={14} />
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                    isActive("/admin")
                      ? "text-warning bg-warning/10 border border-warning/20"
                      : "text-ink-secondary hover:text-warning hover:bg-warning/5"
                  }`}
                >
                  <Shield size={14} />
                  Admin
                </Link>
              )}
            </div>

            {/* ── Right Side ───────────────────────── */}
            <div className="flex items-center gap-3">

              {/* Network warning */}
              {account && !isCorrectNetwork && (
                <button
                  onClick={switchNetwork}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                             bg-danger/10 border border-danger/20 text-danger text-xs font-medium
                             hover:bg-danger/20 transition-all animate-pulse-slow"
                >
                  <AlertTriangle size={12} />
                  Wrong Network
                </button>
              )}

              {/* Wallet button */}
              {!account ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={connect}
                  disabled={isConnecting}
                  className="btn-primary text-sm py-2 px-4 hidden sm:flex"
                >
                  <Wallet size={15} />
                  {isConnecting ? "Connecting…" : "Connect Wallet"}
                </motion.button>
              ) : (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setWalletOpen(!walletOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl
                               bg-surface border border-border hover:border-rim
                               text-sm transition-all duration-150 group"
                  >
                    <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? "bg-success animate-pulse-slow" : "bg-danger"}`} />
                    <span className="font-mono text-xs text-ink-secondary">{shortAddr}</span>
                    <span className="text-ink-secondary">·</span>
                    <span className="font-medium text-xs text-accent-400">{formattedBalance} KITE</span>
                    <ChevronDown size={13} className={`text-ink-muted transition-transform ${walletOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {walletOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 card border-border shadow-card p-3 z-50"
                      >
                        {/* Address */}
                        <div className="px-2 py-2 mb-2 rounded-lg bg-surface/80">
                          <p className="text-xs text-ink-muted mb-1">Connected wallet</p>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-ink-primary">{shortAddr}</span>
                            <div className="flex gap-1">
                              <button onClick={handleCopy} className="btn-ghost p-1 rounded-md">
                                {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                              </button>
                              <a
                                href={explorerAddressLink(account)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-ghost p-1 rounded-md"
                              >
                                <ExternalLink size={13} />
                              </a>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-ink-muted">Balance:</span>
                            <span className="text-sm font-semibold text-accent-400">{formattedBalance} KITE</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-ink-secondary hover:text-white transition-colors"
                            onClick={() => setWalletOpen(false)}>
                            <ShoppingCart size={14} />
                            Browse Products
                          </Link>
                          <Link href="/buyer/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-ink-secondary hover:text-white transition-colors"
                            onClick={() => setWalletOpen(false)}>
                            <LayoutDashboard size={14} />
                            My Orders
                          </Link>
                          <Link href="/seller/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-ink-secondary hover:text-white transition-colors"
                            onClick={() => setWalletOpen(false)}>
                            <Package size={14} />
                            Seller Dashboard
                          </Link>
                          {isAdmin && (
                            <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-warning/10 text-sm text-warning transition-colors"
                              onClick={() => setWalletOpen(false)}>
                              <Shield size={14} />
                              Admin Panel
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-border mt-2 pt-2">
                          {!isCorrectNetwork && (
                            <button
                              onClick={() => { switchNetwork(); setWalletOpen(false); }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-danger/10 text-sm text-danger transition-colors mb-1"
                            >
                              <Zap size={14} />
                              Switch to Kite Chain
                            </button>
                          )}
                          <button
                            onClick={() => { disconnect(); setWalletOpen(false); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-ink-secondary hover:text-danger transition-colors"
                          >
                            <LogOut size={14} />
                            Disconnect
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden btn-ghost p-2 rounded-lg"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ─────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border overflow-hidden bg-abyss/95 backdrop-blur-md"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive(link.href) ? "bg-primary-700/20 text-white" : "text-ink-secondary"
                    }`}>
                    <link.icon size={14} />
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-warning">
                    <Shield size={14} /> Admin
                  </Link>
                )}
                <div className="pt-2 border-t border-border">
                  {!account ? (
                    <button onClick={() => { connect(); setMobileOpen(false); }}
                      className="btn-primary w-full text-sm">
                      <Wallet size={15} /> Connect Wallet
                    </button>
                  ) : (
                    <div className="card p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-ink-secondary">{shortAddr}</span>
                        <span className="text-sm font-semibold text-accent-400">{formattedBalance} KITE</span>
                      </div>
                      {!isCorrectNetwork && (
                        <button onClick={switchNetwork}
                          className="w-full py-2 rounded-lg bg-danger/10 text-danger text-sm mb-2">
                          Switch to Kite Chain
                        </button>
                      )}
                      <button onClick={() => { disconnect(); setMobileOpen(false); }}
                        className="w-full py-2 rounded-lg bg-white/5 text-ink-secondary text-sm">
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Overlay */}
      {(walletOpen || mobileOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setWalletOpen(false); setMobileOpen(false); }}
        />
      )}
    </>
  );
}
