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
const isValidPhone  = (v) => v === "" || /^[6-9]\d{9}$/.test(v);
const isValidPass   = (v) => v.length >= 6;
const isValidOTP    = (v) => /^\d{6}$/.test(v);
const isValidName   = (v) => v.trim().length >= 2;

export default function RegisterPage() {
  const router  = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  // Mode: "password" | "otp"
  const [mode, setMode]           = useState("password");

  // Password register state
  const [form, setForm]           = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);

  // OTP register state
  const [otpForm, setOtpForm]     = useState({ name: "", email: "" });
  const [otp, setOtp]             = useState("");
  const [otpSent, setOtpSent]     = useState(false);
  const [otpTimer, setOtpTimer]   = useState(0);

  const [loading, setLoading]     = useState(false);
  const [errors,  setErrors]      = useState({});

  // ── OTP countdown ────────────────────────────────────────
  const startTimer = () => {
    setOtpTimer(60);
    const id = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // ── Save auth ────────────────────────────────────────────
  const saveAuth = (token, user) => {
    Cookies.set("token", token, { expires: 7 });
    localStorage.setItem("token", token);
    setUser(user);
    toast.success(`Welcome to DigiSho, ${user.name?.split(" ")[0]}! 🎉`);
    router.push("/");
  };

  // ── Password Register ────────────────────────────────────
  const handlePasswordRegister = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!isValidName(form.name))       errs.name     = "Name must be at least 2 characters";
    if (!isValidEmail(form.email))     errs.email    = "Enter a valid email address";
    if (form.phone && !isValidPhone(form.phone)) errs.phone = "Enter valid 10-digit mobile (starts with 6-9)";
    if (!isValidPass(form.password))   errs.password = "Password must be at least 6 characters";
    if (form.password !== form.confirm) errs.confirm  = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name:     form.name.trim(),
        email:    form.email,
        phone:    form.phone || undefined,
        password: form.password,
      });
      saveAuth(data.token, data.user);
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      if (msg.toLowerCase().includes("email")) setErrors({ email: msg });
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Send OTP ─────────────────────────────────────────────
  const handleSendOTP = async () => {
    const errs = {};
    if (!isValidName(otpForm.name))  errs.name     = "Name must be at least 2 characters";
    if (!isValidEmail(otpForm.email)) errs.otpEmail = "Enter a valid email address";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await authAPI.sendEmailOTP(otpForm.email);
      setOtpSent(true);
      startTimer();
      toast.success("OTP sent to your email! 📧");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP + Register ────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!isValidOTP(otp)) errs.otp = "Enter valid 6-digit OTP";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await authAPI.verifyEmailOTP({
        email: otpForm.email,
        otp,
        name:  otpForm.name.trim(),
      });
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

  // Password strength
  const passStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: "Too short", color: "bg-red-400", w: "w-1/4" };
    if (p.length < 8)  return { label: "Weak",     color: "bg-orange-400", w: "w-2/4" };
    if (!/[A-Z]/.test(p) || !/\d/.test(p)) return { label: "Medium", color: "bg-amber-400", w: "w-3/4" };
    return { label: "Strong 💪", color: "bg-green-500", w: "w-full" };
  };
  const strength = passStrength();

  return (
    <>
      <Head><title>Create Account | DigiSho</title></Head>
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">

            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="font-display text-3xl font-bold text-accent">
                Digi<span className="text-primary">Sho</span>
              </Link>
              <h1 className="text-xl font-bold text-primary mt-3">Create your account</h1>
              <p className="text-sm text-gray-500 mt-1">Join millions of happy shoppers</p>
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

              {/* ── Password Register Form ── */}
              {mode === "password" && (
                <form onSubmit={handlePasswordRegister} className="space-y-4">

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Rahul Sharma"
                      value={form.name}
                      onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                      className={inputCls("name")}
                      autoComplete="name"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">⚠ {errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
                      className={inputCls("email")}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">⚠ {errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Phone <span className="text-gray-400 normal-case font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="98765 43210"
                        value={form.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setForm({ ...form, phone: val });
                          setErrors({ ...errors, phone: "" });
                        }}
                        className={`${inputCls("phone")} pl-12`}
                        maxLength={10}
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">⚠ {errors.phone}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password *</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: "" }); }}
                        className={`${inputCls("password")} pr-12`}
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {showPass ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {/* Password strength bar */}
                    {strength && (
                      <div className="mt-1.5">
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${strength.color} ${strength.w}`} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{strength.label}</p>
                      </div>
                    )}
                    {errors.password && <p className="text-red-500 text-xs mt-1">⚠ {errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConf ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={form.confirm}
                        onChange={(e) => { setForm({ ...form, confirm: e.target.value }); setErrors({ ...errors, confirm: "" }); }}
                        className={`${inputCls("confirm")} pr-12`}
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {showConf ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {form.confirm && form.password !== form.confirm && !errors.confirm && (
                      <p className="text-amber-500 text-xs mt-1">⚠ Passwords don't match yet</p>
                    )}
                    {form.confirm && form.password === form.confirm && (
                      <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
                    )}
                    {errors.confirm && <p className="text-red-500 text-xs mt-1">⚠ {errors.confirm}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent text-white rounded-xl py-3 font-bold hover:bg-red-600 transition-colors disabled:opacity-60 mt-2"
                  >
                    {loading ? "Creating account..." : "Create Account →"}
                  </button>
                </form>
              )}

              {/* ── OTP Register Form ── */}
              {mode === "otp" && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Rahul Sharma"
                      value={otpForm.name}
                      onChange={(e) => { setOtpForm({ ...otpForm, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                      className={inputCls("name")}
                      disabled={otpSent}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">⚠ {errors.name}</p>}
                  </div>

                  {/* Email + Send OTP */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address *</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={otpForm.email}
                        onChange={(e) => { setOtpForm({ ...otpForm, email: e.target.value }); setErrors({ ...errors, otpEmail: "" }); }}
                        className={`${inputCls("otpEmail")} flex-1`}
                        disabled={otpSent}
                      />
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={loading || otpTimer > 0}
                        className="px-4 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 whitespace-nowrap flex-shrink-0"
                      >
                        {loading && !otpSent ? "..." : otpTimer > 0 ? `${otpTimer}s` : otpSent ? "Resend" : "Send OTP"}
                      </button>
                    </div>
                    {errors.otpEmail && <p className="text-red-500 text-xs mt-1">⚠ {errors.otpEmail}</p>}
                    {otpSent && <p className="text-green-600 text-xs mt-1">✓ OTP sent! Check inbox (also spam)</p>}
                  </div>

                  {/* OTP Input */}
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
                    {loading ? "Verifying..." : "Verify & Create Account →"}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">Already have an account?</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <Link
                href="/login"
                className="w-full block text-center border-2 border-gray-200 text-primary rounded-xl py-3 font-bold hover:border-accent hover:text-accent transition-colors text-sm"
              >
                Sign In →
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-accent hover:underline">Terms</Link> and{" "}
              <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}