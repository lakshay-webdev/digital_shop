const router     = require("express").Router();
const multer     = require("multer");
const cloudinary = require("cloudinary").v2;
const { adminOnly, protect } = require("../middleware/auth");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"), false);
  },
});

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", quality: "auto", fetch_format: "auto" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// POST /api/upload/product  (admin)
router.post("/product", ...adminOnly, upload.array("images", 5), async (req, res) => {
  const results = await Promise.all(
    req.files.map(f => uploadToCloudinary(f.buffer, "digisho/products"))
  );
  res.json({
    success: true,
    images: results.map(r => ({ url: r.secure_url, public_id: r.public_id })),
  });
});

// POST /api/upload/banner  (admin)
router.post("/banner", ...adminOnly, upload.single("image"), async (req, res) => {
  const result = await uploadToCloudinary(req.file.buffer, "digisho/banners");
  res.json({ success: true, url: result.secure_url, public_id: result.public_id });
});

// POST /api/upload/avatar  (user)
router.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
  const result = await uploadToCloudinary(req.file.buffer, "digisho/avatars");
  res.json({ success: true, url: result.secure_url });
});

// DELETE /api/upload/:publicId
router.delete("/:publicId", ...adminOnly, async (req, res) => {
  await cloudinary.uploader.destroy(decodeURIComponent(req.params.publicId));
  res.json({ success: true, message: "Image deleted" });
});

module.exports = router;
