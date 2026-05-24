// components/CouponInput.js
// Usage: <CouponInput subtotal={subtotal} onApply={(discount) => setDiscount(discount)} />
import { useState } from "react";
import toast from "react-hot-toast";

// ✅ Add your valid coupon codes here
const COUPONS = {
  LAUNCH20:  { type: "percent", value: 20,   label: "20% off" },
  SAVE100:   { type: "flat",    value: 100,  label: "₹100 off" },
  FIRST50:   { type: "percent", value: 50,   label: "50% off (first order)" },
  WELCOME10: { type: "percent", value: 10,   label: "10% off" },
};

export default function CouponInput({ subtotal = 0, onApply }) {
  const [code, setCode]         = useState("");
  const [applied, setApplied]   = useState(null); // { code, discount, label }
  const [loading, setLoading]   = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate API call
    setLoading(false);

    const coupon = COUPONS[trimmed];
    if (!coupon) {
      toast.error("Invalid coupon code ❌");
      return;
    }

    const discount =
      coupon.type === "percent"
        ? Math.round((subtotal * coupon.value) / 100)
        : coupon.value;

    setApplied({ code: trimmed, discount, label: coupon.label });
    onApply?.(discount);
    toast.success(`Coupon applied! ${coupon.label} 🎁`);
  };

  const handleRemove = () => {
    setApplied(null);
    setCode("");
    onApply?.(0);
    toast("Coupon removed", { icon: "🗑️" });
  };

  return (
    <div className="border border-gray-100 rounded-2xl p-4 bg-white">
      <p className="text-sm font-semibold text-primary mb-3">🎁 Apply Coupon</p>

      {applied ? (
        // Applied state
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-bold text-green-700">{applied.code}</p>
            <p className="text-xs text-green-600">
              {applied.label} — You save ₹{applied.discount.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
          >
            Remove
          </button>
        </div>
      ) : (
        // Input state
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors uppercase tracking-widest font-mono"
          />
          <button
            onClick={handleApply}
            disabled={loading || !code.trim()}
            className="bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? "..." : "Apply"}
          </button>
        </div>
      )}

      {/* Hint */}
      {!applied && (
        <p className="text-xs text-gray-400 mt-2">
          Try: <span className="font-mono font-medium text-accent">LAUNCH20</span> for 20% off
        </p>
      )}
    </div>
  );
}