const express = require("express");
const router = express.Router();
const upload = require("../middleware/multerconfig"); // your multer config file

// Upload single image
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid type" });
  }

  // Build the accessible URL
  const imagePath = `/uploads/${req.file.filename}`;

  // Here you can save `imagePath` in your database if needed

  res.json({
    message: "Image uploaded successfully!",
    path: imagePath,
  });
});

module.exports = router;
