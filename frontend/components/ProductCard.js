import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Package, Shield, Zap } from "lucide-react";
import { formatKITEPrice, getCategoryLabel, getCategoryEmoji, getImageUrl, truncate, formatRating, getBadgeInfo, shortAddress } from "../utils/helpers";
import { BADGE_LEVELS } from "../config/contracts";

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-52 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-6 w-1/3 rounded" />
        <div className="flex gap-2 mt-4">
          <div className="skeleton h-9 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product, index = 0 }) {
  if (!product) return <ProductCardSkeleton />;

  const {
    id, name, imageUrl, price, stock, category,
    seller, totalSold, totalRating, reviewCount, isActive
  } = product;

  const { display: ratingDisplay, stars } = formatRating(
    totalRating ? parseInt(totalRating.toString()) : 0,
    reviewCount ? parseInt(reviewCount.toString()) : 0
  );

  const stockNum  = stock ? parseInt(stock.toString()) : 0;
  const isLowStock = stockNum > 0 && stockNum <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="card-hover overflow-hidden group cursor-pointer"
    >
      <Link href={`/product/${id}`} className="block">

        {/* ── Image ─────────────────────────────── */}
        <div className="relative h-52 overflow-hidden bg-surface">
          <img
            src={getImageUrl(imageUrl)}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.src = `https://picsum.photos/seed/${id}/400/300`; }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="glass px-2.5 py-1 rounded-full text-xs font-medium text-white">
              {getCategoryEmoji(category)} {getCategoryLabel(category)}
            </span>
          </div>

          {/* Low stock warning */}
          {isLowStock && (
            <div className="absolute top-3 right-3">
              <span className="badge-warning text-[10px] px-2 py-0.5">
                Only {stockNum} left!
              </span>
            </div>
          )}

          {/* Out of stock overlay */}
          {stockNum === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="font-display font-bold text-sm text-ink-secondary">OUT OF STOCK</span>
            </div>
          )}

          {/* Total sold badge */}
          {totalSold && parseInt(totalSold.toString()) > 0 && (
            <div className="absolute bottom-3 right-3">
              <span className="glass text-xs px-2 py-1 rounded-full text-white/80">
                {parseInt(totalSold.toString())} sold
              </span>
            </div>
          )}
        </div>

        {/* ── Content ───────────────────────────── */}
        <div className="p-4">

          {/* Rating */}
          {parseInt(reviewCount?.toString() || "0") > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    className={s <= Math.round(stars) ? "text-warning fill-warning" : "text-ink-muted"}
                  />
                ))}
              </div>
              <span className="text-xs text-ink-secondary">
                {ratingDisplay} ({reviewCount?.toString()})
              </span>
            </div>
          )}

          {/* Name */}
          <h3 className="font-display font-semibold text-sm text-ink-primary leading-tight mb-1 group-hover:text-white transition-colors">
            {truncate(name, 55)}
          </h3>

          {/* Seller */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-700 to-accent-500 flex items-center justify-center">
              <Shield size={8} className="text-white" />
            </div>
            <span className="text-xs text-ink-muted">
              {shortAddress(seller?.toString() || "")}
            </span>
          </div>

          {/* Price + Stock */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-lg text-white leading-none">
                {formatKITEPrice(price)}
              </div>
              <div className="text-xs text-ink-muted mt-0.5">
                {stockNum > 0 ? `${stockNum} in stock` : "Sold out"}
              </div>
            </div>

            {/* Quick buy button */}
            {stockNum > 0 && (
              <div className="w-9 h-9 rounded-xl bg-primary-700/20 border border-primary-700/30 
                              flex items-center justify-center
                              group-hover:bg-primary-700 group-hover:border-primary-700
                              transition-all duration-200">
                <ShoppingCart size={15} className="text-primary-400 group-hover:text-white transition-colors" />
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
