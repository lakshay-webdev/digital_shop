const router   = require("express").Router();
const Product  = require("../models/Product");
const { Category } = require("../models/misc");
const { protect, adminOnly } = require("../middleware/auth");

// ── Helpers ───────────────────────────────────────────────

const buildFilter = async (q) => {
  const f = { isActive: true };

  if (q.category) {
    const isObjectId = q.category.match(/^[0-9a-fA-F]{24}$/);
    if (isObjectId) {
      f.category = q.category;
    } else {
      const cat = await Category.findOne({ slug: q.category });
      if (cat) {
        f.category = cat._id;
      } else {
        f.category = null;
      }
    }
  }

  if (q.brand)      f.brand      = { $regex: q.brand, $options: "i" };
  if (q.inStock)    f.inStock    = q.inStock === "true";
  if (q.featured)   f.featured   = true;
  if (q.bestSeller) f.isBestSeller = true;
  if (q.newArrival) f.isNewArrival = true;
  if (q.minPrice || q.maxPrice) {
    f.price = {};
    if (q.minPrice) f.price.$gte = Number(q.minPrice);
    if (q.maxPrice) f.price.$lte = Number(q.maxPrice);
  }
  if (q.rating) f.avgRating = { $gte: Number(q.rating) };
  if (q.search) f.$text = { $search: q.search };
  return f;
};

const paginationMeta = (total, page, limit) => ({
  total, page: Number(page), limit: Number(limit),
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

// ── Public routes ─────────────────────────────────────────

// GET /api/products
router.get("/", async (req, res) => {
  const page  = Math.max(1, Number(req.query.page  || 1));
  const limit = Math.min(50, Number(req.query.limit || 20));
  const skip  = (page - 1) * limit;

  const sortMap = {
    newest:    { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc:{ price: -1 },
    rating:    { avgRating: -1 },
    popular:   { soldCount: -1 },
    relevance: { score: { $meta: "textScore" } },
  };
  const sort   = sortMap[req.query.sort] || sortMap.newest;
  const filter = await buildFilter(req.query);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sort).skip(skip).limit(limit)
      .select("-reviews"),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginationMeta(total, page, limit), products });
});

// GET /api/products/featured
router.get("/featured", async (_req, res) => {
  const products = await Product.find({ featured: true, isActive: true })
    .populate("category", "name slug").limit(8).select("-reviews");
  res.json({ success: true, products });
});

// GET /api/products/search?q=
router.get("/search", async (req, res) => {
  const { q = "", limit = 8 } = req.query;
  if (q.length < 2) return res.json({ success: true, suggestions: [] });
  const products = await Product.find(
    { $text: { $search: q }, isActive: true },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } }).limit(Number(limit))
   .select("name brand price thumbnail slug avgRating");
  res.json({ success: true, suggestions: products });
});

// ✅ GET /api/products/:id/related — MUST be before /:id route
router.get("/:id/related", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("category brand");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Same category ke products
    const related = await Product.find({
      _id:      { $ne: product._id },
      category: product.category,
      isActive: true,
      inStock:  true,
    })
      .populate("category", "name slug")
      .select("name slug brand price mrp discount thumbnail images avgRating numReviews inStock isBestSeller stock")
      .sort({ isBestSeller: -1, soldCount: -1 })
      .limit(8);

    // Agar 4 se kam mile to same brand ke bhi fill karo
    if (related.length < 4) {
      const existingIds = [product._id, ...related.map((p) => p._id)];
      const more = await Product.find({
        _id:      { $nin: existingIds },
        brand:    product.brand,
        isActive: true,
        inStock:  true,
      })
        .populate("category", "name slug")
        .select("name slug brand price mrp discount thumbnail images avgRating numReviews inStock isBestSeller stock")
        .sort({ soldCount: -1 })
        .limit(8 - related.length);

      related.push(...more);
    }

    res.json({ success: true, products: related });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:idOrSlug
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const query = id.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: id } : { slug: id };
  const product = await Product.findOne({ ...query, isActive: true })
    .populate("category", "name slug")
    .populate("reviews.user", "name avatar");
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });
  res.json({ success: true, product });
});

// ── Admin-only routes ─────────────────────────────────────

router.post("/", ...adminOnly, async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

router.put("/:id", ...adminOnly, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!product) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, product });
});

router.delete("/:id", ...adminOnly, async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: "Product removed" });
});

router.put("/:id/stock", ...adminOnly, async (req, res) => {
  const { stock } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock, inStock: stock > 0 },
    { new: true }
  );
  res.json({ success: true, product });
});

router.post("/:id/reviews", protect, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  const already = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (already) return res.status(400).json({ success: false, message: "Already reviewed" });
  product.reviews.push({
    user:    req.user._id,
    rating:  req.body.rating,
    title:   req.body.title,
    comment: req.body.comment,
  });
  product.calcAvgRating();
  await product.save();
  res.status(201).json({ success: true, message: "Review added" });
});

module.exports = router;