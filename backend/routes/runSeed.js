require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const { Category, Coupon, Banner } = require("../models/misc");
const connectDB = require("../config/db");

const slugify = (value) =>
  value?.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const img = (id) => ({
  thumbnail: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`,
  images: [{ url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`, public_id: id }],
});

const p = (name, brand, catId, price, mrp, desc, imgId, stock, featured, isBestSeller, tags) => ({
  name, slug: slugify(name), brand, category: catId, price, mrp, description: desc,
  ...img(imgId), stock, inStock: stock > 0, featured: !!featured, isBestSeller: !!isBestSeller, tags,
});

router.get("/run-seed", async (req, res) => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany(), Product.deleteMany(),
      Category.deleteMany(), Coupon.deleteMany(), Banner.deleteMany(),
    ]);

    const admin = await User.create({
      name: "Super Admin",
      email: process.env.ADMIN_EMAIL || "admin@digisho.com",
      password: process.env.ADMIN_PASSWORD || "Admin@Secure123",
      role: "superadmin",
      isVerified: true,
    });

    const cats = await Category.insertMany([
      { name: "Electronics", slug: slugify("Electronics"), icon: "📱", description: "Mobiles, Laptops, Accessories" },
      { name: "Fashion", slug: slugify("Fashion"), icon: "👗", description: "Clothing, Shoes, Watches" },
      { name: "Home & Living", slug: slugify("Home & Living"), icon: "🏠", description: "Furniture, Decor, Kitchen" },
      { name: "Beauty", slug: slugify("Beauty"), icon: "💄", description: "Skincare, Makeup, Hair Care" },
      { name: "Gaming", slug: slugify("Gaming"), icon: "🎮", description: "Consoles, Games, Accessories" },
      { name: "Books", slug: slugify("Books"), icon: "📚", description: "Fiction, Non-fiction, Academic" },
    ]);

    const [elec, fash, home, beau, game, book] = cats.map((c) => c._id);

    const products = [
      p("Samsung Galaxy S24 Ultra 5G","Samsung",elec,72999,89999,"Next-gen Galaxy AI flagship.","phone_s24ultra",45,true,true,["mobile","samsung","5g"]),
      p("Apple iPhone 15 Pro Max","Apple",elec,134900,154900,"Titanium build, A17 Pro chip.","phone_15promax",20,true,true,["mobile","apple","iphone"]),
      p("OnePlus 12 5G","OnePlus",elec,64999,74999,"Hasselblad camera, Snapdragon 8 Gen 3.","phone_op12",40,true,true,["mobile","oneplus","5g"]),
      p("Sony WH-1000XM5","Sony",elec,24990,34990,"Industry-leading ANC headphones.","audio_wh1000xm5",78,false,true,["headphones","sony","anc"]),
      p("Apple MacBook Air M3 13\"","Apple",elec,114900,134900,"Supercharged by Apple M3 chip.","laptop_mba_m3",12,true,true,["laptop","apple","macbook"]),
      p("Nike Air Max 270","Nike",fash,12995,15995,"Max Air unit, all-day comfort.","fash_nike_airmax270",40,true,true,["shoes","nike","sneakers"]),
      p("Levi's 511 Slim Fit Jeans","Levi's",fash,2999,4499,"Classic slim fit stretch denim.","fash_levis_511",80,false,true,["jeans","levis","men"]),
      p("Zara Women Blazer Dress","Zara",fash,4999,7499,"Chic structured blazer mini dress.","fash_zara_blazerdress",35,true,true,["dress","zara","women"]),
      p("Manyavar Men Sherwani Set","Manyavar",fash,14999,22999,"Embroidered wedding sherwani.","fash_manyavar_sherwani",15,true,true,["sherwani","manyavar","men"]),
      p("IKEA MALM Bed Frame","IKEA",home,22999,28999,"Minimalist white queen bed frame.","home_ikea_malm_bed",15,true,true,["bed","ikea","furniture"]),
    ];

    await Product.insertMany(products);

    res.json({ success: true, message: `Seeded! Admin: ${admin.email}, Products: ${products.length}, Categories: ${cats.length}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;