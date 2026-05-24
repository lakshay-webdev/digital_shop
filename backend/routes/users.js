// ─────────────────────────────────────────────────────────
//  users.js
// ─────────────────────────────────────────────────────────
const userRouter = require("express").Router();
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/users/profile
userRouter.get("/profile", protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/users/profile
userRouter.put("/profile", protect, async (req, res) => {
  const allowed = ["name", "phone", "avatar"];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ success: true, user });
});

// PUT /api/users/change-password
userRouter.put("/change-password", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(req.body.currentPassword)))
    return res.status(400).json({ success: false, message: "Current password incorrect" });
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated" });
});

// Addresses
userRouter.post("/addresses", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

userRouter.put("/addresses/:addrId", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addrId);
  if (!addr) return res.status(404).json({ success: false, message: "Address not found" });
  if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
  Object.assign(addr, req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

userRouter.delete("/addresses/:addrId", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.pull(req.params.addrId);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// Admin — list all users
userRouter.get("/", ...adminOnly, async (req, res) => {
  const page  = Math.max(1, Number(req.query.page  || 1));
  const limit = Number(req.query.limit || 20);
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name:  { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }
  if (req.query.status === "blocked") filter.isBlocked = true;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, total, page, pages: Math.ceil(total/limit) });
});

// Admin — block/unblock
userRouter.put("/:id/block", ...adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "Not found" });
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ success: true, isBlocked: user.isBlocked });
});

module.exports = userRouter;
