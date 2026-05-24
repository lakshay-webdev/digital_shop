import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach admin JWT on every request
api.interceptors.request.use((config) => {
  const token =
    Cookies.get("admin_token") ||
    (typeof window !== "undefined" && localStorage.getItem("admin_token"));
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401/403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      [401, 403].includes(err.response?.status) &&
      typeof window !== "undefined"
    ) {
      Cookies.remove("admin_token");
      localStorage.removeItem("admin_token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ── Admin API helpers ─────────────────────────────────────
export const adminAPI = {
  // Dashboard stats
  getStats:          ()       => api.get("/admin/stats"),
  getRevenueChart:   (months) => api.get("/admin/revenue-chart", { params: { months } }),
  getTopProducts:    ()       => api.get("/admin/top-products"),
  getRecentOrders:   ()       => api.get("/admin/recent-orders"),
  getOrderBreakdown: ()       => api.get("/admin/order-status-breakdown"),

  // Products
  // ✅ FIX: isActive: undefined hatao — backend ko confuse karta tha
  // Admin ko saare products dikhne chahiye (active + inactive), isliye koi filter nahi
  getProducts:   (params) => api.get("/products", { params }),
  createProduct: (data)   => api.post("/products",       data),
  updateProduct: (id, d)  => api.put(`/products/${id}`,  d),
  deleteProduct: (id)     => api.delete(`/products/${id}`),
  updateStock:   (id, s)  => api.put(`/products/${id}/stock`, { stock: s }),

  // Orders
  getOrders:         (params) => api.get("/orders",              { params }),
  getOrder:          (id)     => api.get(`/orders/${id}`),
  updateOrderStatus: (id, d)  => api.put(`/orders/${id}/status`, d),

  // Users
  getUsers:       (params) => api.get("/users",          { params }),
  getUser:        (id)     => api.get(`/users/${id}`),
  toggleUserBlock:(id)     => api.put(`/users/${id}/block`),

  // Coupons
  getCoupons:   ()       => api.get("/coupons"),
  createCoupon: (data)   => api.post("/coupons",       data),
  updateCoupon: (id, d)  => api.put(`/coupons/${id}`,  d),
  deleteCoupon: (id)     => api.delete(`/coupons/${id}`),

  // Banners
  getBanners:   ()       => api.get("/banners"),
  createBanner: (data)   => api.post("/banners",       data),
  updateBanner: (id, d)  => api.put(`/banners/${id}`,  d),
  toggleBanner: (id)     => api.put(`/banners/${id}/toggle`),
  deleteBanner: (id)     => api.delete(`/banners/${id}`),

  // Upload
  uploadProductImages: (files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    return api.post("/upload/product", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadBannerImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return api.post("/upload/banner", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default api;