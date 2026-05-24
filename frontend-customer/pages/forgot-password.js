import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Layout";
import { authAPI } from "../lib/api";
import toast from "react-hot-toast";
import { FiMail, FiArrowLeft } from "react-icons/fi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter your email"); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
      toast.success("Reset link sent to your email!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send reset link");
    } finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>Forgot Password | DigiSho</title></Head>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-md">
          <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors mb-6">
            <FiArrowLeft /> Back to Login
          </Link>

          <h1 className="font-display text-2xl font-bold mb-2">
            Forgot <span className="text-accent">Password?</span>
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMail className="text-2xl text-green-600" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-4">
                We've sent a password reset link to <strong>{email}</strong>. It's valid for 30 minutes.
              </p>
              <button onClick={() => { setSent(false); setEmail(""); }}
                className="text-sm text-accent hover:text-red-600 font-medium transition-colors"
              >
                Didn't receive? Try again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-accent text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

ForgotPasswordPage.getLayout = (page) => <Layout>{page}</Layout>;
