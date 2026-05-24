const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  name:     { type: String, required: true },  // e.g. "128GB / Black"
  sku:      { type: String, unique: true, sparse: true },
  price:    { type: Number, required: true },
  mrp:      { type: Number, required: true },
  stock:    { type: Number, default: 0 },
  color:    String,
  size:     String,
  images:   [String],
});

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    title:   String,
    comment: { type: String, required: true },
    images:  [String],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, unique: true },
    brand:       { type: String, required: true },
    description: { type: String, required: true },
    category:    { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    // Pricing (base / first variant)
    price:       { type: Number, required: true },
    mrp:         { type: Number, required: true },
    discount:    { type: Number, default: 0 },  // % off

    // Images
    images:      [{ url: String, public_id: String }],
    thumbnail:   String,

    // Variants
    variants:    [variantSchema],
    hasVariants: { type: Boolean, default: false },

    // Inventory
    stock:       { type: Number, default: 0 },
    lowStockAlert: { type: Number, default: 5 },
    inStock:     { type: Boolean, default: true },

    // Reviews
    reviews:     [reviewSchema],
    avgRating:   { type: Number, default: 0 },
    numReviews:  { type: Number, default: 0 },

    // Metadata
    tags:        [String],
    featured:    { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    isBestSeller:{ type: Boolean, default: false },
    isNewArrival:{ type: Boolean, default: false },

    // SEO
    metaTitle:       String,
    metaDescription: String,

    // Stats
    viewCount:    { type: Number, default: 0 },
    soldCount:    { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Auto-calculate discount %
productSchema.pre("save", function (next) {
  if (this.isModified("price") || this.isModified("mrp")) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  // Auto slug from name
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  next();
});

// Recalculate avg rating
productSchema.methods.calcAvgRating = function () {
  if (this.reviews.length === 0) { this.avgRating = 0; this.numReviews = 0; return; }
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.avgRating  = Math.round((sum / this.reviews.length) * 10) / 10;
  this.numReviews = this.reviews.length;
};

// Text search index
productSchema.index({ name: "text", brand: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, inStock: 1, isActive: 1 });
productSchema.index({ featured: 1, isBestSeller: 1 });

module.exports = mongoose.model("Product", productSchema);
