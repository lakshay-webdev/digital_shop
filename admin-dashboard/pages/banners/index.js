import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { adminAPI } from "../../lib/api";

const BANNER_TYPES = ["hero", "offer", "seasonal", "category"];

const GRADIENTS = {
  hero:     "from-[#1a1a2e] to-[#0f3460]",
  offer:    "from-[#e94560] to-[#c0392b]",
  seasonal: "from-[#f5a623] to-[#e67e22]",
  category: "from-[#16a34a] to-[#15803d]",
};

const emptyForm = { title: "", subtitle: "", type: "hero", link: "", position: 0, validFrom: "", validTill: "" };

export default function AdminBannersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(emptyForm);
  const [dragOver, setDragOver] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn:  () => adminAPI.getBanners().then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => editId ? adminAPI.updateBanner(editId, payload) : adminAPI.createBanner(payload),
    onSuccess:  () => { qc.invalidateQueries(["admin-banners"]); toast.success(editId ? "Banner updated!" : "Banner created!"); setShowForm(false); setEditId(null); setForm(emptyForm); },
    onError:    (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteBanner(id),
    onSuccess:  () => { qc.invalidateQueries(["admin-banners"]); toast.success("Banner deleted"); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleBanner(id),
    onSuccess:  () => qc.invalidateQueries(["admin-banners"]),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, position: Number(form.position) });
  };

  const openEdit = (b) => {
    setForm({ title: b.title, subtitle: b.subtitle || "", type: b.type, link: b.link || "", position: b.position, validFrom: b.validFrom?.split("T")[0] || "", validTill: b.validTill?.split("T")[0] || "" });
    setEditId(b._id); setShowForm(true);
  };

  return (
    <AdminLayout title="Banners">
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500">{data?.banners?.length || 0} banners</p>
        <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm(emptyForm); }}
          className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
          + Add Banner
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
          <h3 className="font-display text-lg font-bold mb-5">{editId ? "Edit Banner" : "Create New Banner"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Banner Title *</label>
                <input type="text" required placeholder="e.g. Mega Electronics Sale"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subtitle</label>
                <input type="text" placeholder="e.g. Up to 50% off on all gadgets"
                  value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Banner Type *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent capitalize">
                  {BANNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Link URL</label>
                <input type="text" placeholder="/products?category=electronics"
                  value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Display Order</label>
                <input type="number" placeholder="1"
                  value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valid From</label>
                <input type="date" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valid Till</label>
                <input type="date" value={form.validTill} onChange={e => setForm({ ...form, validTill: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
            </div>

            {/* Image Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {[["Desktop Banner", "1440×480px recommended"], ["Mobile Banner", "768×300px recommended"]].map(([label, hint]) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(label); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => { e.preventDefault(); setDragOver(null); toast.success("Image uploaded (demo)"); }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragOver === label ? "border-accent bg-red-50" : "border-gray-200 hover:border-accent hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-2xl mb-1">🖼️</p>
                    <p className="text-sm font-medium text-gray-600">Drop image here or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">{hint}</p>
                    <input type="file" accept="image/*" className="hidden" />
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</label>
              <div className={`bg-gradient-to-r ${GRADIENTS[form.type] || GRADIENTS.hero} rounded-xl h-24 flex items-center justify-center text-white`}>
                <div className="text-center">
                  <p className="font-display text-lg font-bold">{form.title || "Banner Title"}</p>
                  {form.subtitle && <p className="text-sm opacity-70">{form.subtitle}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saveMutation.isPending}
                className="bg-accent text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                {saveMutation.isPending ? "Saving..." : editId ? "Update Banner" : "Create Banner"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners Grid */}
      {isLoading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center text-gray-400">Loading banners...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(data?.banners || []).map((b) => (
            <div key={b._id} className={`bg-white border rounded-2xl overflow-hidden transition-all ${b.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              {/* Preview */}
              <div className={`bg-gradient-to-r ${GRADIENTS[b.type] || GRADIENTS.hero} h-28 flex items-center justify-center text-white relative`}>
                <div className="text-center px-6">
                  <p className="font-display text-lg font-bold">{b.title}</p>
                  {b.subtitle && <p className="text-sm opacity-70">{b.subtitle}</p>}
                </div>
                <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-semibold ${
                  b.isActive ? "bg-white/20 text-white" : "bg-black/20 text-white/70"
                }`}>
                  {b.isActive ? "● Live" : "○ Inactive"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-medium capitalize">{b.type}</span>
                      <span className="text-xs text-gray-400">Position #{b.position}</span>
                      {b.link && <span className="text-xs text-blue-500 truncate max-w-[120px]">{b.link}</span>}
                    </div>
                  </div>
                </div>
                {(b.validFrom || b.validTill) && (
                  <p className="text-xs text-gray-400 mb-3">
                    {b.validFrom && `From: ${new Date(b.validFrom).toLocaleDateString("en-IN")}`}
                    {b.validFrom && b.validTill && " — "}
                    {b.validTill && `Till: ${new Date(b.validTill).toLocaleDateString("en-IN")}`}
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)}
                    className="flex-1 border border-accent text-accent text-xs py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => toggleMutation.mutate(b._id)}
                    className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-colors ${
                      b.isActive ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-green-50 text-green-700 border border-green-200"
                    }`}>
                    {b.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => { if (confirm("Delete this banner?")) deleteMutation.mutate(b._id); }}
                    className="bg-red-50 text-red-500 text-xs px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors">
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!isLoading && data?.banners?.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🖼️</p>
              <p>No banners yet. Create your first one!</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
