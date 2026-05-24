const mongoose = require("mongoose");

// ── Category ─────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, unique: true },
  parent:      { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  image:       String,
  icon:        String,
  description: String,
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  next();
});

// ── Coupon ────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true },
  type:         { type: String, enum: ["percent", "flat"], required: true },
  value:        { type: Number, required: true },
  minOrderValue:{ type: Number, default: 0 },
  maxDiscount:  Number,          // cap for percent coupons
  usageLimit:   { type: Number, default: 0 },  // 0 = unlimited
  usedCount:    { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  users:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  validFrom:    { type: Date, default: Date.now },
  validTill:    { type: Date, required: true },
  isActive:     { type: Boolean, default: true },
  description:  String,
}, { timestamps: true });

couponSchema.methods.isValid = function () {
  const now = new Date();
  return this.isActive && now >= this.validFrom && now <= this.validTill &&
    (this.usageLimit === 0 || this.usedCount < this.usageLimit);
};

couponSchema.methods.calcDiscount = function (amount) {
  if (!this.isValid()) return 0;
  if (amount < this.minOrderValue) return 0;
  let disc = this.type === "percent" ? (amount * this.value) / 100 : this.value;
  if (this.maxDiscount) disc = Math.min(disc, this.maxDiscount);
  return Math.round(disc);
};

// ── Banner ────────────────────────────────────────────────
const bannerSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  subtitle:   String,
  image:      { url: String, public_id: String },
  mobileImage:{ url: String, public_id: String },
  link:       String,
  type:       { type: String, enum: ["hero", "offer", "seasonal", "category"], default: "hero" },
  position:   { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true },
  validFrom:  Date,
  validTill:  Date,
}, { timestamps: true });

module.exports = {
  Category: mongoose.model("Category", categorySchema),
  Coupon:   mongoose.model("Coupon",   couponSchema),
  Banner:   mongoose.model("Banner",   bannerSchema),
};
