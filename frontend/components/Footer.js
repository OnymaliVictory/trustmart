import Link from "next/link";
import { ShoppingBag, ExternalLink, Github, Twitter } from "lucide-react";
import { EXPLORER_URL, CONTRACT_ADDRESSES } from "../config/contracts";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-700 to-accent-500 flex items-center justify-center">
                <ShoppingBag size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg">
                Trust<span className="gradient-text">Mart</span>
              </span>
            </div>
            <p className="text-ink-secondary text-sm leading-relaxed max-w-xs">
              The first decentralized escrow marketplace on Kite Chain.
              Buy and sell with zero counterparty risk — secured by smart contracts.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-slow" />
              <span className="text-xs text-ink-secondary">Live on Kite Chain Testnet</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-sm text-ink-primary mb-4">Marketplace</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/",                 label: "Browse Products" },
                { href: "/seller/dashboard", label: "Sell on TrustMart" },
                { href: "/buyer/dashboard",  label: "My Orders" },
                { href: "/seller/add-product", label: "List a Product" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm text-ink-secondary hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contracts */}
          <div>
            <h4 className="font-display font-semibold text-sm text-ink-primary mb-4">On-Chain</h4>
            <ul className="space-y-2.5">
              {CONTRACT_ADDRESSES.productRegistry && (
                <li>
                  <a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESSES.productRegistry}`}
                    target="_blank" rel="noreferrer"
                    className="text-sm text-ink-secondary hover:text-accent-400 transition-colors flex items-center gap-1.5">
                    <ExternalLink size={11} />
                    ProductRegistry
                  </a>
                </li>
              )}
              {CONTRACT_ADDRESSES.escrowOrder && (
                <li>
                  <a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESSES.escrowOrder}`}
                    target="_blank" rel="noreferrer"
                    className="text-sm text-ink-secondary hover:text-accent-400 transition-colors flex items-center gap-1.5">
                    <ExternalLink size={11} />
                    EscrowOrder
                  </a>
                </li>
              )}
              {CONTRACT_ADDRESSES.disputeResolver && (
                <li>
                  <a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESSES.disputeResolver}`}
                    target="_blank" rel="noreferrer"
                    className="text-sm text-ink-secondary hover:text-accent-400 transition-colors flex items-center gap-1.5">
                    <ExternalLink size={11} />
                    DisputeResolver
                  </a>
                </li>
              )}
              <li>
                <a href="https://testnet.kitescan.ai" target="_blank" rel="noreferrer"
                  className="text-sm text-ink-secondary hover:text-accent-400 transition-colors flex items-center gap-1.5">
                  <ExternalLink size={11} />
                  Kite Chain Explorer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-muted">
            © 2026 TrustMart. Built for Kite Chain Hackathon.
          </p>
          <p className="text-xs text-ink-muted">
            Powered by <span className="text-accent-400">Kite Chain</span> · Secured by Smart Contracts
          </p>
        </div>
      </div>
    </footer>
  );
}
