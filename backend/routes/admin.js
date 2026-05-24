const router  = require("express").Router();
const Order   = require("../models/Order");
const Product = require("../models/Product");
const User    = require("../models/User");
const { adminOnly } = require("../middleware/auth");

// GET /api/admin/stats  — main dashboard KPIs
router.get("/stats", ...adminOnly, async (_req, res) => {
  const now    = new Date();
  const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month  = new Date(now.getFullYear(), now.getMonth(), 1);
  const prev   = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalRevenue,
    monthRevenue,
    prevRevenue,
    totalOrders,
    todayOrders,
    pendingOrders,
    totalUsers,
    newUsersMonth,
    totalProducts,
    lowStockProducts,
  ] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Order.aggregate([{ $match: { paymentStatus: "paid", createdAt: { $gte: month } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Order.aggregate([{ $match: { paymentStatus: "paid", createdAt: { $gte: prev, $lt: month } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "customer", createdAt: { $gte: month } }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ stock: { $lte: 5 }, isActive: true }),
  ]);

  const mr = monthRevenue[0]?.total || 0;
  const pr = prevRevenue[0]?.total  || 1;

  res.json({
    success: true,
    stats: {
      totalRevenue:     totalRevenue[0]?.total || 0,
      monthRevenue:     mr,
      revenueGrowth:    Math.round(((mr - pr) / pr) * 100),
      totalOrders,
      todayOrders,
      pendingOrders,
      totalUsers,
      newUsersMonth,
      totalProducts,
      lowStockProducts,
    },
  });
});

// GET /api/admin/revenue-chart?months=6
router.get("/revenue-chart", ...adminOnly, async (req, res) => {
  const months = Number(req.query.months || 6);
  const data   = [];
  const now    = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const result = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
    ]);
    data.push({
      month:   start.toLocaleString("default", { month: "short", year: "2-digit" }),
      revenue: result[0]?.revenue || 0,
      orders:  result[0]?.orders  || 0,
    });
  }
  res.json({ success: true, data });
});

// GET /api/admin/top-products
router.get("/top-products", ...adminOnly, async (_req, res) => {
  const products = await Product.find({ isActive: true })
    .sort({ soldCount: -1 }).limit(10)
    .select("name brand price soldCount avgRating thumbnail");
  res.json({ success: true, products });
});

// GET /api/admin/recent-orders
router.get("/recent-orders", ...adminOnly, async (_req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 }).limit(10)
    .populate("user", "name email");
  res.json({ success: true, orders });
});

// GET /api/admin/order-status-breakdown
router.get("/order-status-breakdown", ...adminOnly, async (_req, res) => {
  const breakdown = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, breakdown });
});

module.exports = router;
