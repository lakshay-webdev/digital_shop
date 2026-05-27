import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { useCartStore, useAuthStore } from "../store";
import { orderAPI, couponAPI, paymentAPI } from "../lib/api";

const PAYMENT_METHODS = [
  { id: "cod",      label: "Cash on Delivery",    icon: "💵", desc: "Pay when order arrives" },
  { id: "upi",      label: "UPI Payment",         icon: "📱", desc: "PhonePe, GPay, Paytm" },
  { id: "card",     label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, RuPay" },
  { id: "razorpay", label: "Razorpay",            icon: "⚡", desc: "All payment methods" },
  { id: "wallet",   label: "DigiWallet",          icon: "👛", desc: "Wallet balance: ₹0" },
];

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ✅ Validators
const isValidPhone  = (v) => /^[6-9]\d{9}$/.test(v);
const isValidPin    = (v) => /^\d{6}$/.test(v);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total: getTotal, clear } = useCartStore();
  const { user } = useAuthStore();

  // ✅ FIX: total is a function in Zustand store — call it with ()
  const total = typeof getTotal === "function" ? getTotal() : getTotal;

  const [payMethod, setPayMethod] = useState("upi");
  const [coupon,    setCoupon]    = useState({ code: "", discount: 0, applied: false });
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});

  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone:    "",
    line1:    "",
    line2:    "",
    city:     "",
    state:    "Maharashtra",
    pinCode:  "",
  });

  // ✅ FIX: Calculation — all based on actual total (function call)
  const subtotal   = total;
  const discount   = coupon.discount || 0;
  const afterCoupon= Math.max(0, subtotal - discount);
  const delivery   = afterCoupon > 499 ? 0 : 49;
  const tax        = Math.round(afterCoupon * 0.18);
  const grandTotal = afterCoupon + delivery + tax;

  // ✅ Phone — only digits, max 10
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setAddress({ ...address, phone: val });
    if (errors.phone) setErrors({ ...errors, phone: "" });
  };

  // ✅ PIN — only digits, max 6
  const handlePinChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setAddress({ ...address, pinCode: val });
    if (errors.pinCode) setErrors({ ...errors, pinCode: "" });
  };

  // ✅ Full address validation
  const validateAddress = () => {
    const errs = {};
    if (!address.fullName.trim())           errs.fullName = "Full name required";
    if (!isValidPhone(address.phone))       errs.phone    = "Enter valid 10-digit mobile (starts with 6-9)";
    if (!address.line1.trim())              errs.line1    = "Address line 1 required";
    if (!address.city.trim())               errs.city     = "City required";
    if (!isValidPin(address.pinCode))       errs.pinCode  = "Enter valid 6-digit PIN code";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCoupon = async () => {
    if (!coupon.code) return;
    try {
      const { data } = await couponAPI.validate(coupon.code, subtotal);
      setCoupon((c) => ({ ...c, discount: data.discount, applied: true }));
      toast.success(`Coupon applied! You saved ${fmt(data.discount)} 🎉`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Invalid coupon");
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) {
      toast.error("Please fix the errors in your address");
      return;
    }
    if (!items.length) { toast.error("Cart is empty"); return; }

    setLoading(true);
    try {
      if (payMethod === "razorpay") {
        const { data: rzpOrder } = await paymentAPI.createRazorpayOrder(grandTotal);
        const options = {
          key:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount:   rzpOrder.order.amount,
          currency: "INR",
          name:     "DigiSho",
          order_id: rzpOrder.order.id,
          handler:  async (response) => {
            const { data: order } = await orderAPI.place({
              items:           items.map((i) => ({ product: i._id, quantity: i.qty, variant: i.variant })),
              shippingAddress: address,
              paymentMethod:   "razorpay",
              razorpayOrderId: rzpOrder.order.id,
              paymentId:       response.razorpay_payment_id,
              couponCode:      coupon.applied ? coupon.code : undefined,
            });
            await paymentAPI.verifyRazorpay({ ...response, orderId: order.order._id });
            clear();
            router.push(`/orders/${order.order._id}?success=true`);
          },
          prefill: { name: user?.name, email: user?.email, contact: address.phone },
          theme:   { color: "#e94560" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        const { data } = await orderAPI.place({
          items:           items.map((i) => ({ product: i._id, quantity: i.qty, variant: i.variant })),
          shippingAddress: address,
          paymentMethod:   payMethod,
          couponCode:      coupon.applied ? coupon.code : undefined,
        });
        clear();
        router.push(`/orders/${data.order._id}?success=true`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
      errors[field] ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-accent"
    }`;

  return (
    <>
      <Head><title>Checkout | DigiSho</title></Head>
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="font-display text-3xl font-bold mb-8">🔒 Secure Checkout</h1>

          {/* Empty cart check */}
          {items.length === 0 && (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🛒</p>
              <p className="text-xl font-bold mb-2">Your cart is empty</p>
              <button onClick={() => router.push("/products")} className="mt-4 bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors">
                Shop Now →
              </button>
            </div>
          )}

          {items.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left — Address + Payment */}
              <div className="lg:col-span-2 space-y-6">

                {/* Address */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6">
                  <h2 className="font-display text-lg font-bold mb-5 pb-4 border-b border-gray-100">📍 Delivery Address</h2>
                  <div className="grid grid-cols-2 gap-4">

                    {/* Full Name */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Name *</label>
                      <input
                        type="text"
                        placeholder="Rahul Sharma"
                        value={address.fullName}
                        onChange={(e) => { setAddress({ ...address, fullName: e.target.value }); setErrors({ ...errors, fullName: "" }); }}
                        className={inputCls("fullName")}
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    {/* ✅ Phone — only digits allowed */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="98765 43210"
                          value={address.phone}
                          onChange={handlePhoneChange}
                          className={`${inputCls("phone")} pl-12`}
                          maxLength={10}
                        />
                      </div>
                      {errors.phone
                        ? <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                        : address.phone.length > 0 && address.phone.length < 10
                          ? <p className="text-amber-500 text-xs mt-1">{10 - address.phone.length} more digits needed</p>
                          : address.phone.length === 10 && isValidPhone(address.phone)
                            ? <p className="text-green-600 text-xs mt-1">✓ Valid number</p>
                            : null
                      }
                    </div>

                    {/* Address Line 1 */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        placeholder="House No., Street, Area"
                        value={address.line1}
                        onChange={(e) => { setAddress({ ...address, line1: e.target.value }); setErrors({ ...errors, line1: "" }); }}
                        className={inputCls("line1")}
                      />
                      {errors.line1 && <p className="text-red-500 text-xs mt-1">{errors.line1}</p>}
                    </div>

                    {/* Address Line 2 */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address Line 2 <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="Landmark, Building name"
                        value={address.line2}
                        onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">City *</label>
                      <input
                        type="text"
                        placeholder="Mumbai"
                        value={address.city}
                        onChange={(e) => { setAddress({ ...address, city: e.target.value }); setErrors({ ...errors, city: "" }); }}
                        className={inputCls("city")}
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>

                    {/* ✅ PIN Code — only digits */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">PIN Code *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="400001"
                        value={address.pinCode}
                        onChange={handlePinChange}
                        className={inputCls("pinCode")}
                        maxLength={6}
                      />
                      {errors.pinCode && <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>}
                    </div>

                    {/* State */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">State *</label>
                      <select
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      >
                        {STATES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6">
                  <h2 className="font-display text-lg font-bold mb-5 pb-4 border-b border-gray-100">💳 Payment Method</h2>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((m) => (
                      <label
                        key={m.id}
                        onClick={() => setPayMethod(m.id)}
                        className={`flex items-center gap-4 border rounded-xl p-4 cursor-pointer transition-all ${
                          payMethod === m.id ? "border-accent bg-red-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input type="radio" checked={payMethod === m.id} readOnly className="accent-accent" />
                        <span className="text-xl">{m.icon}</span>
                        <div>
                          <p className="font-semibold text-sm">{m.label}</p>
                          <p className="text-xs text-gray-500">{m.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Coupon */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6">
                  <h2 className="font-display text-lg font-bold mb-4 pb-4 border-b border-gray-100">🏷️ Apply Coupon</h2>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter coupon code (e.g. SAVE10)"
                      value={coupon.code}
                      onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase(), applied: false })}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent uppercase"
                      disabled={coupon.applied}
                    />
                    {coupon.applied
                      ? <button onClick={() => setCoupon({ code: "", discount: 0, applied: false })} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Remove</button>
                      : <button onClick={handleCoupon} className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">Apply</button>
                    }
                  </div>
                  {coupon.applied && (
                    <p className="mt-2 text-sm text-green-600 font-medium">✓ Coupon applied! You save {fmt(coupon.discount)}</p>
                  )}
                </div>
              </div>

              {/* Right — Order Summary */}
              <div>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sticky top-20">
                  <h2 className="font-display text-lg font-bold mb-5 pb-4 border-b border-gray-100">🧾 Order Summary</h2>

                  {/* Items list */}
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {items.map((item) => (
                      <div key={`${item._id}-${item.variant}`} className="flex justify-between text-sm">
                        <span className="text-gray-600 flex-1 leading-tight">{item.name?.slice(0, 28)} ×{item.qty}</span>
                        <span className="font-medium ml-2 flex-shrink-0">{fmt(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* ✅ Calculation breakdown */}
                  <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal ({items.reduce((s,i) => s+i.qty, 0)} items)</span>
                      <span className="font-medium">{fmt(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-600">Coupon Discount</span>
                        <span className="font-medium text-green-600">−{fmt(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery</span>
                      <span className={`font-medium ${delivery === 0 ? "text-green-600" : ""}`}>
                        {delivery === 0 ? "FREE" : fmt(delivery)}
                      </span>
                    </div>
                    {delivery === 0 && (
                      <p className="text-xs text-green-600">🎉 Free delivery on orders above ₹499</p>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax (GST 18%)</span>
                      <span className="font-medium text-gray-500">{fmt(tax)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-100">
                      <span>Total Payable</span>
                      <span className="text-accent text-xl">{fmt(grandTotal)}</span>
                    </div>
                    {discount > 0 && (
                      <p className="text-xs text-green-600 font-medium text-center pt-1">
                        🎉 You're saving {fmt(discount)} on this order!
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full mt-5 bg-accent text-white rounded-xl py-4 font-bold text-base hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Placing Order..." : `Place Order → ${fmt(grandTotal)}`}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3">🔒 256-bit SSL Secured Payment</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}