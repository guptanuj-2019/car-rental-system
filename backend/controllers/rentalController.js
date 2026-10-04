const { User, Car, Booking, Inspection, Maintenance, AuditLog } = require('../models/Schema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }]
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.requirePasswordChange) {
      return res.status(403).json({
        success: false,
        requirePasswordChange: true,
        message: 'Mandatory password change required.'
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ success: true, token, role: user.role, name: user.name, id: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCars = async (req, res) => {
  try {
    const cars = await Car.find();
    res.json({ success: true, cars });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addCar = async (req, res) => {
  try {
    const car = await Car.create(req.body);
    res.status(201).json({ success: true, car });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { carId, startDate, endDate, paymentMethod } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'Invalid date selection range.' });
    }

    const overlappingBooking = await Booking.findOne({
      car: carId,
      status: { $nin: ['Cancelled', 'Rejected'] },$or: [{ startDate: { $lt: end }, endDate: {$gt: start } }]
    });

    if (overlappingBooking) {
      return res.status(409).json({ success: false, message: 'Car unavailable for selected dates.' });
    }

    const car = await Car.findById(carId);
    if (!car || car.status !== 'Available') {
      return res.status(400).json({ success: false, message: 'Car unavailable for rental.' });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalCost = days * car.dailyRate;

    const booking = await Booking.create({
      customer: req.user._id,
      car: carId,
      startDate: start,
      endDate: end,
      totalCost,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash' ? 'Unpaid' : 'Paid',
      status: 'Pending'
    });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdminBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('customer car');
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordInspection = async (req, res) => {
  try {
    const { bookingId, carId, type, odometerReading, fuelLevel, existingDamageNotes, photos } = req.body;
    
    const inspection = await Inspection.create({
      booking: bookingId,
      car: carId,
      inspector: req.user._id,
      type,
      odometerReading,
      fuelLevel,
      existingDamageNotes,
      photos
    });

    if (type === 'Check-Out') {
      await Booking.findByIdAndUpdate(bookingId, { status: 'Returned' });
      await Car.findByIdAndUpdate(carId, { status: 'Available' });
    } else if (type === 'Check-In') {
      await Booking.findByIdAndUpdate(bookingId, { status: 'Picked' });
      await Car.findByIdAndUpdate(carId, { status: 'Rented' });
    }

    res.status(201).json({ success: true, inspection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.scheduleMaintenance = async (req, res) => {
  try {
    const { carId, serviceType, description, cost, startDate } = req.body;

    const maintenance = await Maintenance.create({
      car: carId,
      serviceType,
      description,
      cost,
      startDate,
      status: 'In-Progress'
    });

    await Car.findByIdAndUpdate(carId, { status: 'Maintenance' });
    res.status(201).json({ success: true, maintenance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
