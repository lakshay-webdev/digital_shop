const router = require("express").Router();
const { Banner } = require("../models/misc");
const { adminOnly } = require("../middleware/auth");

router.get("/", async (_req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ position: 1 });
  res.json({ success: true, banners });
});
router.post("/",      ...adminOnly, async (req, res) => {
  res.status(201).json({ success: true, banner: await Banner.create(req.body) });
});
router.put("/:id",    ...adminOnly, async (req, res) => {
  res.json({ success: true, banner: await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true }) });
});
router.put("/:id/toggle", ...adminOnly, async (req, res) => {
  const b = await Banner.findById(req.params.id);
  b.isActive = !b.isActive;
  await b.save();
  res.json({ success: true, isActive: b.isActive });
});
router.delete("/:id", ...adminOnly, async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Deleted" });
});

module.exports = router;
