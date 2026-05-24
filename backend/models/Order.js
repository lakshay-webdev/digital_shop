const mongoose = require("mongoose");

const ORDER_STATUSES = [
  "pending", "confirmed", "packed",
  "shipped", "out_for_delivery", "delivered",
  "cancelled", "return_requested", "returned", "refunded",
];

const itemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:      String,
  image:     String,
  variant:   String,
  quantity:  { type: Number, required: true, min: 1 },
  price:     { type: Number, required: true },
  mrp:       Number,
});

const statusHistorySchema = new mongoose.Schema({
  status:    { type: String, enum: ORDER_STATUSES },
  changedAt: { type: Date, default: Date.now },
  note:      String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const orderSchema = new mongoose.Schema(
  {
    orderId:  { type: String, unique: true },  // DS + 8-digit
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items:    [itemSchema],

    // Address snapshot
    shippingAddress: {
      fullName: String, phone: String,
      line1: String, line2: String,
      city: String, state: String, pinCode: String,
    },

    // Pricing
    subtotal:      { type: Number, required: true },
    discount:      { type: Number, default: 0 },
    couponCode:    String,
    couponDiscount:{ type: Number, default: 0 },
    deliveryFee:   { type: Number, default: 0 },
    taxAmount:     { type: Number, default: 0 },
    totalAmount:   { type: Number, required: true },

    // Payment
    paymentMethod: { type: String, enum: ["cod", "upi", "card", "wallet", "razorpay", "stripe"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paymentId:     String,    // Razorpay / Stripe payment ID
    razorpayOrderId: String,

    // Fulfillment
    status:         { type: String, enum: ORDER_STATUSES, default: "pending" },
    statusHistory:  [statusHistorySchema],
    trackingNumber: String,
    courier:        String,
    estimatedDelivery: Date,
    deliveredAt:    Date,

    // Returns
    returnReason:   String,
    returnRequestedAt: Date,
    refundAmount:   Number,
    refundedAt:     Date,

    notes: String,
  },
  { timestamps: true }
);

// Auto-generate orderId
orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const count = await this.constructor.countDocuments();
    this.orderId = "DS" + String(10000000 + count + 1).slice(-8);
  }
  // Push status history on change
  if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", orderSchema);
