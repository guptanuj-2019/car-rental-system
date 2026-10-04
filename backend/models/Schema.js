const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Customer', 'Rental Staff', 'Admin'], 
    default: 'Customer' 
  },
  requirePasswordChange: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  resetOtp: { type: String, default: null },
  resetOtpExpires: { type: Date, default: null }
}, { timestamps: true });

const carSchema = new mongoose.Schema({
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  licensePlate: { type: String, required: true, unique: true, uppercase: true, trim: true },
  dailyRate: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['Available', 'Rented', 'Maintenance', 'Decommissioned'], 
    default: 'Available' 
  },
  imageUrl: { type: String, default: '' },
  features: [{ type: String }]
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalCost: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Picked', 'Returned', 'Cancelled', 'Rejected'], 
    default: 'Pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Unpaid', 'Paid', 'Refunded'], 
    default: 'Unpaid' 
  },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Net Banking'], default: 'Cash' },
  receiptUrl: { type: String, default: '' },
  requestedModification: {
    newEndDate: { type: Date },
    additionalCost: { type: Number },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'] }
  }
}, { timestamps: true });

const inspectionSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Check-In', 'Check-Out'], required: true },
  odometerReading: { type: Number, required: true },
  fuelLevel: { type: Number, required: true, min: 0, max: 100 },
  existingDamageNotes: { type: String, default: 'None' },
  photos: [{ type: String }]
}, { timestamps: true });

const maintenanceSchema = new mongoose.Schema({
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  serviceType: { type: String, required: true },
  description: { type: String },
  cost: { type: Number, required: true, default: 0 },
  startDate: { type: Date, required: true },
  completionDate: { type: Date },
  status: { type: String, enum: ['Scheduled', 'In-Progress', 'Completed'], default: 'Scheduled' }
}, { timestamps: true });

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  ipAddress: { type: String },
  details: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Car: mongoose.model('Car', carSchema),
  Booking: mongoose.model('Booking', bookingSchema),
  Inspection: mongoose.model('Inspection', inspectionSchema),
  Maintenance: mongoose.model('Maintenance', maintenanceSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema)
};
