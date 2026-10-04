const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: { type: String, required: [true, 'Car make is required'] },
  model: { type: String, required: [true, 'Car model is required'] },
  year: { type: Number, required: [true, 'Car year is required'], min: [1950, 'Year must be after 1950'], max: [new Date().getFullYear() + 1, 'Invalid future year'] },
  pricePerDay: { type: Number, required: [true, 'Price per day is required'], min: [1, 'Price per day must be at least 1'] },
  isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model('Car', carSchema);