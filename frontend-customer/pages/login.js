import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import toast from "react-hot-toast";
import { authAPI } from "../lib/api";
import { useAuthStore } from "../store";

const isValidPhone = (value) => /^[0-9]{10}$/.test(value);

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [tab,     setTab]     = useState("login");   // login | register | otp
  const [otpStep, setOtpStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [loginForm,    setLoginForm]    = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otpForm,      setOtpForm]      = useState({ phone: "", otp: "" });

  const after = router.query.redirect || "/";

  // ── Login ─────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(loginForm);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}! 👋`);
      router.push(after);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  // ── Register ──────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!isValidPhone(registerForm.phone)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.register(registerForm);
      setAuth(data.user, data.token);
      toast.success("Account created! Welcome to DigiSho 🎉");
      router.push(after);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  // ── OTP ───────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!isValidPhone(otpForm.phone)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    setLoading(true);
    try {
      await authAPI.sendOTP(otpForm.phone);
      toast.success("OTP sent to your phone!");
      setOtpStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({ phone: otpForm.phone, otp: otpForm.otp });
      setAuth(data.user, data.token);
      toast.success("Logged in successfully! ✓");
      router.push(after);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";
  const btnCls   = "w-full bg-accent text-white rounded-xl py-3.5 font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 mt-1";

  return (
    <>
      <Head><title>{tab === "register" ? "Create Account" : "Sign In"} | DigiSho</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="font-display text-2xl font-bold">
              <span className="text-accent">Digi</span>
              <span className="text-primary">Sho</span>
            </Link>
            <p className="text-xs text-gray-500 mt-1">
              {tab === "login" ? "Sign in to your account" : tab === "register" ? "Create a new account" : "Login with OTP"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-50 rounded-xl p-1 mb-6">
            {[["login","Sign In"],["register","Register"],["otp","OTP"]].map(([id, label]) => (
              <button key={id} onClick={() => { setTab(id); setOtpStep(1); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  tab === id ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>{label}</button>
            ))}
          </div>

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className={labelCls}>Email</label><input type="email" required placeholder="you@example.com" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" required placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className={inputCls} />
                <div className="text-right mt-1.5"><Link href="/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link></div>
              </div>
              <button type="submit" disabled={loading} className={btnCls}>{loading ? "Signing in..." : "Sign In →"}</button>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div><label className={labelCls}>Full Name</label><input type="text" required placeholder="Rahul Sharma" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Email</label><input type="email" required placeholder="you@example.com" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label><input type="tel" placeholder="9876543210" value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className={inputCls} /></div>
              <div><label className={labelCls}>Password</label><input type="password" required placeholder="Min 6 characters" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} className={inputCls} /></div>
              <button type="submit" disabled={loading} className={btnCls}>{loading ? "Creating account..." : "Create Account →"}</button>
            </form>
          )}

          {/* OTP Form */}
          {tab === "otp" && (
            <>
              {otpStep === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div><label className={labelCls}>Mobile Number</label><input type="tel" required placeholder="9876543210" value={otpForm.phone} onChange={e => setOtpForm({ ...otpForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className={inputCls} /></div>
                  <button type="submit" disabled={loading} className={btnCls}>{loading ? "Sending OTP..." : "Send OTP →"}</button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <p className="text-xs text-gray-500 text-center">OTP sent to {otpForm.phone}</p>
                  <div>
                    <label className={labelCls}>Enter 6-digit OTP</label>
                    <div className="flex gap-2 justify-center">
                      {[0,1,2,3,4,5].map(i => (
                        <input key={i} type="text" maxLength={1}
                          className="w-10 h-12 border border-gray-200 rounded-xl text-center text-lg font-bold outline-none focus:border-accent transition-colors"
                          onInput={e => {
                            const inputs = e.target.closest("div").querySelectorAll("input");
                            if (e.target.value && i < 5) inputs[i + 1]?.focus();
                            const otp = Array.from(inputs).map(inp => inp.value).join("");
                            setOtpForm(f => ({ ...f, otp }));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className={btnCls}>{loading ? "Verifying..." : "Verify & Login →"}</button>
                  <button type="button" onClick={() => setOtpStep(1)} className="w-full text-xs text-gray-500 hover:text-gray-700 py-2">← Change number</button>
                </form>
              )}
            </>
          )}

          <p className="text-center text-xs text-gray-400 mt-5">
            By continuing, you agree to DigiSho's{" "}
            <Link href="/terms" className="text-accent hover:underline">Terms</Link> &{" "}
            <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </>
  );
}
