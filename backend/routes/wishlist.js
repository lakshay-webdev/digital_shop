const router  = require("express").Router();
const User    = require("../models/User");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

// GET /api/wishlist
router.get("/", protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
    select: "name brand price mrp thumbnail avgRating inStock slug",
  });
  res.json({ success: true, wishlist: user.wishlist });
});

// POST /api/wishlist/:productId  — toggle
router.post("/:productId", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  const idx  = user.wishlist.indexOf(req.params.productId);
  let added;
  if (idx > -1) { user.wishlist.splice(idx, 1); added = false; }
  else          { user.wishlist.push(req.params.productId);    added = true; }
  await user.save();
  res.json({ success: true, added, wishlistCount: user.wishlist.length });
});

// DELETE /api/wishlist/:productId
router.delete("/:productId", protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } });
  res.json({ success: true, message: "Removed from wishlist" });
});

module.exports = router;
