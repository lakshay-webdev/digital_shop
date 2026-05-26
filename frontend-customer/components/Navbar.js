import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { useCartStore, useAuthStore, useWishlistStore } from "../store";
import { productAPI } from "../lib/api";

const CATEGORIES = [
  { label: "Electronics",   slug: "electronics" },
  { label: "Fashion",       slug: "fashion" },
  { label: "Home & Living", slug: "home-and-living" },
  { label: "Beauty",        slug: "beauty" },
  { label: "Gaming",        slug: "gaming" },
  { label: "Books",         slug: "books" },
  { label: "Sports",        slug: "sports" },
];

export default function Navbar() {
  const router = useRouter();
  const [search, setSearch]                   = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen]       = useState(false);
  const searchRef   = useRef(null);
  const userMenuRef = useRef(null);

  const { items, openCart } = useCartStore();
  const { user, logout }    = useAuthStore();
  const { items: wishlist } = useWishlistStore();

  const itemCount      = items.reduce((s, i) => s + i.qty, 0);
  const activeCategory = router.query.category || "";

  const { data: suggestions } = useQuery({
    queryKey: ["search", search],
    queryFn:  () => productAPI.search(search).then((r) => r.data.suggestions),
    enabled:  search.length >= 2,
    staleTime: 0,
  });

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close user menu on route change
  useEffect(() => { setUserMenuOpen(false); }, [router.pathname]);

  // ✅ FIX: suggestions close + search clear on route change
  useEffect(() => {
    setShowSuggestions(false);
    setSearch("");
  }, [router.asPath]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      setShowSuggestions(false);
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  // ✅ FIX: Suggestion click — use router.push instead of relying on Link alone
  const handleSuggestionClick = (slug) => {
    setShowSuggestions(false);
    setSearch("");
    router.push(`/products/${slug}`);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 md:px-4">

        {/* ── Row 1: Logo + Actions ───────────────────────────────── */}
        <div className="flex items-center gap-2 h-14 md:h-16">

          {/* Logo */}
          <Link href="/" className="font-display text-xl md:text-2xl font-bold text-accent flex-shrink-0">
            Digi<span className="text-primary">Sho</span>
          </Link>

          {/* Search bar — desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
            <form
              onSubmit={handleSearch}
              className="flex w-full border-2 border-gray-100 rounded-xl overflow-hidden focus-within:border-accent transition-colors"
            >
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                onFocus={() => search.length >= 2 && setShowSuggestions(true)}
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent"
              />
              <button type="submit" className="bg-accent text-white px-5 text-sm font-medium hover:bg-red-600 transition-colors">
                🔍
              </button>
            </form>

            {/* ✅ Desktop Suggestions */}
            {showSuggestions && suggestions?.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                {suggestions.map((p) => (
                  <button
                    key={p._id}
                    onMouseDown={() => handleSuggestionClick(p.slug)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    {p.thumbnail && (
                      <img
                        src={p.thumbnail}
                        alt={p.name}
                        className="w-8 h-8 object-contain rounded-md bg-gray-50 flex-shrink-0"
                      />
                    )}
                    <span className="text-xs text-gray-700 flex-1 line-clamp-1">{p.name}</span>
                    <span className="text-sm font-semibold text-accent flex-shrink-0">
                      ₹{p.price?.toLocaleString("en-IN")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions — right side */}
          <div className="flex items-center gap-0.5 md:gap-1 ml-auto">

            {/* User */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex flex-col items-center px-2 md:px-3 py-1 rounded-lg hover:bg-gray-50 text-xs font-medium gap-0.5"
                >
                  <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                    {user.name?.charAt(0)}
                  </div>
                  <span className="hidden md:block">{user.name?.split(" ")[0]}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg w-44 py-1 z-50">
                    <Link href="/profile"  onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">My Profile</Link>
                    <Link href="/orders"   onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">My Orders</Link>
                    <Link href="/wishlist" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Wishlist ({wishlist.length})</Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex flex-col items-center px-2 md:px-3 py-1 rounded-lg hover:bg-gray-50 text-xs font-medium gap-0.5">
                <span className="text-xl">👤</span>
                <span className="hidden md:block">Login</span>
              </Link>
            )}

            {/* Wishlist */}
            <Link href="/wishlist" className="hidden md:flex flex-col items-center px-3 py-1 rounded-lg hover:bg-gray-50 text-xs font-medium gap-0.5 relative">
              <span className="text-xl">🤍</span>
              Wishlist
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-1 bg-accent text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={openCart}
              className="flex flex-col items-center px-2 md:px-3 py-1 rounded-lg hover:bg-gray-50 text-xs font-medium gap-0.5 relative"
            >
              <span className="text-xl">🛒</span>
              <span className="hidden md:block">Cart</span>
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 md:right-1 bg-accent text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Row 2: Search — mobile only ────────────────────────── */}
        <div className="md:hidden pb-2 relative" ref={searchRef}>
          <form
            onSubmit={handleSearch}
            className="flex border-2 border-gray-100 rounded-xl overflow-hidden focus-within:border-accent transition-colors"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => search.length >= 2 && setShowSuggestions(true)}
              className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
            />
            <button type="submit" className="bg-accent text-white px-4 text-sm font-medium hover:bg-red-600 transition-colors">
              🔍
            </button>
          </form>

          {/* ✅ Mobile Suggestions */}
          {showSuggestions && suggestions?.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
              {suggestions.map((p) => (
                <button
                  key={p._id}
                  onMouseDown={() => handleSuggestionClick(p.slug)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors w-full text-left"
                >
                  {p.thumbnail && (
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="w-8 h-8 object-contain rounded-md bg-gray-50 flex-shrink-0"
                    />
                  )}
                  <span className="text-xs text-gray-700 flex-1 line-clamp-1">{p.name}</span>
                  <span className="text-sm font-semibold text-accent flex-shrink-0">
                    ₹{p.price?.toLocaleString("en-IN")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Row 3: Category Nav ─────────────────────────────────── */}
        <nav className="flex gap-4 md:gap-6 text-sm pb-2 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map(({ label, slug }) => {
            const isActive = activeCategory === slug;
            return (
              <Link
                key={slug}
                href={`/products?category=${slug}`}
                className={`whitespace-nowrap font-medium transition-colors pb-1 text-xs md:text-sm ${
                  isActive
                    ? "text-accent border-b-2 border-accent"
                    : "text-gray-600 hover:text-accent"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}