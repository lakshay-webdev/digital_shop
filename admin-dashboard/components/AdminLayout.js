import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import Cookies from "js-cookie";

const NAV_ITEMS = [
  { href: "/dashboard",  icon: "📊", label: "Dashboard"  },
  { href: "/products",   icon: "📦", label: "Products"   },
  { href: "/orders",     icon: "🛍️", label: "Orders"     },
  { href: "/users",      icon: "👥", label: "Users"      },
  { href: "/coupons",    icon: "🏷️", label: "Coupons"    },
  { href: "/banners",    icon: "🖼️", label: "Banners"    },
];

export default function AdminLayout({ children, title = "Admin" }) {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("admin_token") || localStorage.getItem("admin_token");
    if (!token) router.replace("/");
  }, [router]);

  const handleLogout = () => {
    Cookies.remove("admin_token");
    localStorage.removeItem("admin_token");
    router.push("/");
  };

  const isActive = (href) => router.pathname.startsWith(href);

  return (
    <>
      <Head>
        <title>{title} | DigiSho Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-[#f0f2f5] flex font-sans">
        {/* Sidebar */}
        <aside className="w-56 bg-[#1a1a2e] text-white flex-shrink-0 flex flex-col min-h-screen sticky top-0">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/10">
            <h1 className="font-display text-xl font-bold">
              <span className="text-[#e94560]">Digi</span>
              <span className="text-white/60">Sho</span>
            </h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Admin Panel</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4">
            {NAV_ITEMS.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                  isActive(href)
                    ? "bg-white/10 text-white border-l-[3px] border-[#e94560]"
                    : "text-white/60 border-l-[3px] border-transparent hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>

          {/* Bottom */}
          <div className="px-5 py-4 border-t border-white/10">
            <a
              href={process.env.NEXT_PUBLIC_CUSTOMER_URL || "http://localhost:3000"}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors mb-3"
            >
              🌐 View Store
            </a>
            <button
              onClick={handleLogout}
              className="w-full text-left text-xs text-white/40 hover:text-red-400 transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
              <div className="w-8 h-8 rounded-full bg-[#e94560] text-white flex items-center justify-center font-bold text-sm">A</div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
