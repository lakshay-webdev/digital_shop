import Link from "next/link";
import { useState, useEffect } from "react";

// ── Beautiful empty state (jab backend connected nahi) ──────────────────────
function EmptyHero() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] min-h-[340px] md:min-h-[420px] flex items-center">

        {/* Background blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-8 md:px-16 py-12 max-w-2xl">
          {/* Badge */}
          <span className="inline-block bg-accent/20 text-accent text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-5 border border-accent/30">
            🔥 New Season Sale
          </span>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
            Shop Premium<br />
            <span className="text-accent">Products</span> Online
          </h1>

          <p className="text-white/70 text-base md:text-lg mb-8 leading-relaxed">
            India's most trusted marketplace. Thousands of verified sellers, crores of products — all at your fingertips.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-7 py-3.5 rounded-full hover:bg-red-600 transition-all hover:scale-105 shadow-lg shadow-accent/30"
            >
              Shop Now →
            </Link>
            <Link
              href="/products?sort=newest"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-white/20 transition-all border border-white/20"
            >
              New Arrivals ✨
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-6 mt-10">
            {[
              { icon: "🚚", label: "Free Delivery" },
              { icon: "🔒", label: "Secure Payments" },
              { icon: "↩️", label: "Easy Returns" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/60 text-sm">
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side decorative stat cards */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3">
          {[
            { value: "2M+",  label: "Happy Customers" },
            { value: "500K+",label: "Products" },
            { value: "4.8★", label: "Avg Rating" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-right">
              <p className="text-white font-bold text-xl">{value}</p>
              <p className="text-white/50 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Autoplay carousel (jab banners aate hain backend se) ────────────────────
const AUTOPLAY_INTERVAL = 4000;

const GRADIENT_THEMES = [
  "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
  "from-[#1a1a2e] via-purple-900 to-[#1a1a2e]",
  "from-[#0f3460] via-[#533483] to-[#1a1a2e]",
];

export default function HeroBanner({ banners = [] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return <EmptyHero />;

  const banner = banners[current];

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden rounded-3xl min-h-[340px] md:min-h-[420px] flex items-center">

        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_THEMES[current % GRADIENT_THEMES.length]} transition-all duration-700`} />

        {/* Blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 px-8 md:px-16 py-12 max-w-2xl">
          <span className="inline-block bg-accent/20 text-accent text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-5 border border-accent/30">
            {banner.label || "🔥 Featured"}
          </span>

          <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            {banner.title || "Special Offer"}
          </h2>

          <p className="text-white/70 text-base mb-8 leading-relaxed">
            {banner.description || "Discover our latest collection with huge savings."}
          </p>

          <Link
            href={banner.url || "/products"}
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-7 py-3.5 rounded-full hover:bg-red-600 transition-all hover:scale-105 shadow-lg shadow-accent/30"
          >
            {banner.cta || "Explore Now"} →
          </Link>
        </div>

        {/* Dot indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? "w-6 h-2 bg-accent" : "w-2 h-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Prev/Next arrows — desktop only */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white hidden md:flex items-center justify-center transition-all"
            >‹</button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % banners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white hidden md:flex items-center justify-center transition-all"
            >›</button>
          </>
        )}
      </div>
    </section>
  );
}