import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://digishop-backend-qs6q.onrender.com/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("token") || (typeof window !== "undefined" && localStorage.getItem("token"));
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("token");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register:        (data)          => api.post("/auth/register",          data),
  login:           (data)          => api.post("/auth/login",             data),
  sendEmailOTP:    (email)         => api.post("/auth/send-email-otp",    { email }),   // ✅ NEW
  verifyEmailOTP:  (data)          => api.post("/auth/verify-email-otp",  data),        // ✅ NEW
  forgotPassword:  (email)         => api.post("/auth/forgot-password",   { email }),
  resetPassword:   (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  getMe:           ()              => api.get("/auth/me"),
};

export const productAPI = {
  getAll:      (params)   => api.get("/products",                { params }),
  getFeatured: ()         => api.get("/products/featured"),
  search:      (q)        => api.get("/products/search",         { params: { q } }),
  getOne:      (id)       => api.get(`/products/${id}`),
  getRelated:  (id)       => api.get(`/products/${id}/related`),
  addReview:   (id, data) => api.post(`/products/${id}/reviews`, data),
};

export const orderAPI = {
  place:  (data)       => api.post("/orders",             data),
  getMy:  (params)     => api.get("/orders/my",           { params }),
  getOne: (id)         => api.get(`/orders/${id}`),
  cancel: (id)         => api.put(`/orders/${id}/cancel`),
  return: (id, reason) => api.put(`/orders/${id}/return`, { reason }),
};

export const cartAPI = {
  get:    ()        => api.get("/cart"),
  add:    (data)    => api.post("/cart/add",         data),
  update: (id, qty) => api.put(`/cart/update/${id}`, { quantity: qty }),
  remove: (id)      => api.delete(`/cart/remove/${id}`),
  clear:  ()        => api.delete("/cart/clear"),
};

export const wishlistAPI = {
  get:    ()   => api.get("/wishlist"),
  toggle: (id) => api.post(`/wishlist/${id}`),
  remove: (id) => api.delete(`/wishlist/${id}`),
};

export const couponAPI = {
  validate: (code, orderAmount) => api.post("/coupons/validate", { code, orderAmount }),
};

export const paymentAPI = {
  createRazorpayOrder: (amount) => api.post("/payments/razorpay/create-order", { amount }),
  verifyRazorpay:      (data)   => api.post("/payments/razorpay/verify",        data),
  createStripeIntent:  (amount) => api.post("/payments/stripe/create-intent",   { amount }),
};

export const bannerAPI = {
  getAll: () => api.get("/banners"),
};