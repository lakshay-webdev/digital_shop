import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCartStore } from "../store";

const fmt = (n) => `₹${n?.toLocaleString("en-IN")}`;

// ── Coupon logic ─────────────────────────────────────────────
const COUPONS = {
  LAUNCH20:  { type: "percent", value: 20 },
  SAVE100:   { type: "flat",    value: 100 },
  WELCOME10: { type: "percent", value: 10 },
};

const FREE_DELIVERY_THRESHOLD = 499;

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQty, total: getTotal } = useCartStore();
  const total = typeof getTotal === "function" ? getTotal() : getTotal;

  const [couponCode, setCouponCode]   = useState("");
  const [appliedCoupon, setApplied]   = useState(null); // { code, discount }
  const [couponLoading, setCLoading]  = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Calculations ─────────────────────────────────────────
  const totalQty       = items.reduce((s, i) => s + i.qty, 0);
  const totalMRP       = items.reduce((s, i) => s + (i.mrp || i.price) * i.qty, 0);
  const totalSavings   = totalMRP - total;
  const couponDiscount = appliedCoupon?.discount || 0;
  const deliveryCharge = total >= FREE_DELIVERY_THRESHOLD ? 0 : 49;
  const grandTotal     = total - couponDiscount + deliveryCharge;
  const toFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - total);

  // ── Coupon apply ─────────────────────────────────────────
  const applyCoupon = async () => {
    const key = couponCode.trim().toUpperCase();
    if (!key) return;
    setCLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setCLoading(false);
    const c = COUPONS[key];
    if (!c) { toast.error("Invalid coupon ❌"); return; }
    const discount = c.type === "percent"
      ? Math.round((total * c.value) / 100)
      : c.value;
    setApplied({ code: key, discount });
    toast.success(`Coupon applied! Saved ${fmt(discount)} 🎁`);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={closeCart} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-lg font-bold">🛒 My Cart</h2>
            <p className="text-xs text-gray-400">{totalQty} item{totalQty !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-lg transition-colors"
          >×</button>
        </div>

        {/* ── Free delivery progress bar ───────────────────── */}
        {items.length > 0 && toFreeDelivery > 0 && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-xs text-amber-800 font-medium mb-1.5">
              Add <span className="font-bold">{fmt(toFreeDelivery)}</span> more for FREE delivery 🚚
            </p>
            <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {items.length > 0 && toFreeDelivery === 0 && (
          <div className="px-5 py-2.5 bg-green-50 border-b border-green-100 text-xs text-green-700 font-medium flex items-center gap-1.5">
            🎉 You've unlocked <span className="font-bold">FREE Delivery!</span>
          </div>
        )}

        {/* ── Items ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <span className="text-7xl">🛒</span>
              <p className="font-semibold text-gray-700">Your cart is empty</p>
              <p className="text-sm text-gray-400">Looks like you haven't added anything yet!</p>
              <button
                onClick={closeCart}
                className="mt-2 bg-accent text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Start Shopping →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const itemSaving = item.mrp ? (item.mrp - item.price) * item.qty : 0;
                return (
                  <div key={`${item._id}-${item.variant}`} className="flex gap-3 bg-gray-50 rounded-2xl p-3">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 flex-shrink-0 overflow-hidden relative">
                      {item.thumbnail ? (
                        <Image src={item.thumbnail} alt={item.name} fill className="object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</p>
                      {item.variant && (
                        <p className="text-[10px] text-gray-400 mt-0.5 bg-gray-200 inline-block px-1.5 py-0.5 rounded">{item.variant}</p>
                      )}

                      {/* Price row */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-accent font-bold text-sm">{fmt(item.price)}</span>
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-[10px] text-gray-400 line-through">{fmt(item.mrp)}</span>
                        )}
                      </div>

                      {/* Saving per item */}
                      {itemSaving > 0 && (
                        <p className="text-[10px] text-green-600 font-medium">You save {fmt(itemSaving)}</p>
                      )}

                      {/* Qty + Remove */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQty(item._id, item.qty - 1, item.variant)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 font-bold text-sm transition-colors"
                          >−</button>
                          <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item._id, item.qty + 1, item.variant)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 font-bold text-sm transition-colors"
                          >+</button>
                        </div>
                        <button
                          onClick={() => removeItem(item._id, item.variant)}
                          className="text-[11px] text-red-400 hover:text-red-600 transition-colors"
                        >🗑 Remove</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">

            {/* Coupon input */}
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  className="flex-1 border-2 border-dashed border-gray-200 focus:border-accent rounded-xl px-3 py-2 text-sm outline-none font-mono tracking-widest transition-colors"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-xs font-bold text-green-700">{appliedCoupon.code} applied 🎉</p>
                  <p className="text-[11px] text-green-600">Saved {fmt(couponDiscount)}</p>
                </div>
                <button onClick={() => { setApplied(null); setCouponCode(""); }} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>MRP Total</span>
                <span>{fmt(totalMRP)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Product Discount</span>
                  <span>− {fmt(totalSavings)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>− {fmt(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span className={deliveryCharge === 0 ? "text-green-600 font-medium" : ""}>
                  {deliveryCharge === 0 ? "FREE" : fmt(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>Grand Total</span>
                <span className="text-accent text-xl">{fmt(grandTotal)}</span>
              </div>
              {(totalSavings + couponDiscount) > 0 && (
                <p className="text-center text-xs text-green-600 font-semibold bg-green-50 rounded-lg py-1.5">
                  🎉 Total Savings: {fmt(totalSavings + couponDiscount)}
                </p>
              )}
            </div>

            {/* CTA */}
            <Link href="/checkout" onClick={closeCart}>
              <button className="w-full bg-accent text-white rounded-xl py-3.5 font-bold hover:bg-red-600 transition-colors text-base shadow-lg shadow-accent/20">
                Proceed to Checkout →
              </button>
            </Link>

            <p className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
              🔒 Secure checkout · UPI · Cards · NetBanking
            </p>
          </div>
        )}
      </div>
    </>
  );
}