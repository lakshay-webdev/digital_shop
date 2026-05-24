require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const app = express();

// Connect DB
connectDB();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.CUSTOMER_URL,
        process.env.CLIENT_URL,
        process.env.ADMIN_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "https://digital-shop-dnl8cmuna-lakshay3452s-projects.vercel.app",
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many auth attempts",
});
app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

// Body Parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// ── Routes ──────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/users", require("./routes/users"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/banners", require("./routes/banners"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api", require("./routes/runSeed"));

// Root Route
app.get("/", (_req, res) =>
  res.json({ message: "🚀 DigiSho API is Live!", status: "OK" })
);

// Health Check
app.get("/api/health", (_req, res) =>
  res.json({ status: "OK", timestamp: new Date() })
);

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`🚀 DigiSho API running on port ${PORT}`)
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Stop the process using this port or set PORT to a free port.`
    );
    process.exit(1);
  }
  throw err;
});