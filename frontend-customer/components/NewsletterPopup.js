import { useState, useEffect } from "react";

const STORAGE_KEY = "digisho_newsletter_dismissed";

export default function NewsletterPopup() {
  const [visible, setVisible]   = useState(false);
  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    // Show popup after 8 seconds, only if not dismissed before
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Simulate API call — replace with your actual newsletter API
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
    localStorage.setItem(STORAGE_KEY, "true");
    setTimeout(() => setVisible(false), 3000);
  };

  if (!visible) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 px-4 pb-4 md:pb-0"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      {/* Modal */}
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#e94560] px-6 pt-8 pb-10 text-white text-center relative">
          <button
            onClick={dismiss}
            className="absolute top-3 right-4 text-white/60 hover:text-white text-xl transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="text-4xl mb-3">📧</div>
          <h2 className="font-display text-2xl font-bold mb-1">Get 10% Off!</h2>
          <p className="text-white/80 text-sm">
            Subscribe to our newsletter and get exclusive deals delivered straight to your inbox.
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-6 -mt-4">
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-semibold text-primary">You're subscribed!</p>
              <p className="text-sm text-gray-500 mt-1">Check your email for your 10% off coupon code.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-white font-semibold rounded-xl py-3 text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {loading ? "Subscribing..." : "Subscribe & Get 10% Off →"}
              </button>
              <p className="text-center text-xs text-gray-400">
                No spam, unsubscribe anytime.
              </p>
            </form>
          )}
          <button
            onClick={dismiss}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors"
          >
            No thanks, I'll pay full price
          </button>
        </div>
      </div>
    </div>
  );
}