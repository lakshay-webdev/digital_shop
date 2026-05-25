import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { adminAPI } from "../../lib/api";
import axios from "axios";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const CATEGORIES = ["Electronics","Fashion","Home & Living","Beauty","Gaming","Books","Sports"];

const emptyForm = {
  name: "", brand: "", category: "", price: "", mrp: "",
  stock: "", description: "", tags: "", featured: false,
  isBestSeller: false, isNewArrival: false,
};

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch]   = useState("");
  const [page,   setPage]     = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]  = useState(null);
  const [form, setForm]        = useState(emptyForm);

  // ── Image Upload State ──────────────────────────────────
  const [selectedImages, setSelectedImages] = useState([]); // File objects
  const [previewUrls, setPreviewUrls]       = useState([]); // Local preview URLs
  const [uploadedImages, setUploadedImages] = useState([]); // Cloudinary URLs (existing on edit)
  const [uploading, setUploading]           = useState(false);
  const fileInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn:  () => adminAPI.getProducts({ page, limit: 15, search }).then(r => r.data),
  });

  // Upload images to Cloudinary via backend
  const uploadImages = async () => {
    if (selectedImages.length === 0) return uploadedImages; // return already uploaded (edit case)

    setUploading(true);
    try {
      const formData = new FormData();
      selectedImages.forEach(file => formData.append("images", file));

      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/product`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return [...uploadedImages, ...res.data.images]; // merge existing + new
    } catch (err) {
      toast.error("Image upload failed!");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const images = await uploadImages();
      const finalPayload = {
        ...payload,
        images,
        thumbnail: images[0]?.url || "",
      };
      return editId
        ? adminAPI.updateProduct(editId, finalPayload)
        : adminAPI.createProduct(finalPayload);
    },
    onSuccess: () => {
      qc.invalidateQueries(["admin-products"]);
      toast.success(editId ? "Product updated!" : "Product created!");
      closeForm();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries(["admin-products"]); toast.success("Product deleted"); },
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }) => adminAPI.updateProduct(id, { featured }),
    onSuccess: () => qc.invalidateQueries(["admin-products"]),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setSelectedImages([]);
    setPreviewUrls([]);
    setUploadedImages([]);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, brand: p.brand, category: p.category?.name || "",
      price: p.price, mrp: p.mrp, stock: p.stock,
      description: p.description, tags: p.tags?.join(", ") || "",
      featured: p.featured, isBestSeller: p.isBestSeller, isNewArrival: p.isNewArrival,
    });
    // Load existing images for preview
    setUploadedImages(p.images || []);
    setPreviewUrls([]);
    setSelectedImages([]);
    setEditId(p._id);
    setShowForm(true);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = uploadedImages.length + selectedImages.length + files.length;

    if (totalImages > 5) {
      toast.error("Maximum 5 images allowed!");
      return;
    }

    const newPreviews = files.map(f => URL.createObjectURL(f));
    setSelectedImages(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  // Remove new (not yet uploaded) image
  const removeNewImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Remove already uploaded image (edit case)
  const removeUploadedImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    const fakeEvent = { target: { files } };
    handleFileChange(fakeEvent);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price), mrp: Number(form.mrp), stock: Number(form.stock),
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    saveMutation.mutate(payload);
  };

  const totalImageCount = uploadedImages.length + selectedImages.length;

  return (
    <AdminLayout title="Products">
      {/* Topbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text" placeholder="Search products..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex-1 max-w-xs"
        />
        <div className="ml-auto flex gap-2">
          <span className="text-sm text-gray-500 self-center">{data?.total || 0} products</span>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
            className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-bold">{editId ? "Edit Product" : "Add New Product"}</h3>
            <button onClick={closeForm}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-lg">×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {[
                ["Product Name", "name",  "text",   "e.g. iPhone 15 Pro", "col-span-2"],
                ["Brand",        "brand", "text",   "Apple"],
                ["Price (₹)",   "price", "number", "99999"],
                ["MRP (₹)",     "mrp",   "number", "129999"],
                ["Stock Qty",   "stock", "number", "50"],
              ].map(([label, key, type, placeholder, cls]) => (
                <div key={key} className={cls || ""}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent">
                  <option value="">Select...</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Product description..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent resize-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="mobile, samsung, 5g"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
            </div>

            <div className="flex flex-wrap gap-5 mb-5">
              {[["featured","⭐ Featured"],["isBestSeller","🔥 Best Seller"],["isNewArrival","✨ New Arrival"]].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })}
                    className="w-4 h-4 accent-accent rounded" />
                  {label}
                </label>
              ))}
            </div>

            {/* ── Image Upload Zone ── */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Product Images ({totalImageCount}/5)
              </label>

              {/* Image Previews */}
              {(uploadedImages.length > 0 || previewUrls.length > 0) && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {/* Already uploaded images (edit mode) */}
                  {uploadedImages.map((img, i) => (
                    <div key={`uploaded-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-accent text-white text-[9px] text-center py-0.5 font-semibold">
                          MAIN
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex font-bold"
                      >×</button>
                    </div>
                  ))}

                  {/* New selected images (not yet uploaded) */}
                  {previewUrls.map((url, i) => (
                    <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-accent group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[9px] text-center py-0.5 font-semibold">
                        NEW
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex font-bold"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop Zone */}
              {totalImageCount < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-accent hover:bg-red-50 transition-all"
                >
                  <p className="text-2xl mb-1">📁</p>
                  <p className="text-sm font-medium text-gray-600">Click or drag to upload images</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB · Max {5 - totalImageCount} more image(s)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saveMutation.isPending || uploading}
                className="bg-accent text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                {uploading ? "Uploading images..." : saveMutation.isPending ? "Saving..." : editId ? "Update Product" : "Create Product"}
              </button>
              <button type="button" onClick={closeForm}
                className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading products...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-5 py-3 font-semibold">Category</th>
                <th className="text-left px-5 py-3 font-semibold">Price</th>
                <th className="text-left px-5 py-3 font-semibold">Stock</th>
                <th className="text-left px-5 py-3 font-semibold">Rating</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.products || []).map((p) => (
                <tr key={p._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                        {p.thumbnail
                          ? <img src={p.thumbnail} alt="" className="w-full h-full object-cover rounded-lg" />
                          : "📦"}
                      </div>
                      <div>
                        <p className="font-semibold text-xs leading-tight max-w-[180px] truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium">
                      {p.category?.name || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-bold text-accent">{fmt(p.price)}</p>
                    <p className="text-xs text-gray-400 line-through">{fmt(p.mrp)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${p.stock <= 5 ? "text-red-500" : p.stock <= 20 ? "text-amber-500" : "text-green-600"}`}>
                      {p.stock}
                    </span>
                    {p.stock <= 5 && <p className="text-xs text-red-400">Low stock!</p>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 text-xs">★</span>
                      <span className="text-xs font-semibold">{p.avgRating}</span>
                      <span className="text-xs text-gray-400">({p.numReviews})</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold w-fit ${p.inStock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {p.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                      {p.featured && <span className="text-xs text-amber-600 font-medium">⭐ Featured</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(p)}
                        className="border border-accent text-accent text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium">
                        Edit
                      </button>
                      <button onClick={() => toggleFeatured.mutate({ id: p._id, featured: !p.featured })}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${p.featured ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                        {p.featured ? "★" : "☆"}
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(p._id); }}
                        className="bg-red-50 text-red-500 border border-red-100 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {data.page} of {data.pages} — {data.total} products
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}