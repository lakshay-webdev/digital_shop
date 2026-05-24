import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_KEY = "digisho_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only if user hasn't consented yet
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1a1a2e] text-white px-4 py-4 md:py-5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Text */}
        <div className="flex-1 text-sm text-white/80 leading-relaxed">
          <span className="text-lg mr-2">🍪</span>
          We use cookies to improve your shopping experience, analyze traffic, and personalize content.
          By clicking <strong className="text-white">Accept</strong>, you agree to our{" "}
          <Link href="/privacy" className="underline text-accent hover:text-red-400 transition-colors">
            Privacy Policy
          </Link>
          .
        </div>

        {/* Buttons */}
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-white/60 border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm bg-accent text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}