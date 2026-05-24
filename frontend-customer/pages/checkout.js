import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { useCartStore, useAuthStore } from "../store";
import { orderAPI, couponAPI, paymentAPI } from "../lib/api";

const PAYMENT_METHODS = [
  { id: "cod",       label: "Cash on Delivery",    icon: "💵", desc: "Pay when order arrives" },
  { id: "upi",       label: "UPI Payment",         icon: "📱", desc: "PhonePe, GPay, Paytm" },
  { id: "card",      label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, RuPay" },
  { id: "razorpay",  label: "Razorpay",            icon: "⚡", desc: "All payment methods" },
  { id: "wallet",    label: "DigiWallet",          icon: "👛", desc: "Wallet balance: ₹0" },
];

const fmt = (n) => `₹${n?.toLocaleString("en-IN")}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCartStore();
  const { user }  = useAuthStore();

  const [payMethod, setPayMethod] = useState("upi");
  const [coupon,    setCoupon]    = useState({ code: "", discount: 0, applied: false });
  const [loading,   setLoading]   = useState(false);

  const [address, setAddress] = useState({
    fullName: user?.name || "", phone: "", line1: "", line2: "",
    city: "", state: "Maharashtra", pinCode: "",
  });

  const delivery  = total - coupon.discount > 499 ? 0 : 49;
  const tax       = Math.round((total - coupon.discount) * 0.18);
  const grandTotal= total - coupon.discount + delivery + tax;

  const handleCoupon = async () => {
    if (!coupon.code) return;
    try {
      const { data } = await couponAPI.validate(coupon.code, total);
      setCoupon((c) => ({ ...c, discount: data.discount, applied: true }));
      toast.success(`Coupon applied! You saved ${fmt(data.discount)} 🎉`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Invalid coupon");
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.fullName || !address.phone || !address.line1 || !address.city || !address.pinCode) {
      toast.error("Please fill all address fields");
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
              items: items.map((i) => ({ product: i._id, quantity: i.qty, variant: i.variant })),
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
          prefill: { name: user?.name, email: user?.email },
          theme:   { color: "#e94560" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        const { data } = await orderAPI.place({
          items: items.map((i) => ({ product: i._id, quantity: i.qty, variant: i.variant })),
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

  return (
    <>
      <Head><title>Checkout | DigiSho</title></Head>
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="font-display text-3xl font-bold mb-8">🔒 Secure Checkout</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left — Address + Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Address */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="font-display text-lg font-bold mb-5 pb-4 border-b border-gray-100">📍 Delivery Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Full Name", "fullName", "text", "Rahul Sharma"],
                    ["Phone",     "phone",    "tel",  "+91 98765 43210"],
                    ["Address Line 1", "line1", "text", "House No., Street, Area", "col-span-2"],
                    ["Address Line 2", "line2", "text", "Landmark (optional)",    "col-span-2"],
                    ["City",      "city",     "text",  "Mumbai"],
                    ["PIN Code",  "pinCode",  "text",  "400001"],
                  ].map(([label, name, type, placeholder, cls]) => (
                    <div key={name} className={cls || ""}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={address[name]}
                        onChange={(e) => setAddress({ ...address, [name]: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">State</label>
                    <select
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    >
                      {["Maharashtra","Delhi","Karnataka","Tamil Nadu","Gujarat","Rajasthan","West Bengal","Telangana","Kerala","Punjab"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
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

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item._id} className="flex justify-between text-sm">
                      <span className="text-gray-600 flex-1">{item.name?.slice(0, 28)} ×{item.qty}</span>
                      <span className="font-medium ml-2">{fmt(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  {[
                    ["Subtotal",  fmt(total),                ""],
                    ["Delivery",  delivery === 0 ? "FREE" : fmt(delivery), delivery === 0 ? "text-green-600" : ""],
                    ["Tax (GST)", fmt(tax),                  "text-gray-500"],
                    ...(coupon.discount > 0 ? [["Coupon Discount", `-${fmt(coupon.discount)}`, "text-green-600"]] : []),
                  ].map(([label, val, cls]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-600">{label}</span>
                      <span className={`font-medium ${cls}`}>{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-100">
                    <span>Total Payable</span>
                    <span className="text-accent text-xl">{fmt(grandTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full mt-5 bg-accent text-white rounded-xl py-4 font-bold text-base hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Placing Order..." : "Place Order →"}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">🔒 256-bit SSL Secured Payment</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
