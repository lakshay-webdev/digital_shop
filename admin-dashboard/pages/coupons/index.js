import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { adminAPI } from "../../lib/api";

const fmtDt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const emptyForm = {
  code: "", type: "percent", value: "", minOrderValue: "",
  maxDiscount: "", usageLimit: "", perUserLimit: 1,
  validTill: "", description: "",
};

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn:  () => adminAPI.getCoupons().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => adminAPI.createCoupon(payload),
    onSuccess:  () => { qc.invalidateQueries(["admin-coupons"]); toast.success("Coupon created!"); setShowForm(false); setForm(emptyForm); },
    onError:    (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteCoupon(id),
    onSuccess:  () => { qc.invalidateQueries(["admin-coupons"]); toast.success("Coupon deleted"); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminAPI.updateCoupon(id, { isActive }),
    onSuccess:  () => qc.invalidateQueries(["admin-coupons"]),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      code:          form.code.toUpperCase().trim(),
      value:         Number(form.value),
      minOrderValue: Number(form.minOrderValue) || 0,
      maxDiscount:   form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit:    Number(form.usageLimit) || 0,
      perUserLimit:  Number(form.perUserLimit) || 1,
    });
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <AdminLayout title="Coupons">
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500">{data?.coupons?.length || 0} coupons total</p>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
          + Create Coupon
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
          <h3 className="font-display text-lg font-bold mb-5">Create New Coupon</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Coupon Code *</label>
                <input type="text" required placeholder="e.g. SAVE20"
                  value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent font-mono font-bold uppercase" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent">
                  <option value="percent">% Percentage</option>
                  <option value="flat">₹ Flat Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {form.type === "percent" ? "Discount %" : "Discount ₹"} *
                </label>
                <input type="number" required placeholder={form.type === "percent" ? "10" : "500"}
                  value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Min Order (₹)</label>
                <input type="number" placeholder="0 = no minimum"
                  value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              {form.type === "percent" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Discount (₹)</label>
                  <input type="number" placeholder="e.g. 1000"
                    value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Usage Limit</label>
                <input type="number" placeholder="0 = unlimited"
                  value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Per User Limit</label>
                <input type="number" placeholder="1"
                  value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valid Till *</label>
                <input type="date" required value={form.validTill} onChange={e => setForm({ ...form, validTill: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
                <input type="text" placeholder="Internal note about this coupon"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending}
                className="bg-accent text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                {createMutation.isPending ? "Creating..." : "Create Coupon"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Grid */}
      {isLoading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center text-gray-400">Loading coupons...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(data?.coupons || []).map((c) => {
            const expired = isExpired(c.validTill);
            return (
              <div key={c._id} className={`bg-white border rounded-2xl p-5 transition-all ${
                !c.isActive || expired ? "border-gray-100 opacity-60" : "border-gray-100 hover:border-accent"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <code className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm font-bold font-mono tracking-widest text-primary">
                      {c.code}
                    </code>
                    <p className="text-xs text-gray-500 mt-1.5">{c.description || "No description"}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ml-2 ${
                    expired         ? "bg-gray-100 text-gray-500"  :
                    !c.isActive     ? "bg-red-50 text-red-500"     :
                                      "bg-green-50 text-green-700"
                  }`}>
                    {expired ? "Expired" : c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="bg-gradient-to-r from-accent/10 to-red-50 rounded-xl p-3 mb-3 text-center">
                  <p className="font-display text-2xl font-bold text-accent">
                    {c.type === "percent" ? `${c.value}% OFF` : `₹${c.value} OFF`}
                  </p>
                  {c.minOrderValue > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">Min order: ₹{c.minOrderValue.toLocaleString("en-IN")}</p>
                  )}
                  {c.maxDiscount && (
                    <p className="text-xs text-gray-500">Max discount: ₹{c.maxDiscount.toLocaleString("en-IN")}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {[
                    ["Used",   c.usedCount],
                    ["Limit",  c.usageLimit === 0 ? "∞" : c.usageLimit],
                    ["Per User", c.perUserLimit],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-bold text-primary">{val}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  Valid till: <span className={`font-medium ${expired ? "text-red-500" : "text-gray-600"}`}>
                    {fmtDt(c.validTill)}
                  </span>
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ id: c._id, isActive: !c.isActive })}
                    className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-colors ${
                      c.isActive
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                    }`}
                  >
                    {c.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete coupon?")) deleteMutation.mutate(c._id); }}
                    className="flex-1 bg-red-50 text-red-500 text-xs py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {!isLoading && data?.coupons?.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🏷️</p>
              <p>No coupons yet. Create your first one!</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
