import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { productAPI } from "../../lib/api";
import { useCartStore, useWishlistStore } from "../../store";
import { trackRecentlyViewed } from "../../components/RecentlyViewed";
import { useCompareStore } from "../../components/CompareBar";

const fmt = (n) => (n != null ? `₹${n.toLocaleString("en-IN")}` : "—");

function StarRating({ rating, size = "text-lg" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`${size} ${s <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}>★</span>
      ))}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="h-[400px] bg-gray-100 rounded-2xl mb-4" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <div key={i} className="w-16 h-16 bg-gray-100 rounded-lg" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-40" />
          <div className="h-10 bg-gray-100 rounded w-48" />
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function RelatedProductsSkeleton() {
  return (
    <div className="mt-16 animate-pulse">
      <div className="h-7 bg-gray-100 rounded w-48 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-32 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-64" />
        ))}
      </div>
    </div>
  );
}

function RatingBar({ label, pct }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-gray-500 text-right">{label}★</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-gray-400">{pct}%</span>
    </div>
  );
}

function RelatedProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={product.thumbnail || product.images?.[0]?.url || "/placeholder.png"}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
            -{discount}%
          </span>
        )}
        {product.isBestSeller && (
          <span className="absolute bottom-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
            🔥 Bestseller
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            const added = toggle(product);
            toast(added ? "Added to wishlist ♥" : "Removed from wishlist", { icon: added ? "❤️" : "🤍" });
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:scale-110"
        >
          {isWishlisted(product._id) ? "❤️" : "🤍"}
        </button>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">{product.brand}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight mb-2 hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={product.avgRating} size="text-xs" />
          <span className="text-[10px] text-gray-400">({product.numReviews || 0})</span>
        </div>
        <div className="flex items-baseline gap-2 mb-3 mt-auto">
          <span className="text-base font-bold text-accent">{fmt(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through">{fmt(product.mrp)}</span>
          )}
        </div>
        <button
          onClick={() => { addItem(product, 1); toast.success("Added to cart! 🛒"); }}
          disabled={!product.inStock}
          className="w-full bg-primary text-white rounded-xl py-2 text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.inStock ? "🛒 Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [copied, setCopied] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const toggleCompare = useCompareStore((s) => s.toggle);
  const isInCompare = useCompareStore((s) => s.isInCompare);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productAPI.getOne(slug).then((r) => r.data.product),
    enabled: !!slug,
  });

  // ✅ FIXED: Ab dedicated /related endpoint use ho raha hai
  const { data: relatedData, isLoading: relatedLoading } = useQuery({
    queryKey: ["related-products", product?._id],
    queryFn: () => productAPI.getRelated(product._id).then((r) => r.data.products),
    enabled: !!product?._id,
  });

  useEffect(() => {
    if (product) trackRecentlyViewed(product);
  }, [product]);

  if (isLoading) return <Layout><ProductSkeleton /></Layout>;
  if (!product) return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold mb-2">Product not found</h2>
        <p className="text-gray-500 mb-6">This product may have been removed or the link is invalid.</p>
        <Link href="/products" className="bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors">
          Browse Products →
        </Link>
      </div>
    </Layout>
  );

  const images = product.images?.length ? product.images : [{ url: product.thumbnail || "/placeholder.png" }];
  const inStock = (product.stock ?? 1) > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const savings = product.mrp ? product.mrp - product.price : 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem(product, qty, selectedVariant);
    toast.success("Added to cart! 🛒");
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    addItem(product, qty, selectedVariant);
    router.push("/checkout");
  };

  const handleWishlist = () => {
    const added = toggle(product);
    toast(added ? "Added to wishlist ♥" : "Removed from wishlist", { icon: added ? "❤️" : "🤍" });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied! 📋");
    }
  };

  const ratingDist = [
    { label: 5, pct: 62 }, { label: 4, pct: 20 },
    { label: 3, pct: 10 }, { label: 2, pct: 5 }, { label: 1, pct: 3 },
  ];

  return (
    <>
      <Head>
        <title>{product.name} | DigiSho</title>
        <meta name="description" content={product.description?.slice(0, 150)} />
      </Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-accent transition-colors">Products</Link>
            {product.category && (<><span>/</span><Link href={`/products?category=${product.category?.name}`} className="hover:text-accent transition-colors capitalize">{product.category?.name}</Link></>)}
            <span>/</span>
            <span className="text-gray-600 font-medium line-clamp-1">{product.name}</span>
          </nav>

          {/* Product Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div className="space-y-3">
              <div className="relative w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group">
                <Image src={images[selectedImage]?.url || "/placeholder.png"} alt={product.name} fill className="object-contain p-6 transition-transform duration-300 group-hover:scale-105" priority />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.isBestSeller && <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-lg">🔥 Bestseller</span>}
                  {product.isNewArrival && <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">✨ New</span>}
                  {!inStock && <span className="bg-gray-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">Out of Stock</span>}
                </div>
                <button onClick={handleShare} className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-all text-sm">{copied ? "✓" : "🔗"}</button>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-accent shadow-md" : "border-gray-100 hover:border-gray-300"}`}>
                      <Image src={img.url} alt="" width={64} height={64} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">{product.brand}</p>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-primary leading-tight mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <StarRating rating={product.avgRating} />
                <span className="text-sm text-gray-500">{product.avgRating?.toFixed(1)} ({product.numReviews?.toLocaleString() || 0} reviews)</span>
                {product.numReviews > 0 && <button onClick={() => setActiveTab("reviews")} className="text-xs text-accent hover:underline">Read reviews →</button>}
              </div>
              <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                <span className="text-3xl font-bold text-accent">{fmt(product.price)}</span>
                {product.mrp && product.mrp > product.price && <span className="text-lg text-gray-400 line-through">{fmt(product.mrp)}</span>}
                {product.discount > 0 && <span className="bg-green-50 text-green-700 text-sm font-bold px-2 py-0.5 rounded-lg">{product.discount}% OFF</span>}
              </div>
              {savings > 0 && <p className="text-sm text-green-600 font-medium mb-4">You save {fmt(savings)} on this order!</p>}
              <div className="flex items-center gap-2 mb-4">
                {inStock ? (
                  <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-sm font-medium text-green-700">{lowStock ? `Only ${product.stock} left!` : "In Stock"}</span></>
                ) : (
                  <><span className="w-2 h-2 bg-red-500 rounded-full" /><span className="text-sm font-medium text-red-600">Out of Stock</span></>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[{ icon: "🚚", label: "Free Delivery" }, { icon: "↩️", label: "10-Day Return" }, { icon: "🛡️", label: "1 Year Warranty" }].map(({ icon, label }) => (
                  <div key={label} className="bg-green-50 border border-green-100 rounded-xl p-2 text-center">
                    <p className="text-lg mb-0.5">{icon}</p>
                    <p className="text-[10px] text-green-800 font-semibold leading-tight">{label}</p>
                  </div>
                ))}
              </div>
              {product.variants?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Select Variant:</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.variants.map((v) => (
                      <button key={v._id} onClick={() => setSelectedVariant(v.name)} className={`border-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${selectedVariant === v.name ? "border-accent bg-red-50 text-accent" : "border-gray-200 hover:border-accent text-gray-600"}`}>{v.name}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 mb-5">
                <p className="text-sm font-semibold text-gray-700">Qty:</p>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 hover:bg-gray-50 text-lg font-bold transition-colors">−</button>
                  <span className="px-4 py-2 font-bold text-base border-x border-gray-200 min-w-[48px] text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="px-4 py-2 hover:bg-gray-50 text-lg font-bold transition-colors">+</button>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap mb-4">
                <button onClick={handleAddToCart} disabled={!inStock} className="flex-1 bg-primary text-white rounded-xl py-3.5 font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">🛒 Add to Cart</button>
                <button onClick={handleBuyNow} disabled={!inStock} className="flex-1 bg-accent text-white rounded-xl py-3.5 font-bold hover:bg-red-600 transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed">⚡ Buy Now</button>
              </div>
              <div className="flex gap-2">
                <button onClick={handleWishlist} className={`flex-1 border-2 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${isWishlisted(product._id) ? "border-red-200 bg-red-50 text-accent" : "border-gray-200 hover:border-accent text-gray-600"}`}>
                  {isWishlisted(product._id) ? "❤️ Wishlisted" : "🤍 Wishlist"}
                </button>
                <button onClick={() => toggleCompare(product)} className={`flex-1 border-2 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${isInCompare(product._id) ? "border-blue-200 bg-blue-50 text-blue-600" : "border-gray-200 hover:border-blue-400 text-gray-600"}`}>
                  📊 {isInCompare(product._id) ? "In Compare" : "Compare"}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-12">
            <div className="flex gap-1 border-b border-gray-100 mb-6">
              {[{ key: "description", label: "📄 Description" }, { key: "specs", label: "📋 Specifications" }, { key: "reviews", label: `⭐ Reviews (${product.reviews?.length || 0})` }].map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)} className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${activeTab === key ? "border-accent text-accent" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{label}</button>
              ))}
            </div>
            {activeTab === "description" && (
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                <p>{product.description || "No description available."}</p>
              </div>
            )}
            {activeTab === "specs" && (
              <div className="max-w-2xl">
                {product.specifications?.length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {product.specifications.map((spec, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="py-3 px-4 font-semibold text-gray-700 w-1/3 rounded-l-xl">{spec.key}</td>
                          <td className="py-3 px-4 text-gray-600 rounded-r-xl">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-gray-400 text-sm">No specifications available.</p>}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-2xl p-6 text-center mb-4">
                    <p className="text-6xl font-bold text-primary">{product.avgRating?.toFixed(1) || "—"}</p>
                    <StarRating rating={product.avgRating} size="text-2xl" />
                    <p className="text-sm text-gray-500 mt-2">{product.numReviews?.toLocaleString() || 0} reviews</p>
                  </div>
                  <div className="space-y-2">
                    {ratingDist.map(({ label, pct }) => <RatingBar key={label} label={label} pct={pct} />)}
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  {product.reviews?.length > 0 ? product.reviews.slice(0, 6).map((r) => (
                    <div key={r._id} className="bg-white border border-gray-100 rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">{r.user?.name?.charAt(0) || "U"}</div>
                          <div>
                            <p className="font-semibold text-sm">{r.user?.name || "Anonymous"}</p>
                            <p className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-green-50 border border-green-100 rounded-lg px-2 py-0.5">
                          <span className="text-xs font-bold text-green-700">{r.rating}★</span>
                        </div>
                      </div>
                      {r.title && <p className="font-semibold text-sm mb-1">{r.title}</p>}
                      <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-gray-400">
                      <p className="text-4xl mb-3">💬</p>
                      <p className="font-medium">No reviews yet</p>
                      <p className="text-sm mt-1">Be the first to review!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ✅ Related Products Section */}
          {relatedLoading ? (
            <RelatedProductsSkeleton />
          ) : relatedData?.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">Related Products</h2>
                  <p className="text-sm text-gray-400 mt-1">More from {product.category?.name}</p>
                </div>
                <Link
                  href={`/products?category=${product.category?.slug || product.category?.name}`}
                  className="text-sm text-accent font-semibold hover:underline"
                >
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {relatedData.map((p) => (
                  <RelatedProductCard key={p._id} product={p} />
                ))}
              </div>
            </div>
          )}

        </div>
      </Layout>
    </>
  );
}