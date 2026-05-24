const router = require("express").Router();
const { Coupon } = require("../models/misc");
const { protect, adminOnly } = require("../middleware/auth");

// POST /api/coupons/validate
router.post("/validate", protect, async (req, res) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });
  if (!coupon || !coupon.isValid())
    return res.status(400).json({ success: false, message: "Invalid or expired coupon" });
  const discount = coupon.calcDiscount(orderAmount || 0);
  res.json({ success: true, discount, coupon: { code: coupon.code, type: coupon.type, value: coupon.value } });
});

// Admin CRUD
router.get("/",      ...adminOnly, async (_req, res) => {
  res.json({ success: true, coupons: await Coupon.find().sort({ createdAt: -1 }) });
});
router.post("/",     ...adminOnly, async (req, res) => {
  const c = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon: c });
});
router.put("/:id",   ...adminOnly, async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, coupon: c });
});
router.delete("/:id",...adminOnly, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Deleted" });
});

module.exports = router;
