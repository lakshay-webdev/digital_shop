const router   = require("express").Router();
const Razorpay = require("razorpay");
const Stripe   = require("stripe");
const crypto   = require("crypto");
const express  = require("express");
const Order    = require("../models/Order");
const { protect } = require("../middleware/auth");

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

const ensureRazorpay = (res) => {
  if (!razorpay) {
    res.status(500).json({ success: false, message: "Razorpay is not configured" });
    return false;
  }
  return true;
};

const ensureStripe = (res) => {
  if (!stripe) {
    res.status(500).json({ success: false, message: "Stripe is not configured" });
    return false;
  }
  return true;
};

// POST /api/payments/razorpay/create-order
router.post("/razorpay/create-order", protect, async (req, res) => {
  if (!ensureRazorpay(res)) return;
  const { amount } = req.body;  // in rupees
  const options = {
    amount:   Math.round(amount * 100),  // convert to paise
    currency: "INR",
    receipt:  `receipt_${Date.now()}`,
  };
  const order = await razorpay.orders.create(options);
  res.json({ success: true, order });
});

// POST /api/payments/razorpay/verify
router.post("/razorpay/verify", protect, async (req, res) => {
  if (!ensureRazorpay(res)) return;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expected !== razorpay_signature)
    return res.status(400).json({ success: false, message: "Payment verification failed" });

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: "paid",
    paymentId:     razorpay_payment_id,
    status:        "confirmed",
  });

  res.json({ success: true, message: "Payment verified" });
});

// POST /api/payments/stripe/create-intent
router.post("/stripe/create-intent", protect, async (req, res) => {
  if (!ensureStripe(res)) return;
  const { amount } = req.body;
  const intent = await stripe.paymentIntents.create({
    amount:   Math.round(amount * 100),
    currency: "inr",
    metadata: { userId: req.user._id.toString() },
  });
  res.json({ success: true, clientSecret: intent.client_secret });
});

// ✅ FIX: Stripe webhook needs raw body — use express.raw() middleware inline
// This route MUST be registered BEFORE express.json() in server.js, OR use raw parser here.
// We use express.raw() as route-level middleware to capture raw body for signature verification.
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),  // ✅ FIX: raw body parsed here, not from req.rawBody
  async (req, res) => {
    if (!ensureStripe(res)) return;
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      // req.body is a Buffer here because of express.raw()
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Stripe webhook error:", err.message);
      return res.status(400).send(`Webhook error: ${err.message}`);
    }
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      await Order.findOneAndUpdate(
        { paymentId: paymentIntent.id },
        { paymentStatus: "paid", status: "confirmed" }
      );
    }
    res.json({ received: true });
  }
);

module.exports = router;