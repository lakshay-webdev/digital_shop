import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import Layout from "../components/Layout";
import { authAPI } from "../lib/api";
import { useAuthStore } from "../store";

// ✅ Validators
const isValidEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const isValidPass  = (v) => v.length >= 6;
const isValidOTP   = (v) => /^\d{6}$/.test(v);

export default function LoginPage() {
  const router   = useRouter();
  const setUser  = useAuthStore((s) => s.setUser);
  const redirect = router.query.redirect || "/";

  // Mode: "password" | "otp"
  const [mode, setMode]           = useState("password");

  // Password login state
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);

  // OTP login state
  const [otpEmail, setOtpEmail]   = useState("");
  const [otp, setOtp]             = useState("");
  const [otpSent, setOtpSent]     = useState(false);
  const [otpTimer, setOtpTimer]   = useState(0);

  const [loading, setLoading]     = useState(false);
  const [errors,  setErrors]      = useState({});

  // ── OTP countdown timer ──────────────────────────────────
  const startTimer = () => {
    setOtpTimer(60);
    const id = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // ── Save auth and redirect ───────────────────────────────
  const saveAuth = (token, user) => {
    Cookies.set("token", token, { expires: 7 });
    localStorage.setItem("token", token);
    setUser(user);
    toast.success(`Welcome back, ${user.name?.split(" ")[0]}! 👋`);
    router.push(redirect);
  };

  // ── Password Login ───────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!isValidEmail(email))  errs.email    = "Enter a valid email address";
    if (!isValidPass(password)) errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      saveAuth(data.token, data.user);
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      if (msg.toLowerCase().includes("password")) setErrors({ password: msg });
      else if (msg.toLowerCase().includes("email")) setErrors({ email: msg });
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Send Email OTP ───────────────────────────────────────
  const handleSendOTP = async () => {
    if (!isValidEmail(otpEmail)) {
      setErrors({ otpEmail: "Enter a valid email address" });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await authAPI.sendEmailOTP(otpEmail);
      setOtpSent(true);
      startTimer();
      toast.success("OTP sent to your email! Check inbox 📧");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify Email OTP ─────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!isValidEmail(otpEmail)) errs.otpEmail = "Enter a valid email";
    if (!isValidOTP(otp))        errs.otp      = "Enter valid 6-digit OTP";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await authAPI.verifyEmailOTP({ email: otpEmail, otp });
      saveAuth(data.token, data.user);
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || "Invalid or expired OTP" });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) =>
    `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
      errors[field] ? "border-red-400 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-accent"
    }`;

  return (
    <>
      <Head><title>Login | DigiSho</title></Head>
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">

            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="font-display text-3xl font-bold text-accent">
                Digi<span className="text-primary">Sho</span>
              </Link>
              <h1 className="text-xl font-bold text-primary mt-3">Welcome back!</h1>
              <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
            </div>

            {/* Card */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                <button
                  onClick={() => { setMode("password"); setErrors({}); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "password" ? "bg-white shadow text-primary" : "text-gray-500"}`}
                >
                  🔑 Password
                </button>
                <button
                  onClick={() => { setMode("otp"); setErrors({}); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "otp" ? "bg-white shadow text-primary" : "text-gray-500"}`}
                >
                  📧 Email OTP
                </button>
              </div>

              {/* ── Password Login Form ── */}
              {mode === "password" && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: "" }); }}
                      className={inputCls("email")}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">⚠ {errors.email}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
                      <Link href="/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: "" }); }}
                        className={`${inputCls("password")} pr-12`}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                      >
                        {showPass ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">⚠ {errors.password}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent text-white rounded-xl py-3 font-bold hover:bg-red-600 transition-colors disabled:opacity-60 mt-2"
                  >
                    {loading ? "Signing in..." : "Sign In →"}
                  </button>
                </form>
              )}

              {/* ── OTP Login Form ── */}
              {mode === "otp" && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={otpEmail}
                        onChange={(e) => { setOtpEmail(e.target.value); setErrors({ ...errors, otpEmail: "" }); }}
                        className={`${inputCls("otpEmail")} flex-1`}
                        disabled={otpSent}
                        autoComplete="email"
                      />
                      <button
                        type="button"
                        onClick={otpSent ? () => { setOtpSent(false); setOtp(""); startTimer(); handleSendOTP(); } : handleSendOTP}
                        disabled={loading || otpTimer > 0}
                        className="px-4 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 whitespace-nowrap flex-shrink-0"
                      >
                        {loading && !otpSent ? "..." : otpTimer > 0 ? `${otpTimer}s` : otpSent ? "Resend" : "Send OTP"}
                      </button>
                    </div>
                    {errors.otpEmail && <p className="text-red-500 text-xs mt-1">⚠ {errors.otpEmail}</p>}
                    {otpSent && <p className="text-green-600 text-xs mt-1">✓ OTP sent! Check your inbox (also spam folder)</p>}
                  </div>

                  {otpSent && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Enter OTP</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="6-digit OTP"
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors({ ...errors, otp: "" }); }}
                        className={`${inputCls("otp")} tracking-[0.5em] text-center text-lg font-bold`}
                        maxLength={6}
                        autoFocus
                      />
                      {errors.otp && <p className="text-red-500 text-xs mt-1">⚠ {errors.otp}</p>}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !otpSent}
                    className="w-full bg-accent text-white rounded-xl py-3 font-bold hover:bg-red-600 transition-colors disabled:opacity-60 mt-2"
                  >
                    {loading ? "Verifying..." : "Verify & Sign In →"}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">Don't have an account?</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <Link
                href="/register"
                className="w-full block text-center border-2 border-gray-200 text-primary rounded-xl py-3 font-bold hover:border-accent hover:text-accent transition-colors text-sm"
              >
                Create Account →
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-accent hover:underline">Terms</Link> and{" "}
              <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}