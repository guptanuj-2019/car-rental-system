const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/authMiddleware');

// 1. Configure Cloudinary with your .env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. The Upload Route (No Multer Needed anymore!)
router.post('/receipt', protect, async (req, res) => {
  try {
    // We expect a Base64 string and a Booking ID from the frontend JSON body
    const { pdfData, bookingId } = req.body;

    if (!pdfData) {
      return res.status(400).json({ message: 'No PDF data provided' });
    }

    // Direct Base64 upload to Cloudinary. 100% immune to file corruption!
    const result = await cloudinary.uploader.upload(pdfData, {
      folder: 'car_rental_receipts',
      resource_type: 'auto', // Cloudinary automatically detects it is a PDF when sent via Base64
      public_id: `Receipt_${bookingId}_${Date.now()}`
    });

    // Send the safe Cloudinary URL back to the frontend!
    res.status(200).json({
      message: 'Receipt uploaded successfully',
      url: result.secure_url,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Cloudinary upload failed' });
  }
});

module.exports = router;