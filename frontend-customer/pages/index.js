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
import { productAPI, bannerAPI } from "../lib/api";

// ✅ FIX: Flash Sale end time persists across page refreshes using localStorage
// Duration: 5 hours from FIRST visit — won't reset on every reload
const FLASH_SALE_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours
const FLASH_SALE_STORAGE_KEY = "digisho_flash_sale_end";

function getFlashSaleEndTime() {
  if (typeof window === "undefined") return Date.now() + FLASH_SALE_DURATION_MS;
  const stored = localStorage.getItem(FLASH_SALE_STORAGE_KEY);
  if (stored) {
    const parsed = Number(stored);
    // If sale already ended, start a new one
    if (parsed > Date.now()) return parsed;
  }
  const newEnd = Date.now() + FLASH_SALE_DURATION_MS;
  localStorage.setItem(FLASH_SALE_STORAGE_KEY, String(newEnd));
  return newEnd;
}

export default function HomePage() {
  const [flashSaleEnd, setFlashSaleEnd] = useState(null);

  // ✅ Run only on client side (avoids SSR mismatch)
  useEffect(() => {
    setFlashSaleEnd(getFlashSaleEndTime());
  }, []);

  const { data: featured, error: featuredError } = useQuery({
    queryKey: ["products", "featured"],
    queryFn:  () => productAPI.getFeatured().then((r) => r.data.products),
  });

  const { data: bestSellers, error: bestSellersError } = useQuery({
    queryKey: ["products", "bestSellers"],
    queryFn:  () => productAPI.getAll({ bestSeller: true, limit: 8 }).then((r) => r.data.products),
  });

  const { data: newArrivals, error: newArrivalsError } = useQuery({
    queryKey: ["products", "newArrivals"],
    queryFn:  () => productAPI.getAll({ newArrival: true, limit: 8 }).then((r) => r.data.products),
  });

  const { data: banners, error: bannersError } = useQuery({
    queryKey: ["banners"],
    queryFn:  () => bannerAPI.getAll().then((r) => r.data.banners),
  });

  const hasDataError = Boolean(featuredError || bestSellersError || newArrivalsError || bannersError);
  const dataErrorMessage =
    featuredError?.message ||
    bestSellersError?.message ||
    newArrivalsError?.message ||
    bannersError?.message;

  return (
    <>
      <Head>
        <title>DigiSho — Shop Premium Products Online</title>
      </Head>

      {/* Hero Banners */}
      {hasDataError && (
        <section className="max-w-7xl mx-auto px-4 py-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
            <p className="font-semibold">Unable to load some site data.</p>
            <p>{dataErrorMessage || "Unable to connect to server. Please try again later."}</p>
          </div>
        </section>
      )}
      <HeroBanner banners={banners || []} />

      {/* Flash Sale */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        {/* ✅ FIX: flashSaleEnd is now stable — won't reset on every page refresh */}
        {flashSaleEnd && <FlashSaleTimer endTime={flashSaleEnd} />}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold">
            Shop by <span className="text-accent">Category</span>
          </h2>
          <Link
            href="/categories"
            className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:border-accent hover:text-accent transition-colors"
          >
            View All
          </Link>
        </div>
        <CategoryGrid />
      </section>

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
              <code className="bg-white/10 px-2 py-1 rounded font-bold">LAUNCH20</code> for extra
              20% off
            </p>
            <Link
              href="/products?category=electronics"
              className="bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
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
          <Link
            href="/products?sort=popular"
            className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:border-accent hover:text-accent transition-colors"
          >
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
          <Link
            href="/products?sort=newest"
            className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:border-accent hover:text-accent transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {(newArrivals || Array(8).fill(null)).map((p, i) => (
            <ProductCard key={p?._id || i} product={p} loading={!p} />
          ))}
        </div>
      </section>
    </>
  );
}

HomePage.getLayout = (page) => <Layout>{page}</Layout>;