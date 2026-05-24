const mongoose = require("mongoose");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI?.trim() || "mongodb://127.0.0.1:27017/digisho";
    if (!process.env.MONGODB_URI) {
      console.warn("⚠️ MONGODB_URI is not set. Falling back to local MongoDB URI:", uri);
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;