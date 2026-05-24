import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import toast from "react-hot-toast";
import axios from "axios";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      toast.error("Please enter your admin email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      if (!["admin", "superadmin"].includes(data.user?.role)) {
        toast.error("Access denied. Admin credentials required.");
        return;
      }
      Cookies.set("admin_token", data.token, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      localStorage.setItem("admin_token", data.token);
      toast.success(`Welcome, ${data.user.name}! 👋`);
      router.push("/dashboard");
    } catch (e) {
      console.error("Admin login failed", e);
      toast.error(e.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Admin Login | DigiSho</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-2">
            <h1 className="font-display text-2xl font-bold">
              <span className="text-accent">Digi</span>
              <span className="text-primary">Sho</span>
            </h1>
          </div>

          {/* Admin badge */}
          <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-2 text-sm font-semibold mb-6 mx-auto w-fit">
            🔐 Admin Panel — Restricted Access
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@digisho.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white rounded-xl py-3.5 font-bold text-sm hover:bg-red-600 transition-colors mt-2 disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Login to Dashboard →"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            This is a restricted area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </>
  );
}
