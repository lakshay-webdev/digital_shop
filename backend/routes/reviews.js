// reviews.js
const router = require("express").Router();
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

router.get("/product/:productId", async (req, res) => {
  const product = await Product.findById(req.params.productId)
    .select("reviews avgRating numReviews")
    .populate("reviews.user", "name avatar");
  if (!product) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, reviews: product.reviews, avgRating: product.avgRating });
});

router.delete("/:productId/:reviewId", protect, async (req, res) => {
  const product = await Product.findById(req.params.productId);
  const review  = product.reviews.id(req.params.reviewId);
  if (!review) return res.status(404).json({ success: false, message: "Review not found" });
  if (review.user.toString() !== req.user._id.toString() && req.user.role === "customer")
    return res.status(403).json({ success: false, message: "Not your review" });
  product.reviews.pull({ _id: req.params.reviewId });
  product.calcAvgRating();
  await product.save();
  res.json({ success: true, message: "Review removed" });
});

module.exports = router;
