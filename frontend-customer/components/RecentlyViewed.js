import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

const STORAGE_KEY = "digisho_recently_viewed";
const MAX_ITEMS   = 8;

// ─── Helper: call this inside any product detail page to track views ──────────
export function trackRecentlyViewed(product) {
  if (!product?._id) return;
  try {
    const stored  = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = stored.filter((p) => p._id !== product._id);  // remove duplicate
    const updated  = [product, ...filtered].slice(0, MAX_ITEMS);    // prepend, cap at 8
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
}

// ─── Component: drop this on homepage or any page ─────────────────────────────
export default function RecentlyViewed() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setProducts(stored);
    } catch (_) {
      setProducts([]);
    }
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-3xl font-bold">
          👁️ Recently <span className="text-accent">Viewed</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}