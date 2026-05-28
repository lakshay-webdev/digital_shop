const router    = require("express").Router();
const User      = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { protect } = require("../middleware/auth");
const crypto    = require("crypto");

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      phone:      user.phone,
      role:       user.role,
      avatar:     user.avatar,
      isVerified: user.isVerified,
    },
  });
};

// ── POST /api/auth/register ───────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "Name, email and password required" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

  const user = await User.create({ name, email, phone, password });

  // Send welcome email
  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.emailVerifyToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
  await user.save();

  try {
    await sendEmail({
      to:       email,
      subject:  "Welcome to DigiSho — Verify your email",
      template: "welcome",
      data:     { name, verifyUrl: `${process.env.CUSTOMER_URL}/verify-email/${verifyToken}` },
    });
  } catch (e) { console.log("Email send failed:", e.message); }

  sendToken(user, 201, res);
});

// ── POST /api/auth/login ──────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  if (user.isBlocked)
    return res.status(403).json({ success: false, message: "Account suspended" });

  sendToken(user, 200, res);
});

// ── POST /api/auth/send-email-otp ────────────────────────
// Sends a 6-digit OTP to the given email via Nodemailer
router.post("/send-email-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  // Basic email format check
  if (!/^\S+@\S+\.\S+$/.test(email))
    return res.status(400).json({ success: false, message: "Invalid email format" });

  // Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    // New user — will complete profile after OTP verification
    user = await User.create({
      name:  email.split("@")[0], // temp name
      email,
      password: crypto.randomBytes(16).toString("hex"), // random password (won't be used)
    });
  }

  if (user.isBlocked)
    return res.status(403).json({ success: false, message: "Account suspended" });

  // Generate 6-digit OTP and save
  const otp = user.generateOTP();
  await user.save();

  // Send OTP via Nodemailer
  try {
    await sendEmail({
      to:      email,
      subject: "DigiSho — Your Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">
          <h2 style="color:#e94560;">DigiSho OTP Verification</h2>
          <p>Hi there! Your one-time password is:</p>
          <div style="background:#f8f8f8;border:2px solid #e94560;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1a1a2e;">${otp}</span>
          </div>
          <p style="color:#666;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color:#999;font-size:12px;">If you didn't request this, please ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="color:#999;font-size:12px;">DigiSho — India's Premium Marketplace</p>
        </div>
      `,
    });
    res.json({ success: true, message: "OTP sent to your email", isNewUser: !user.isVerified });
  } catch (e) {
    console.log("OTP email failed:", e.message);
    res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
  }
});

// ── POST /api/auth/verify-email-otp ──────────────────────
// Verifies OTP + optional name for new users
router.post("/verify-email-otp", async (req, res) => {
  const { email, otp, name } = req.body;
  if (!email || !otp)
    return res.status(400).json({ success: false, message: "Email and OTP required" });

  const user = await User.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
  if (!user)
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

  // If name provided (new user registration), update it
  if (name && name.trim()) user.name = name.trim();

  user.otp        = undefined;
  user.otpExpire  = undefined;
  user.isVerified = true;
  await user.save();

  sendToken(user, 200, res);
});

// ── POST /api/auth/send-otp (phone — kept for backward compat) ──
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ name: "User", phone, email: `${phone}@otp.digisho.com` });

  const otp = user.generateOTP();
  await user.save();

  // sendSMS removed — use email OTP instead
  res.json({ success: true, message: "OTP sent" });
});

// ── POST /api/auth/verify-otp (phone — kept for backward compat) ─
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;
  const user = await User.findOne({ phone, otp, otpExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

  user.otp = undefined; user.otpExpire = undefined; user.isVerified = true;
  await user.save();
  sendToken(user, 200, res);
});

// ── POST /api/auth/forgot-password ───────────────────────
router.post("/forgot-password", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ success: false, message: "No account with that email" });

  const raw = user.getResetPasswordToken();
  await user.save();

  try {
    await sendEmail({
      to:       user.email,
      subject:  "DigiSho — Reset your password",
      template: "reset",
      data:     { name: user.name, resetUrl: `${process.env.CUSTOMER_URL}/reset-password/${raw}` },
    });
    res.json({ success: true, message: "Reset link sent to email" });
  } catch {
    user.resetPasswordToken = undefined; user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({ success: false, message: "Email could not be sent" });
  }
});

// ── PUT /api/auth/reset-password/:token ──────────────────
router.put("/reset-password/:token", async (req, res) => {
  const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user   = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, message: "Invalid or expired token" });

  user.password            = req.body.password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ── GET /api/auth/verify-email/:token ────────────────────
router.get("/verify-email/:token", async (req, res) => {
  const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user   = await User.findOne({ emailVerifyToken: hashed });
  if (!user) return res.status(400).json({ success: false, message: "Invalid token" });
  user.isVerified       = true;
  user.emailVerifyToken = undefined;
  await user.save();
  res.json({ success: true, message: "Email verified!" });
});

module.exports = router;