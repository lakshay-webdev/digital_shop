import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import HeroBanner from "../components/HeroBanner";
import CategoryGrid from "../components/CategoryGrid";
import FlashSaleTimer from "../components/FlashSaleTimer";
import RecentlyViewed from "../components/RecentlyViewed";
import { productAPI, bannerAPI } from "../lib/api";

const FLASH_SALE_DURATION_MS = 5 * 60 * 60 * 1000;
const FLASH_SALE_STORAGE_KEY = "digisho_flash_sale_end";

// Brand Spotlight ke liye brands list
const BRANDS = [
  { name: "Apple",   emoji: "🍎" },
  { name: "Samsung", emoji: "📱" },
  { name: "Sony",    emoji: "🎧" },
  { name: "Nike",    emoji: "👟" },
];

function getFlashSaleEndTime() {
  if (typeof window === "undefined") return Date.now() + FLASH_SALE_DURATION_MS;
  const stored = localStorage.getItem(FLASH_SALE_STORAGE_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (parsed > Date.now()) return parsed;
  }
  const newEnd = Date.now() + FLASH_SALE_DURATION_MS;
  localStorage.setItem(FLASH_SALE_STORAGE_KEY, String(newEnd));
  return newEnd;
}

const fmt = (n) => (n != null ? `₹${n.toLocaleString("en-IN")}` : "—");

