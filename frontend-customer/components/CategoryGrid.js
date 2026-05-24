import Link from "next/link";

// ✅ All 7 categories matching Navbar — each with unique icon + color theme
const categories = [
  {
    title: "Electronics",
    slug:  "electronics",
    icon:  "💻",
    desc:  "Phones, Laptops & more",
    from:  "from-blue-500",
    to:    "to-blue-700",
    light: "bg-blue-50 border-blue-100 hover:border-blue-400 hover:text-blue-600",
    iconBg:"bg-blue-100",
  },
  {
    title: "Fashion",
    slug:  "fashion",
    icon:  "👗",
    desc:  "Trending styles & brands",
    from:  "from-pink-500",
    to:    "to-rose-600",
    light: "bg-pink-50 border-pink-100 hover:border-pink-400 hover:text-pink-600",
    iconBg:"bg-pink-100",
  },
  {
    title: "Home & Living",
    slug:  "home-and-living",
    icon:  "🛋️",
    desc:  "Furniture & décor",
    from:  "from-amber-500",
    to:    "to-orange-600",
    light: "bg-amber-50 border-amber-100 hover:border-amber-400 hover:text-amber-600",
    iconBg:"bg-amber-100",
  },
  {
    title: "Beauty",
    slug:  "beauty",
    icon:  "💄",
    desc:  "Skincare & cosmetics",
    from:  "from-purple-500",
    to:    "to-fuchsia-600",
    light: "bg-purple-50 border-purple-100 hover:border-purple-400 hover:text-purple-600",
    iconBg:"bg-purple-100",
  },
  {
    title: "Gaming",
    slug:  "gaming",
    icon:  "🎮",
    desc:  "Consoles, games & gear",
    from:  "from-green-500",
    to:    "to-emerald-700",
    light: "bg-green-50 border-green-100 hover:border-green-400 hover:text-green-600",
    iconBg:"bg-green-100",
  },
  {
    title: "Books",
    slug:  "books",
    icon:  "📚",
    desc:  "Bestsellers & textbooks",
    from:  "from-cyan-500",
    to:    "to-teal-600",
    light: "bg-cyan-50 border-cyan-100 hover:border-cyan-400 hover:text-cyan-600",
    iconBg:"bg-cyan-100",
  },
  {
    title: "Sports",
    slug:  "sports",
    icon:  "⚽",
    desc:  "Fitness & outdoor gear",
    from:  "from-red-500",
    to:    "to-rose-700",
    light: "bg-red-50 border-red-100 hover:border-red-400 hover:text-red-600",
    iconBg:"bg-red-100",
  },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/products?category=${cat.slug}`}
          className={`group relative overflow-hidden rounded-2xl border-2 bg-white p-4 md:p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${cat.light}`}
        >
          {/* Icon bubble */}
          <div className={`${cat.iconBg} w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mx-auto mb-3 transition-transform duration-200 group-hover:scale-110`}>
            {cat.icon}
          </div>

          <h3 className="text-sm md:text-base font-bold text-gray-800 group-hover:text-inherit leading-tight">
            {cat.title}
          </h3>

          <p className="mt-1 text-[11px] md:text-xs text-gray-400 leading-snug hidden sm:block">
            {cat.desc}
          </p>

          {/* Hover arrow */}
          <span className="absolute bottom-3 right-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
        </Link>
      ))}
    </div>
  );
}