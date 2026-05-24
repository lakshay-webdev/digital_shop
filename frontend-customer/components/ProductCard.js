import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCartStore, useWishlistStore } from "../store";

const fmt = (n) => (n != null ? `₹${n.toLocaleString("en-IN")}` : null);

function StarRating({ rating, count }) {
  const rounded = Math.min(5, Math.max(0, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-1 mt-1.5">
      <span className="text-xs tracking-tight">
        {"★".repeat(rounded)}
        <span className="text-gray-300">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="text-xs text-gray-400">({count?.toLocaleString() || "0"})</span>
    </div>
  );
}

export default function ProductCard({ product, loading }) {
  const addItem      = useCartStore((s) => s.addItem);
  const toggle       = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
        <div className="h-44 bg-gray-100" />
        <div className="p-4 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-6 bg-gray-100 rounded w-1/2 mt-2" />
        </div>
      </div>
    );
  }

  const handleAddToCart = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name?.slice(0, 20)}... added! 🛒`);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    const added = toggle(product);
    toast(added ? "Added to wishlist ♥" : "Removed", { icon: added ? "❤️" : "🤍" });
  };

  const discountedPrice = fmt(product.price);
  const originalPrice   = fmt(product.mrp);
  const showDiscount    = product.discount > 0;

  return (
    <Link href={`/products/${product.slug || product._id}`} className="group">
      <div className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">

        {/* ✅ FIX: "New" badge only — Hot badge hataya */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.isNewArrival && (
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg">New</span>
          )}
          {showDiscount && (
            <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-lg">-{product.discount}%</span>
          )}
        </div>

        {/* Image */}
        <div className="h-44 bg-gray-50 relative overflow-hidden">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-5xl">📦</div>
          )}
          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
          >
            {isWishlisted(product._id) ? "❤️" : "🤍"}
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{product.brand}</p>
          <p className="text-sm font-semibold text-primary mt-0.5 leading-tight line-clamp-2">{product.name}</p>
          <StarRating rating={product.avgRating} count={product.numReviews} />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-base font-bold text-accent">{discountedPrice}</span>
            {originalPrice && showDiscount && (
              <>
                <span className="text-xs text-gray-400 line-through">{originalPrice}</span>
                <span className="text-xs font-bold text-green-600">-{product.discount}%</span>
              </>
            )}
          </div>
        </div>

        {/* Add to cart */}
        <div className="px-4 pb-4">
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
}