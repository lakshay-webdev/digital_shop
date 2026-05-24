import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { orderAPI } from "../../lib/api";
import { useAuthStore } from "../../store";

const fmt   = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_STEPS = [
  { key: "pending",          label: "Ordered",       icon: "📋" },
  { key: "confirmed",        label: "Confirmed",     icon: "✅" },
  { key: "packed",           label: "Packed",        icon: "📦" },
  { key: "shipped",          label: "Shipped",       icon: "🚚" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🏍️" },
  { key: "delivered",        label: "Delivered",     icon: "🎉" },
];

const STATUS_STYLE = {
  pending:           "bg-amber-50 text-amber-700",
  confirmed:         "bg-blue-50 text-blue-700",
  packed:            "bg-indigo-50 text-indigo-700",
  shipped:           "bg-purple-50 text-purple-700",
  out_for_delivery:  "bg-cyan-50 text-cyan-700",
  delivered:         "bg-green-50 text-green-700",
  cancelled:         "bg-red-50 text-red-700",
  returned:          "bg-orange-50 text-orange-700",
  return_requested:  "bg-orange-50 text-orange-700",
  refunded:          "bg-gray-100 text-gray-600",
};

function OrdersPage() {
  const { user } = useAuthStore();
  const router   = useRouter();

  if (!user) { router.push("/login?redirect=/orders"); return null; }

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn:  () => orderAPI.getMy().then(r => r.data),
  });

  const qc = useQueryClient();
  const cancelMutation = useMutation({
    mutationFn: (id) => orderAPI.cancel(id),
    onSuccess:  () => { qc.invalidateQueries(["my-orders"]); toast.success("Order cancelled"); },
    onError:    (e) => toast.error(e.response?.data?.message || "Cannot cancel"),
  });

  return (
    <>
      <Head><title>My Orders | DigiSho</title></Head>
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="font-display text-2xl font-bold mb-6">My Orders</h1>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : data?.orders?.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-lg font-semibold mb-2">No orders yet</p>
              <Link href="/products" className="text-accent hover:underline text-sm">Start shopping →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(data?.orders || []).map((order) => {
                const stepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
                return (
                  <div key={order._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Order ID</p>
                          <p className="font-bold text-sm text-accent">#{order.orderId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Date</p>
                          <p className="text-sm font-medium">{fmtDt(order.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Total</p>
                          <p className="text-sm font-bold">{fmt(order.totalAmount)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${STATUS_STYLE[order.status] || "bg-gray-100 text-gray-600"}`}>
                          {order.status?.replace(/_/g, " ")}
                        </span>
                        <Link href={`/orders/${order._id}`}
                          className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                          View Details
                        </Link>
                        {["pending","confirmed"].includes(order.status) && (
                          <button onClick={() => { if (confirm("Cancel this order?")) cancelMutation.mutate(order._id); }}
                            className="text-xs border border-red-100 text-red-500 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 transition-colors">
                            Cancel
                          </button>
                        )}
                        {order.status === "delivered" && (
                          <button onClick={() => toast("Return request page coming soon")}
                            className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                            Return
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="px-5 py-3 flex items-center gap-3 overflow-x-auto">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-xl">📦</div>
                          <div>
                            <p className="text-xs font-medium max-w-[120px] truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <p className="text-xs text-gray-400 flex-shrink-0">+{order.items.length - 3} more</p>
                      )}
                    </div>

                    {/* Progress tracker (non-cancelled) */}
                    {!["cancelled","returned","refunded","return_requested"].includes(order.status) && (
                      <div className="px-5 pb-4">
                        <div className="flex items-center">
                          {STATUS_STEPS.map((step, i) => {
                            const done   = i <= stepIdx;
                            const active = i === stepIdx;
                            return (
                              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                                {/* Connector */}
                                {i < STATUS_STEPS.length - 1 && (
                                  <div className={`absolute top-4 left-1/2 w-full h-0.5 z-0 ${i < stepIdx ? "bg-green-400" : "bg-gray-100"}`} />
                                )}
                                {/* Dot */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 relative transition-all ${
                                  done ? "bg-green-500 text-white shadow-sm" : "bg-gray-100 text-gray-400"
                                } ${active ? "ring-2 ring-green-300 ring-offset-1" : ""}`}>
                                  {step.icon}
                                </div>
                                <p className={`text-[9px] mt-1 text-center font-medium ${done ? "text-green-600" : "text-gray-400"}`}>
                                  {step.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        {order.trackingNumber && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Tracking: <span className="font-semibold text-primary">{order.trackingNumber}</span>
                            {order.courier && ` via ${order.courier}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

export default dynamic(() => Promise.resolve(OrdersPage), { ssr: false });