export default function HomePage() {
  const [flashSaleEnd, setFlashSaleEnd]         = useState(null);
  const [selectedBrand, setSelectedBrand]       = useState(BRANDS[0].name);

  useEffect(() => {
    setFlashSaleEnd(getFlashSaleEndTime());
  }, []);

  // Featured
  const { data: featured, error: featuredError } = useQuery({
    queryKey: ["products", "featured"],
    queryFn:  () => productAPI.getFeatured().then((r) => r.data.products),
  });

  // Best Sellers
  const { data: bestSellers, error: bestSellersError } = useQuery({
    queryKey: ["products", "bestSellers"],
    queryFn:  () => productAPI.getAll({ bestSeller: true, limit: 8 }).then((r) => r.data.products),
  });

  // New Arrivals — latest products
  const { data: newArrivals, error: newArrivalsError } = useQuery({
    queryKey: ["products", "newArrivals"],
    queryFn:  () => productAPI.getAll({ sort: "newest", limit: 8 }).then((r) => r.data.products),
  });

  // Top Rated
  const { data: topRated, error: topRatedError } = useQuery({
    queryKey: ["products", "topRated"],
    queryFn:  () => productAPI.getAll({ sort: "rating", limit: 8 }).then((r) => r.data.products),
  });

  // Deal of the Day — highest discount featured product
  const { data: dealProduct } = useQuery({
    queryKey: ["products", "dealOfDay"],
    queryFn:  () =>
      productAPI.getAll({ featured: true, sort: "newest", limit: 20 })
        .then((r) => {
          const products = r.data.products || [];
          return products.sort((a, b) => (b.discount || 0) - (a.discount || 0))[0] || null;
        }),
  });

  // Brand Spotlight
  const { data: brandProducts } = useQuery({
    queryKey: ["products", "brand", selectedBrand],
    queryFn:  () =>
      productAPI.getAll({ brand: selectedBrand, limit: 8 }).then((r) => r.data.products),
    enabled: !!selectedBrand,
  });

  // Banners
  const { data: banners, error: bannersError } = useQuery({
    queryKey: ["banners"],
    queryFn:  () => bannerAPI.getAll().then((r) => r.data.banners),
  });

  const hasDataError = Boolean(featuredError || bestSellersError || newArrivalsError || topRatedError || bannersError);
  const dataErrorMessage =
    featuredError?.message ||
    bestSellersError?.message ||
    newArrivalsError?.message ||
    topRatedError?.message ||
    bannersError?.message;

  // Deal of the Day countdown — 24 hours
  const [dealTimeLeft, setDealTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  useEffect(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) return;
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setDealTimeLeft({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Head>
        <title>DigiSho — Shop Premium Products Online</title>
      </Head>

      {hasDataError && (
        <section className="max-w-7xl mx-auto px-4 py-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
            <p className="font-semibold">Unable to load some site data.</p>
            <p>{dataErrorMessage || "Unable to connect to server. Please try again later."}</p>
          </div>
        </section>
      )}

      {/* Hero Banners */}
      <HeroBanner banners={banners || []} />

      {/* Flash Sale */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        {flashSaleEnd && <FlashSaleTimer endTime={flashSaleEnd} />}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold">
            Shop by <span className="text-accent">Category</span>
          </h2>
          <Link href="/categories" className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:border-accent hover:text-accent transition-colors">
            View All
          </Link>
        </div>
        <CategoryGrid />
      </section>

      {/* ── Deal of the Day ─────────────────────────────────────────── */}
      {dealProduct && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="bg-gradient-to-r from-accent to-orange-500 rounded-2xl p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Left — Info */}
              <div className="flex-1 text-white">
                <p className="text-xs tracking-widest uppercase text-white/60 mb-2">🎯 Deal of the Day</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 leading-tight">
                  {dealProduct.name}
                </h2>
                <p className="text-white/70 text-sm mb-4 line-clamp-2">{dealProduct.description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold">{fmt(dealProduct.price)}</span>
                  {dealProduct.mrp > dealProduct.price && (
                    <span className="text-lg text-white/50 line-through">{fmt(dealProduct.mrp)}</span>
                  )}
                  <span className="bg-white text-accent text-sm font-bold px-2 py-0.5 rounded-lg">
                    {dealProduct.discount}% OFF
                  </span>
                </div>

                {/* Countdown */}
                <div className="flex items-center gap-3 mb-6">
                  <p className="text-sm text-white/70">Ends in:</p>
                  {[dealTimeLeft.h, dealTimeLeft.m, dealTimeLeft.s].map((val, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-2 text-xl font-bold min-w-[48px] text-center">
                        {val}
                      </div>
                      {i < 2 && <span className="text-white font-bold text-xl">:</span>}
                    </div>
                  ))}
                </div>

                <Link
                  href={`/products/${dealProduct.slug}`}
                  className="inline-block bg-white text-accent font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Grab Deal →
                </Link>
              </div>

              {/* Right — Image */}
              <div className="w-48 h-48 md:w-64 md:h-64 relative flex-shrink-0 bg-white/10 rounded-2xl overflow-hidden">
                <Image
                  src={dealProduct.thumbnail || dealProduct.images?.[0]?.url || "/placeholder.png"}
                  alt={dealProduct.name}
                  fill
                  className="object-contain p-4"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Offer Banner */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-10 flex items-center justify-between text-white">
          <div>
            <p className="text-xs tracking-widest uppercase text-white/50 mb-2">Limited Time</p>
            <h2 className="font-display text-3xl font-bold mb-3">
              Up to <span className="text-accent">70% Off</span> on Electronics
            </h2>
            <p className="text-white/70 mb-5">
              Use code{" "}
              <code className="bg-white/10 px-2 py-1 rounded font-bold">LAUNCH20</code> for extra 20% off
            </p>
            <Link href="/products?category=electronics" className="bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors">
              Shop Now →
            </Link>
          </div>
          <span className="text-8xl opacity-20 hidden md:block">⚡</span>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold">
            🔥 Best <span className="text-accent">Sellers</span>
          </h2>
          <Link href="/products?sort=popular" className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:border-accent hover:text-accent transition-colors">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {(bestSellers || Array(8).fill(null)).map((p, i) => (
            <ProductCard key={p?._id || i} product={p} loading={!p} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold">
            ✨ New <span className="text-accent">Arrivals</span>
          </h2>
          <Link href="/products?sort=newest" className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:border-accent hover:text-accent transition-colors">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {(newArrivals || Array(8).fill(null)).map((p, i) => (
            <ProductCard key={p?._id || i} product={p} loading={!p} />
          ))}
        </div>
      </section>

      {/* ── Top Rated ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold">
            ⭐ Top <span className="text-accent">Rated</span>
          </h2>
          <Link href="/products?sort=rating" className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:border-accent hover:text-accent transition-colors">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {(topRated || Array(8).fill(null)).map((p, i) => (
            <ProductCard key={p?._id || i} product={p} loading={!p} />
          ))}
        </div>
      </section>

      {/* ── Brand Spotlight ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold">
            🏷️ Brand <span className="text-accent">Spotlight</span>
          </h2>
          <Link
            href={`/products?brand=${selectedBrand}`}
            className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:border-accent hover:text-accent transition-colors"
          >
            View All
          </Link>
        </div>

        {/* Brand Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {BRANDS.map((b) => (
            <button
              key={b.name}
              onClick={() => setSelectedBrand(b.name)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                selectedBrand === b.name
                  ? "border-accent bg-red-50 text-accent"
                  : "border-gray-200 text-gray-600 hover:border-accent hover:text-accent"
              }`}
            >
              <span>{b.emoji}</span>
              {b.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {(brandProducts || Array(8).fill(null)).map((p, i) => (
            <ProductCard key={p?._id || i} product={p} loading={!p} />
          ))}
        </div>
      </section>

      {/* ── Recently Viewed ─────────────────────────────────────────── */}
      <RecentlyViewed />

    </>
  );
}

HomePage.getLayout = (page) => <Layout>{page}</Layout>;