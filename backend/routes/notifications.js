const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");

// In production replace with a proper Notification mongoose model
const mockNotifications = [
  { id: 1, type: "order", message: "Your order #DS10042 has been shipped!", read: false, createdAt: new Date() },
  { id: 2, type: "offer", message: "Flash Sale! Extra 20% off on Electronics", read: false, createdAt: new Date() },
];

router.get("/", protect, (_req, res) => {
  res.json({ success: true, notifications: mockNotifications });
});

router.put("/:id/read", protect, (req, res) => {
  const n = mockNotifications.find(n => n.id === Number(req.params.id));
  if (n) n.read = true;
  res.json({ success: true, message: "Marked as read" });
});

router.put("/read-all", protect, (_req, res) => {
  mockNotifications.forEach(n => (n.read = true));
  res.json({ success: true, message: "All marked as read" });
});

module.exports = router;
