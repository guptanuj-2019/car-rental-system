const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalCost: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Picked', 'Returned', 'Cancelled'], 
    default: 'Pending' 
  },
  
  // --- NEW PAYMENT & MODIFICATION FIELDS ---
  paymentMethod: { type: String, default: 'card' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Refunded'], default: 'Pending' },
  
  requestedModification: {
    startDate: Date,
    endDate: Date,
    newTotalCost: Number,
    status: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);