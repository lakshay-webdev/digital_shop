import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { adminAPI } from "../../lib/api";

const fmt   = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_OPTS = [
  "pending","confirmed","packed","shipped","out_for_delivery","delivered","cancelled","returned","refunded"
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
  refunded:          "bg-gray-100 text-gray-600",
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [page,       setPage]      = useState(1);
  const [statusFilter, setStatus]  = useState("");
  const [search,     setSearch]    = useState("");
  const [expanded,   setExpanded]  = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, statusFilter, search],
    queryFn:  () => adminAPI.getOrders({ page, limit: 15, status: statusFilter, search }).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, trackingNumber, courier }) =>
      adminAPI.updateOrderStatus(id, { status, trackingNumber, courier }),
    onSuccess: () => {
      qc.invalidateQueries(["admin-orders"]);
      toast.success("Order status updated!");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Update failed"),
  });

  return (
    <AdminLayout title="Orders">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text" placeholder="Search by Order ID or customer..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex-1 max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {["", ...STATUS_OPTS.slice(0, 6)].map(s => (
            <button key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === s ? "bg-accent text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 self-center ml-auto">{data?.total || 0} orders</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading orders...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-5 py-3 font-semibold">Order</th>
                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                <th className="text-left px-5 py-3 font-semibold">Amount</th>
                <th className="text-left px-5 py-3 font-semibold">Payment</th>
                <th className="text-left px-5 py-3 font-semibold">Date</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody>
              {(data?.orders || []).map((o) => (
                <>
                  <tr
                    key={o._id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === o._id ? null : o._id)}
                  >
                    <td className="px-5 py-3">
                      <p className="font-bold text-accent text-xs">#{o.orderId}</p>
                      <p className="text-xs text-gray-400">{o.items?.length} item(s)</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-xs">{o.user?.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">{o.user?.email}</p>
                    </td>
                    <td className="px-5 py-3 font-bold">{fmt(o.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        o.paymentStatus === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>{o.paymentStatus}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{o.paymentMethod?.toUpperCase()}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{fmtDt(o.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[o.status] || "bg-gray-100 text-gray-600"}`}>
                        {o.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        defaultValue={o.status}
                        onChange={e => updateMutation.mutate({ id: o._id, status: e.target.value })}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-accent font-medium"
                      >
                        {STATUS_OPTS.map(s => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expanded === o._id && (
                    <tr key={`${o._id}-expanded`} className="bg-gray-50 border-t border-gray-100">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Items */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Items Ordered</p>
                            {o.items?.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 mb-1.5">
                                <span className="text-lg">📦</span>
                                <div>
                                  <p className="text-xs font-medium">{item.name}</p>
                                  <p className="text-xs text-gray-400">Qty: {item.quantity} × {fmt(item.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Address */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Shipping Address</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {o.shippingAddress?.fullName}<br />
                              {o.shippingAddress?.line1}, {o.shippingAddress?.line2}<br />
                              {o.shippingAddress?.city}, {o.shippingAddress?.state} – {o.shippingAddress?.pinCode}<br />
                              📞 {o.shippingAddress?.phone}
                            </p>
                          </div>
                          {/* Tracking + Pricing */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Tracking & Pricing</p>
                            <div className="space-y-1 text-xs text-gray-600 mb-3">
                              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(o.subtotal)}</span></div>
                              {o.couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon ({o.couponCode})</span><span>-{fmt(o.couponDiscount)}</span></div>}
                              <div className="flex justify-between"><span>Delivery</span><span>{o.deliveryFee === 0 ? "FREE" : fmt(o.deliveryFee)}</span></div>
                              <div className="flex justify-between font-bold text-primary border-t border-gray-200 pt-1"><span>Total</span><span>{fmt(o.totalAmount)}</span></div>
                            </div>
                            <div className="flex gap-2">
                              <input
                                placeholder="Tracking No."
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent flex-1"
                                onBlur={e => e.target.value && updateMutation.mutate({ id: o._id, status: o.status, trackingNumber: e.target.value })}
                              />
                              <input
                                placeholder="Courier"
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent flex-1"
                                onBlur={e => e.target.value && updateMutation.mutate({ id: o._id, status: o.status, courier: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {data.page} of {data.pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
