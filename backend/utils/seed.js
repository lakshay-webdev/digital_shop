require("dotenv").config();
const mongoose = require("mongoose");
const User     = require("../models/User");
const Product  = require("../models/Product");
const { Category, Coupon, Banner } = require("../models/misc");
const connectDB = require("../config/db");

const slugify = (v) =>
  v?.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const img = (name) =>
  `https://placehold.co/600x600/1a1a2e/ffffff?text=${encodeURIComponent(name.slice(0, 20))}`;

const seed = async () => {
  await connectDB();
  console.log("🌱 Seeding DigiSho database...");

  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Category.deleteMany(),
    Coupon.deleteMany(),
    Banner.deleteMany(),
  ]);
  // ── Admin ──────────────────────────────────────────────
  const admin = await User.create({
    name: "Super Admin",
    email: process.env.ADMIN_EMAIL || "admin@digisho.com",
    password: process.env.ADMIN_PASSWORD || "Admin@Secure123",
    role: "superadmin",
    isVerified: true,
  });
  console.log("✅ Admin created:", admin.email);

  // ── Categories ─────────────────────────────────────────
  const cats = await Category.insertMany([
    { name: "Electronics",   slug: "electronics",      icon: "📱", description: "Mobiles, Laptops, Accessories" },
    { name: "Fashion",       slug: "fashion",          icon: "👗", description: "Clothing, Shoes, Watches" },
    { name: "Home & Living", slug: "home-and-living",  icon: "🏠", description: "Furniture, Decor, Kitchen" },
    { name: "Beauty",        slug: "beauty",           icon: "💄", description: "Skincare, Makeup, Hair Care" },
    { name: "Gaming",        slug: "gaming",           icon: "🎮", description: "Consoles, Games, Accessories" },
    { name: "Books",         slug: "books",            icon: "📚", description: "Fiction, Non-fiction, Academic" },
    { name: "Sports",        slug: "sports",           icon: "⚽", description: "Equipment, Clothing, Accessories" },
  ]);
  console.log("✅ Categories created:", cats.length);

  const catMap = {};
  cats.forEach(c => { catMap[c.slug] = c._id; });

  // ── Products ───────────────────────────────────────────
  const rawProducts = [
 // ══════════════════════════════════════════════════════
    //  ELECTRONICS  (25 products)
    // ══════════════════════════════════════════════════════
    { name:"Samsung Galaxy S24 Ultra 5G",        brand:"Samsung",   cat:"electronics", price:72999,  mrp:89999,  stock:45, featured:true,  best:true  },
    { name:"Apple iPhone 15 Pro Max 256GB",      brand:"Apple",     cat:"electronics", price:134900, mrp:159900, stock:20, featured:true,  best:true  },
    { name:"OnePlus 12 5G 256GB",                brand:"OnePlus",   cat:"electronics", price:52999,  mrp:64999,  stock:30, featured:false, best:true  },
    { name:"Google Pixel 8 Pro 128GB",           brand:"Google",    cat:"electronics", price:74999,  mrp:89999,  stock:15, featured:false, best:false },
    { name:"Xiaomi 14 Ultra 5G",                 brand:"Xiaomi",    cat:"electronics", price:59999,  mrp:74999,  stock:25, featured:false, best:false },
    { name:"Realme GT 5 Pro 5G",                 brand:"Realme",    cat:"electronics", price:29999,  mrp:39999,  stock:40, featured:false, best:false },
    { name:"Vivo V29 Pro 5G",                    brand:"Vivo",      cat:"electronics", price:34999,  mrp:44999,  stock:35, featured:false, best:false },
    { name:"Apple MacBook Air M3 13 inch",       brand:"Apple",     cat:"electronics", price:114900, mrp:134900, stock:12, featured:true,  best:true  },
    { name:"Dell XPS 15 OLED Laptop",            brand:"Dell",      cat:"electronics", price:134990, mrp:159990, stock:8,  featured:true,  best:false },
    { name:"ASUS ROG Zephyrus G14 Gaming Laptop",brand:"ASUS",      cat:"electronics", price:89990,  mrp:109990, stock:18, featured:false, best:true  },
    { name:"HP Spectre x360 14 2-in-1 Laptop",  brand:"HP",        cat:"electronics", price:109990, mrp:129990, stock:10, featured:false, best:false },
    { name:"Lenovo ThinkPad X1 Carbon",          brand:"Lenovo",    cat:"electronics", price:99990,  mrp:119990, stock:14, featured:false, best:false },
    { name:"Sony WH-1000XM5 Headphones",         brand:"Sony",      cat:"electronics", price:24990,  mrp:34990,  stock:78, featured:false, best:true  },
    { name:"Apple AirPods Pro 2nd Gen",          brand:"Apple",     cat:"electronics", price:24900,  mrp:29900,  stock:60, featured:true,  best:true  },
    { name:"Samsung Galaxy Buds3 Pro",           brand:"Samsung",   cat:"electronics", price:14999,  mrp:19999,  stock:50, featured:false, best:false },
    { name:"JBL Flip 6 Bluetooth Speaker",       brand:"JBL",       cat:"electronics", price:9999,   mrp:13999,  stock:90, featured:false, best:true  },
    { name:"Samsung 65 inch 4K QLED Smart TV",   brand:"Samsung",   cat:"electronics", price:89990,  mrp:119990, stock:15, featured:true,  best:false },
    { name:"LG OLED C3 55 inch Smart TV",        brand:"LG",        cat:"electronics", price:129990, mrp:159990, stock:10, featured:false, best:false },
    { name:"Canon EOS R50 Mirrorless Camera",    brand:"Canon",     cat:"electronics", price:59990,  mrp:74990,  stock:20, featured:false, best:false },
    { name:"Apple iPad Pro M4 11 inch",          brand:"Apple",     cat:"electronics", price:99900,  mrp:119900, stock:22, featured:true,  best:true  },
    { name:"Samsung Galaxy Tab S9 Ultra",        brand:"Samsung",   cat:"electronics", price:72999,  mrp:89999,  stock:18, featured:false, best:false },
    { name:"Apple Watch Series 9 GPS 45mm",      brand:"Apple",     cat:"electronics", price:41900,  mrp:49900,  stock:40, featured:true,  best:true  },
    { name:"Samsung Galaxy Watch 6 Classic",     brand:"Samsung",   cat:"electronics", price:34999,  mrp:44999,  stock:30, featured:false, best:false },
    { name:"Logitech MX Master 3S Wireless",     brand:"Logitech",  cat:"electronics", price:9995,   mrp:12995,  stock:100,featured:false, best:true  },
    { name:"Bose SoundLink Max Portable Speaker",brand:"Bose",      cat:"electronics", price:29900,  mrp:39900,  stock:35, featured:false, best:false },

    // ══════════════════════════════════════════════════════
    //  FASHION  (20 products)
// ══════════════════════════════════════════════════════
    { name:"Nike Air Max 270 Running Shoes",     brand:"Nike",      cat:"fashion",     price:9995,   mrp:12995,  stock:80, featured:true,  best:true  },
    { name:"Adidas Ultraboost 23 Shoes",         brand:"Adidas",    cat:"fashion",     price:11999,  mrp:15999,  stock:60, featured:true,  best:true  },
    { name:"Puma RS-X Puzzle Sneakers",          brand:"Puma",      cat:"fashion",     price:6999,   mrp:9999,   stock:70, featured:false, best:false },
    { name:"Levi's 511 Slim Fit Jeans Men",      brand:"Levi's",    cat:"fashion",     price:2999,   mrp:4499,   stock:120,featured:false, best:true  },
    { name:"H&M Oversized Cotton T-Shirt",       brand:"H&M",       cat:"fashion",     price:799,    mrp:1299,   stock:200,featured:false, best:true  },
    { name:"Zara Floral Printed Midi Dress",     brand:"Zara",      cat:"fashion",     price:3999,   mrp:5999,   stock:50, featured:true,  best:false },
    { name:"Tommy Hilfiger Classic Polo Shirt",  brand:"Tommy Hilfiger", cat:"fashion",price:3499,   mrp:4999,   stock:75, featured:false, best:false },
    { name:"Allen Solly Slim Fit Formal Shirt",  brand:"Allen Solly",cat:"fashion",    price:1499,   mrp:2499,   stock:100,featured:false, best:false },
    { name:"Ray-Ban Aviator Classic Sunglasses", brand:"Ray-Ban",   cat:"fashion",     price:8490,   mrp:12490,  stock:45, featured:true,  best:true  },
    { name:"Fastrack Analog Quartz Watch Men",   brand:"Fastrack",  cat:"fashion",     price:1995,   mrp:2995,   stock:85, featured:false, best:true  },
    { name:"Fossil Gen 6 Hybrid Smartwatch",     brand:"Fossil",    cat:"fashion",     price:14995,  mrp:22995,  stock:40, featured:false, best:false },
    { name:"Wildcraft 45L Trekking Backpack",    brand:"Wildcraft", cat:"fashion",     price:2499,   mrp:3999,   stock:60, featured:false, best:false },
    { name:"Baggit Women Tote Handbag",          brand:"Baggit",    cat:"fashion",     price:1999,   mrp:3499,   stock:55, featured:false, best:false },
    { name:"Woodland Waterproof Hiking Boots",   brand:"Woodland",  cat:"fashion",     price:3999,   mrp:5999,   stock:65, featured:false, best:false },
    { name:"W Women Printed Kurta Set",          brand:"W",         cat:"fashion",     price:1999,   mrp:3299,   stock:90, featured:false, best:true  },
    { name:"Biba Women Ethnic Salwar Kameez",    brand:"Biba",      cat:"fashion",     price:2499,   mrp:3999,   stock:75, featured:false, best:false },
    { name:"Peter England Men Chinos Trousers",  brand:"Peter England", cat:"fashion", price:1999,   mrp:2999,   stock:95, featured:false, best:false },
    { name:"Skechers Go Walk Slip On Shoes",     brand:"Skechers",  cat:"fashion",     price:3999,   mrp:5999,   stock:55, featured:false, best:false },
    { name:"Campus Actus Running Sports Shoes",  brand:"Campus",    cat:"fashion",     price:1299,   mrp:1999,   stock:110,featured:false, best:true  },
    { name:"Roadster Men Bomber Jacket",         brand:"Roadster",  cat:"fashion",     price:2499,   mrp:3999,   stock:70, featured:false, best:false },

    // ══════════════════════════════════════════════════════
    //  HOME & LIVING  (15 products)
    // ══════════════════════════════════════════════════════
    { name:"Instant Pot Duo 7-in-1 Pressure Cooker", brand:"Instant Pot", cat:"home-and-living", price:7999,  mrp:10999, stock:40, featured:true,  best:true  },
    { name:"Philips Digital Air Fryer HD9252",   brand:"Philips",   cat:"home-and-living", price:6999,  mrp:8999,  stock:55, featured:true,  best:true  },
    { name:"Prestige Electric Kettle 1.7L",      brand:"Prestige",  cat:"home-and-living", price:1299,  mrp:1999,  stock:120,featured:false, best:true  },
    { name:"Dyson V15 Detect Cordless Vacuum",   brand:"Dyson",     cat:"home-and-living", price:52900, mrp:62900, stock:15, featured:true,  best:false },
    { name:"Orient Tornado Tower Fan 3 Speed",   brand:"Orient",    cat:"home-and-living", price:4999,  mrp:6999,  stock:45, featured:false, best:false },
    { name:"Bajaj Majesty RX11 Room Heater",     brand:"Bajaj",     cat:"home-and-living", price:2499,  mrp:3499,  stock:70, featured:false, best:false },
    { name:"Solimo Microfiber Double Bedsheet",  brand:"Solimo",    cat:"home-and-living", price:999,   mrp:1799,  stock:200,featured:false, best:true  },
    { name:"Milton Thermosteel Flip Lid Flask",  brand:"Milton",    cat:"home-and-living", price:699,   mrp:1199,  stock:180,featured:false, best:true  },
    { name:"Pigeon Non Stick Cookware Set 5pc",  brand:"Pigeon",    cat:"home-and-living", price:1999,  mrp:2999,  stock:90, featured:false, best:true  },
    { name:"Wipro Garnet LED Bulb 20W Pack",     brand:"Wipro",     cat:"home-and-living", price:499,   mrp:799,   stock:300,featured:false, best:false },
    { name:"Godrej Edge Pro Refrigerator 236L",  brand:"Godrej",    cat:"home-and-living", price:24990, mrp:31990, stock:10, featured:true,  best:false },
    { name:"LG 8kg Fully Auto Washing Machine",  brand:"LG",        cat:"home-and-living", price:34990, mrp:44990, stock:12, featured:false, best:false },
    { name:"Wonderchef Nutri Blend Mixer Juicer",brand:"Wonderchef",cat:"home-and-living", price:3499,  mrp:4999,  stock:75, featured:false, best:true  },
    { name:"Cello Opalware Dinner Set 35pc",     brand:"Cello",     cat:"home-and-living", price:2499,  mrp:3999,  stock:60, featured:false, best:false },
    { name:"Symphony Ice Cube 27 Air Cooler",    brand:"Symphony",  cat:"home-and-living", price:9999,  mrp:13999, stock:30, featured:false, best:false },

    // ══════════════════════════════════════════════════════
    //  BEAUTY  (15 products)
    // ══════════════════════════════════════════════════════
    { name:"Lakme Absolute Mousse Foundation",   brand:"Lakme",     cat:"beauty", price:699,   mrp:999,   stock:150,featured:false, best:true  },
    { name:"Maybelline Fit Me Matte Concealer",  brand:"Maybelline",cat:"beauty", price:399,   mrp:599,   stock:200,featured:false, best:true  },
    { name:"LOreal Paris Revitalift Night Serum",brand:"L'Oreal",   cat:"beauty", price:1299,  mrp:1799,  stock:90, featured:true,  best:true  },
    { name:"Neutrogena Hydro Boost Water Gel",   brand:"Neutrogena",cat:"beauty", price:899,   mrp:1299,  stock:120,featured:false, best:true  },
    { name:"Plum Green Tea Alcohol Free Toner",  brand:"Plum",      cat:"beauty", price:399,   mrp:599,   stock:160,featured:false, best:true  },
    { name:"Mamaearth Vitamin C Face Wash 100ml",brand:"Mamaearth", cat:"beauty", price:299,   mrp:449,   stock:220,featured:true,  best:true  },
    { name:"Dove Intense Repair Shampoo 700ml",  brand:"Dove",      cat:"beauty", price:499,   mrp:699,   stock:200,featured:false, best:true  },
    { name:"Tresemme Keratin Smooth Conditioner",brand:"Tresemme",  cat:"beauty", price:399,   mrp:599,   stock:175,featured:false, best:false },
    { name:"Biotique Morning Nector SPF 30 Cream",brand:"Biotique", cat:"beauty", price:249,   mrp:399,   stock:180,featured:false, best:false },
    { name:"Forest Essentials Facial Scrub",     brand:"Forest Essentials", cat:"beauty", price:995, mrp:1495, stock:80, featured:false, best:false },
    { name:"Nykaa SKINgenius Compact Powder",    brand:"Nykaa",     cat:"beauty", price:549,   mrp:799,   stock:130,featured:false, best:false },
    { name:"Colorbar Matte Touch Lipstick",      brand:"Colorbar",  cat:"beauty", price:499,   mrp:699,   stock:140,featured:false, best:false },
    { name:"Vega Professional Hair Dryer 1800W", brand:"Vega",      cat:"beauty", price:1299,  mrp:1999,  stock:95, featured:false, best:true  },
    { name:"Philips BT3211 Beard Trimmer Men",   brand:"Philips",   cat:"beauty", price:1499,  mrp:2199,  stock:110,featured:false, best:true  },
    { name:"Park Avenue Voyage Perfume 100ml",   brand:"Park Avenue",cat:"beauty",price:699,   mrp:1099,  stock:120,featured:false, best:false },

    // ══════════════════════════════════════════════════════
    //  GAMING  (15 products)
    // ══════════════════════════════════════════════════════
    { name:"Sony PlayStation 5 Console Disc",    brand:"Sony",      cat:"gaming", price:49990, mrp:54990, stock:8,  featured:true,  best:true  },
    { name:"Microsoft Xbox Series X 1TB",        brand:"Microsoft", cat:"gaming", price:49990, mrp:54990, stock:10, featured:true,  best:true  },
    { name:"Nintendo Switch OLED Model",         brand:"Nintendo",  cat:"gaming", price:29999, mrp:34999, stock:15, featured:true,  best:true  },
    { name:"Razer DeathAdder V3 Gaming Mouse",   brand:"Razer",     cat:"gaming", price:6999,  mrp:8999,  stock:55, featured:false, best:true  },
    { name:"Logitech G Pro X Mechanical Keyboard",brand:"Logitech", cat:"gaming", price:8995,  mrp:11995, stock:40, featured:false, best:false },
    { name:"HyperX Cloud Alpha Gaming Headset",  brand:"HyperX",    cat:"gaming", price:6999,  mrp:9999,  stock:60, featured:false, best:true  },
    { name:"ASUS TUF Gaming Monitor 27 165Hz",   brand:"ASUS",      cat:"gaming", price:24990, mrp:32990, stock:20, featured:true,  best:false },
    { name:"Sony DualSense Wireless Controller", brand:"Sony",      cat:"gaming", price:5990,  mrp:6990,  stock:75, featured:false, best:true  },
    { name:"Xbox Elite Wireless Controller S2",  brand:"Microsoft", cat:"gaming", price:13990, mrp:17990, stock:30, featured:false, best:false },
    { name:"Ant Esports GM600 Gaming Chair",     brand:"Ant Esports",cat:"gaming",price:9999,  mrp:14999, stock:25, featured:false, best:false },
    { name:"Green Soul Beast Gaming Chair Pro",  brand:"Green Soul", cat:"gaming", price:13999, mrp:19999, stock:20, featured:false, best:false },
    { name:"Corsair HS80 RGB Wireless Headset",  brand:"Corsair",   cat:"gaming", price:9999,  mrp:13999, stock:35, featured:false, best:false },
    { name:"Acer Nitro 27 QHD Gaming Monitor",   brand:"Acer",      cat:"gaming", price:19990, mrp:26990, stock:18, featured:false, best:false },
    { name:"GTA V Premium Edition PC Download",  brand:"Rockstar",  cat:"gaming", price:999,   mrp:1499,  stock:200,featured:false, best:true  },
    { name:"FIFA 24 PS5 Game Disc",              brand:"EA Sports", cat:"gaming", price:3999,  mrp:4999,  stock:150,featured:false, best:true  },

    // ══════════════════════════════════════════════════════
    //  BOOKS  (10 products)
// ══════════════════════════════════════════════════════
    { name:"Atomic Habits by James Clear",       brand:"Penguin",   cat:"books",  price:399,   mrp:599,   stock:300,featured:true,  best:true  },
    { name:"Rich Dad Poor Dad by Kiyosaki",      brand:"Manjul",    cat:"books",  price:299,   mrp:499,   stock:280,featured:true,  best:true  },
    { name:"The Psychology of Money Housel",     brand:"Jaico",     cat:"books",  price:349,   mrp:549,   stock:250,featured:false, best:true  },
    { name:"Ikigai by Garcia and Miralles",      brand:"Penguin",   cat:"books",  price:249,   mrp:399,   stock:220,featured:false, best:true  },
    { name:"The Alchemist by Paulo Coelho",      brand:"HarperCollins",cat:"books",price:199,  mrp:299,   stock:350,featured:false, best:true  },
    { name:"Harry Potter Complete 7 Book Set",   brand:"Bloomsbury",cat:"books",  price:2999,  mrp:4499,  stock:80, featured:true,  best:true  },
    { name:"Wings of Fire by APJ Abdul Kalam",   brand:"Universities Press",cat:"books",price:199,mrp:299,stock:300,featured:false, best:true  },
    { name:"Zero to One by Peter Thiel",         brand:"Virgin",    cat:"books",  price:399,   mrp:599,   stock:180,featured:false, best:false },
    { name:"Sapiens by Yuval Noah Harari",       brand:"Vintage",   cat:"books",  price:499,   mrp:699,   stock:200,featured:false, best:true  },
    { name:"Can't Hurt Me by David Goggins",     brand:"Lioncrest", cat:"books",  price:549,   mrp:799,   stock:160,featured:false, best:false },

    // ══════════════════════════════════════════════════════
    //  SPORTS  (12 products)
    // ══════════════════════════════════════════════════════
    { name:"Yonex Arcsaber 11 Badminton Racket", brand:"Yonex",     cat:"sports", price:7999,  mrp:10999, stock:50, featured:true,  best:true  },
    { name:"Cosco Brasil Football Size 5",       brand:"Cosco",     cat:"sports", price:999,   mrp:1499,  stock:120,featured:false, best:true  },
    { name:"Nivia Encounter Basketball Size 7",  brand:"Nivia",     cat:"sports", price:1499,  mrp:1999,  stock:90, featured:false, best:false },
    { name:"SG Sunny Tonny Cricket Bat",         brand:"SG",        cat:"sports", price:2499,  mrp:3499,  stock:70, featured:false, best:true  },
    { name:"Strauss Yoga Mat 6mm Anti Slip",     brand:"Strauss",   cat:"sports", price:699,   mrp:999,   stock:200,featured:false, best:true  },
    { name:"PowerMax Fitness Treadmill TDM-100", brand:"PowerMax",  cat:"sports", price:24999, mrp:34999, stock:12, featured:true,  best:false },
    { name:"Boldfit Adjustable Dumbbell 20kg Set",brand:"Boldfit",  cat:"sports", price:3999,  mrp:5999,  stock:60, featured:false, best:true  },
    { name:"Decathlon Kipsta Volleyball V100",   brand:"Decathlon", cat:"sports", price:799,   mrp:1199,  stock:100,featured:false, best:false },
    { name:"Optimum Nutrition Whey Protein 5lb", brand:"ON",        cat:"sports", price:7999,  mrp:9999,  stock:45, featured:true,  best:true  },
    { name:"Nivia Feather Badminton Shuttle 6pc",brand:"Nivia",     cat:"sports", price:299,   mrp:449,   stock:300,featured:false, best:true  },
    { name:"Adidas Predator Football Shoes",     brand:"Adidas",    cat:"sports", price:5999,  mrp:7999,  stock:55, featured:false, best:false },
    { name:"Nike Pro Training Compression Shorts",brand:"Nike",     cat:"sports", price:1999,  mrp:2999,  stock:80, featured:false, best:false },
  ];

  const products = await Product.insertMany(
    rawProducts.map(p => ({
      name: p.name,
      slug: slugify(p.name),
      brand: p.brand,
      category: catMap[p.cat],   // ✅ ObjectId from slug map
      price: p.price,
      mrp: p.mrp,
      stock: p.stock,
      inStock: true,
      featured: p.featured,
      isBestSeller: p.best,
      discount: Math.round(((p.mrp - p.price) / p.mrp) * 100),
      description: `${p.name} by ${p.brand}. Premium quality product with excellent features and value for money. Shop now on DigiSho.`,
      thumbnail: img(p.name),
      images: [{ url: img(p.name), public_id: slugify(p.name) }],
      tags: [p.brand.toLowerCase(), p.cat],
      isActive: true,
    }))
  );
  console.log("✅ Products created:", products.length);

  // ── Coupons ────────────────────────────────────────────
  await Coupon.insertMany([
    { code:"SAVE10",    type:"percent", value:10,  validTill:new Date("2027-12-31"), description:"10% off sitewide" },
    { code:"FLAT500",   type:"flat",    value:500, validTill:new Date("2027-12-31"), minOrderValue:2000, description:"Flat ₹500 off" },
    { code:"LAUNCH20",  type:"percent", value:20,  validTill:new Date("2027-12-31"), usageLimit:500, description:"Launch offer 20% off" },
    { code:"WELCOME15", type:"percent", value:15,  validTill:new Date("2027-12-31"), description:"Welcome offer 15% off" },
  ]);
  console.log("✅ Coupons created");

  // ── Banners ────────────────────────────────────────────
  await Banner.insertMany([
    { title:"Mega Electronics Sale", subtitle:"Up to 40% off on all gadgets",  type:"hero",     position:1, isActive:true },
    { title:"Flash Sale",            subtitle:"Limited deals on Fashion",       type:"offer",    position:2, isActive:true },
    { title:"Summer Collection",     subtitle:"New arrivals for the season",    type:"seasonal", position:3, isActive:true },
    { title:"Gaming Fest",           subtitle:"Best deals on consoles & gear",  type:"hero",     position:4, isActive:true },
    { title:"Beauty Bonanza",        subtitle:"Top skincare & makeup brands",   type:"offer",    position:5, isActive:true },
  ]);
  console.log("✅ Banners created");

  console.log("\n🎉 Seed complete! Total products:", products.length);
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });