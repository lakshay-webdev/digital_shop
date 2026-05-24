const router  = require("express").Router();
const Order   = require("../models/Order");
const Product = require("../models/Product");
const User    = require("../models/User");
const { Coupon } = require("../models/misc");
const { protect, adminOnly } = require("../middleware/auth");
const sendEmail = require("../utils/sendEmail");

// POST /api/orders  — place order
router.post("/", protect, async (req, res) => {
  const {
    items, shippingAddress, paymentMethod,
    couponCode, paymentId, razorpayOrderId,
  } = req.body;

  if (!items?.length)
    return res.status(400).json({ success: false, message: "No items in order" });

  // Fetch product prices from DB (never trust client prices)
  let subtotal = 0;
  const orderItems = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive || !product.inStock)
      return res.status(400).json({ success: false, message: `${item.name} is unavailable` });
    if (product.stock < item.quantity)
      return res.status(400).json({ success: false, message: `Only ${product.stock} left for ${product.name}` });

    orderItems.push({
      product:  product._id,
      name:     product.name,
      image:    product.thumbnail,
      variant:  item.variant || "",
      quantity: item.quantity,
      price:    product.price,
      mrp:      product.mrp,
    });
    subtotal += product.price * item.quantity;

    // Decrement stock
    await Product.findByIdAndUpdate(product._id, {
      $inc: { stock: -item.quantity, soldCount: item.quantity },
      $set: { inStock: product.stock - item.quantity > 0 },
    });
  }

  // Apply coupon
  let couponDiscount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon?.isValid()) {
      couponDiscount = coupon.calcDiscount(subtotal);
      coupon.usedCount += 1;
      coupon.users.push(req.user._id);
      await coupon.save();
    }
  }

  const deliveryFee  = subtotal - couponDiscount > 499 ? 0 : 49;
  const taxAmount    = Math.round((subtotal - couponDiscount) * 0.18);  // 18% GST
  const totalAmount  = subtotal - couponDiscount + deliveryFee + taxAmount;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    paymentId,
    razorpayOrderId,
    paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
    subtotal,
    couponCode,
    couponDiscount,
    deliveryFee,
    taxAmount,
    totalAmount,
    status: "pending",
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  // Update user stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalOrders: 1, totalSpent: totalAmount },
  });

  // Send confirmation email
  try {
    await sendEmail({
      to:       req.user.email,
      subject:  `Order Confirmed — #${order.orderId}`,
      template: "orderConfirm",
      data:     { name: req.user.name, order },
    });
  } catch (e) { console.log("Email failed:", e.message); }

  const populated = await Order.findById(order._id).populate("items.product", "name thumbnail");
  res.status(201).json({ success: true, order: populated });
});

// ✅ FIX: /my MUST come before /:id — otherwise "my" gets treated as an ObjectId and crashes
// GET /api/orders/my  — customer's orders
router.get("/my", protect, async (req, res) => {
  const page  = Math.max(1, Number(req.query.page  || 1));
  const limit = Number(req.query.limit || 10);
  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("items.product", "name thumbnail brand"),
    Order.countDocuments({ user: req.user._id }),
  ]);
  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});

// ── Admin ─────────────────────────────────────────────────

// ✅ FIX: Admin GET all orders also moved above /:id
// GET /api/orders  (admin — all orders)
router.get("/", ...adminOnly, async (req, res) => {
  const page   = Math.max(1, Number(req.query.page  || 1));
  const limit  = Number(req.query.limit || 20);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.orderId = { $regex: req.query.search, $options: "i" };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit)
      .populate("user", "name email phone"),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/orders/:id
router.get("/:id", protect, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email phone")
    .populate("items.product", "name thumbnail brand");
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  // Customer can only see own orders
  if (req.user.role === "customer" && order.user._id.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: "Access denied" });

  res.json({ success: true, order });
});

// PUT /api/orders/:id/cancel
router.put("/:id/cancel", protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Not found" });
  if (order.user.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: "Access denied" });
  if (!["pending", "confirmed"].includes(order.status))
    return res.status(400).json({ success: false, message: "Cannot cancel at this stage" });

  order.status = "cancelled";
  await order.save();

  // Restock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
      $set: { inStock: true },
    });
  }

  res.json({ success: true, message: "Order cancelled", order });
});

// PUT /api/orders/:id/return
router.put("/:id/return", protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || order.user.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: "Access denied" });
  if (order.status !== "delivered")
    return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });

  order.status = "return_requested";
  order.returnReason = req.body.reason || "";
  order.returnRequestedAt = new Date();
  await order.save();

  res.json({ success: true, message: "Return request submitted", order });
});

// PUT /api/orders/:id/status  (admin)
router.put("/:id/status", ...adminOnly, async (req, res) => {
  const { status, trackingNumber, courier, note } = req.body;
  const validStatuses = [
    "confirmed","packed","shipped","out_for_delivery",
    "delivered","cancelled","returned","refunded",
  ];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });

  const order = await Order.findById(req.params.id).populate("user", "email name");
  if (!order) return res.status(404).json({ success: false, message: "Not found" });

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (courier)        order.courier        = courier;
  if (status === "delivered") { order.deliveredAt = new Date(); order.paymentStatus = "paid"; }

  await order.save();

  // Notify customer
  try {
    await sendEmail({
      to:       order.user.email,
      subject:  `Your order #${order.orderId} is now ${status}`,
      template: "orderStatus",
      data:     { name: order.user.name, status, orderId: order.orderId, trackingNumber, note },
    });
  } catch(e) { console.log("Email failed:", e.message); }

  res.json({ success: true, order });
});

module.exports = router;