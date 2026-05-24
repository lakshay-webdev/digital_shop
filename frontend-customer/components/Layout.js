import Navbar from "./Navbar";
import CartSidebar from "./CartSidebar";
import Link from "next/link";
import ScrollToTop     from "./ScrollToTop";
import WhatsAppButton  from "./WhatsAppButton";
import CookieConsent   from "./CookieConsent";
import NewsletterPopup from "./NewsletterPopup";
import CompareBar      from "./CompareBar";

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <CartSidebar />
      <main>{children}</main>

      <footer className="bg-[#1a1a2e] text-white/60 mt-16 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h2 className="font-display text-xl font-bold mb-3">
                <span className="text-[#e94560]">Digi</span>
                <span className="text-white/60">Sho</span>
              </h2>
              <p className="text-sm leading-relaxed">
                India's premium multi-vendor marketplace. Shop from thousands of verified sellers with confidence.
              </p>
              <div className="flex gap-2 mt-4">
                {["📘","🐦","📸","▶️"].map(icon => (
                  <div key={icon} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors text-sm">
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            {[
              ["Company",  ["About Us","Careers","Press","Blog","Investor Relations"]],
              ["Customer", ["Help Center","Track Order","Returns","Shipping Info","Bulk Orders"]],
              ["Legal",    ["Privacy Policy","Terms of Use","Cookie Policy","Sitemap","Accessibility"]],
            ].map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-white font-semibold text-sm mb-3">{heading}</h4>
                <ul className="space-y-2">
                  {links.map(l => (
                    <li key={l}>
                      <Link href="#" className="text-xs hover:text-white transition-colors">{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs">© {new Date().getFullYear()} DigiSho Pvt. Ltd. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {["💳","🏦","📱","💵"].map(icon => (
                  <span key={icon} className="bg-white/10 rounded px-2 py-1 text-sm">{icon}</span>
                ))}
              </div>
              {/* Admin link removed for security */}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Global floating components ── */}
      <ScrollToTop />
      <WhatsAppButton />
      <CompareBar />

      {/* ── Overlays / banners ── */}
      <CookieConsent />
      <NewsletterPopup />
    </>
  );
}