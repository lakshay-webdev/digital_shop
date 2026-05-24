const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const crypto    = require("crypto");

const addressSchema = new mongoose.Schema({
  label:      { type: String, default: "Home" },
  fullName:   { type: String, required: true },
  phone:      { type: String, required: true },
  line1:      { type: String, required: true },
  line2:      String,
  city:       { type: String, required: true },
  state:      { type: String, required: true },
  pinCode:    { type: String, required: true },
  isDefault:  { type: Boolean, default: false },
});

// ✅ FIX: Cart item sub-schema added (was completely missing)
const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  variant:  { type: String, default: "" },
});

const userSchema = new mongoose.Schema(
  {
    name:             { type: String, required: [true, "Name required"], trim: true, maxlength: 50 },
    email:            { type: String, required: [true, "Email required"], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Invalid email"] },
    phone:            { type: String, unique: true, sparse: true },
    password:         { type: String, minlength: 6, select: false },
    avatar:           { type: String, default: "" },
    role:             { type: String, enum: ["customer", "admin", "superadmin"], default: "customer" },
    isVerified:       { type: Boolean, default: false },
    isBlocked:        { type: Boolean, default: false },
    addresses:        [addressSchema],
    wishlist:         [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart:             [cartItemSchema],   // ✅ FIX: Cart field added
    wallet:           { type: Number, default: 0 },
    totalOrders:      { type: Number, default: 0 },
    totalSpent:       { type: Number, default: 0 },
    // OTP
    otp:              String,
    otpExpire:        Date,
    // Password reset
    resetPasswordToken:  String,
    resetPasswordExpire: Date,
    // Email verification
    emailVerifyToken: String,
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Generate JWT
userSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp       = otp;
  this.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const raw = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken  = crypto.createHash("sha256").update(raw).digest("hex");
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return raw;
};

module.exports = mongoose.model("User", userSchema);