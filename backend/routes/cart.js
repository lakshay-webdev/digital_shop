// ─── Cart ────────────────────────────────────────────────
const cartRouter = require("express").Router();
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

// In-memory per-user carts (use Redis/DB for production)
// We store cart in the User doc for persistence
const User = require("../models/User");

cartRouter.get("/", protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate("cart.product");
  res.json({ success: true, cart: user.cart || [] });
});

cartRouter.post("/add", protect, async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.inStock)
    return res.status(400).json({ success: false, message: "Product unavailable" });

  const user = await User.findById(req.user._id);
  if (!user.cart) user.cart = [];
  const idx = user.cart.findIndex(
    i => i.product.toString() === productId && i.variant === variant
  );
  if (idx > -1) user.cart[idx].quantity += quantity;
  else user.cart.push({ product: productId, quantity, variant });
  await user.save();
  res.json({ success: true, message: "Added to cart", cart: user.cart });
});

cartRouter.put("/update/:productId", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  const item = user.cart?.find(i => i.product.toString() === req.params.productId);
  if (!item) return res.status(404).json({ success: false, message: "Not in cart" });
  if (req.body.quantity <= 0) user.cart.pull({ product: req.params.productId });
  else item.quantity = req.body.quantity;
  await user.save();
  res.json({ success: true, cart: user.cart });
});

cartRouter.delete("/remove/:productId", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = (user.cart || []).filter(i => i.product.toString() !== req.params.productId);
  await user.save();
  res.json({ success: true, cart: user.cart });
});

cartRouter.delete("/clear", protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
  res.json({ success: true, message: "Cart cleared" });
});

module.exports = cartRouter;

// ─── Wishlist ────────────────────────────────────────────
// (separate file in real project; combined here for brevity)

// ─── Reviews ─────────────────────────────────────────────
const reviewRouter = require("express").Router();
reviewRouter.get("/product/:productId", async (req, res) => {
  const product = await Product.findById(req.params.productId)
    .select("reviews avgRating numReviews")
    .populate("reviews.user", "name avatar");
  if (!product) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, reviews: product.reviews, avgRating: product.avgRating, numReviews: product.numReviews });
});
module.exports.reviewRouter = reviewRouter;

// ─── Coupons ─────────────────────────────────────────────
const couponRouter = require("express").Router();
const { Coupon } = require("../models/misc");
const { adminOnly: ao } = require("../middleware/auth");

couponRouter.post("/validate", protect, async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.body.code?.toUpperCase(), isActive: true });
  if (!coupon || !coupon.isValid())
    return res.status(400).json({ success: false, message: "Invalid or expired coupon" });
  const alreadyUsed = coupon.users.includes(req.user._id);
  if (alreadyUsed && coupon.perUserLimit <= coupon.users.filter(u => u.toString() === req.user._id.toString()).length)
    return res.status(400).json({ success: false, message: "Coupon already used" });
  const discount = coupon.calcDiscount(req.body.orderAmount);
  res.json({ success: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value, discount } });
});

couponRouter.get("/",     ...ao, async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});
couponRouter.post("/",    ...ao, async (req, res) => {
  const c = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon: c });
});
couponRouter.put("/:id",  ...ao, async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, coupon: c });
});
couponRouter.delete("/:id", ...ao, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Deleted" });
});
module.exports.couponRouter = couponRouter;

// ─── Banners ─────────────────────────────────────────────
const bannerRouter = require("express").Router();
const { Banner } = require("../models/misc");

bannerRouter.get("/", async (_req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ position: 1 });
  res.json({ success: true, banners });
});
bannerRouter.post("/",     ...ao, async (req, res) => {
  const b = await Banner.create(req.body);
  res.status(201).json({ success: true, banner: b });
});
bannerRouter.put("/:id",   ...ao, async (req, res) => {
  const b = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, banner: b });
});
bannerRouter.delete("/:id",...ao, async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Banner deleted" });
});
module.exports.bannerRouter = bannerRouter;
