const Booking = require('../models/Booking');
const Car = require('../models/Car'); 
const { sendBookingAlert, sendPaymentAlert } = require('../utils/sendNotifications'); 

const getCarBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ car: req.params.carId, status: { $nin: ['Cancelled', 'Rejected', 'Returned'] } }).select('startDate endDate');
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createBooking = async (req, res) => {
  const { carId, startDate, endDate, totalCost, paymentMethod, paymentStatus } = req.body;
  try {
    const reqStart = new Date(startDate); const reqEnd = new Date(endDate);
    const conflictingBookings = await Booking.find({ car: carId, status: { $nin: ['Cancelled', 'Rejected', 'Returned'] }, $and: [ { startDate: { $lt: reqEnd } }, { endDate: { $gt: reqStart } } ] });
    if (conflictingBookings.length > 0) return res.status(400).json({ message: 'Dates unavailable.' });

    const booking = await Booking.create({ user: ((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))))._id, car: carId, startDate, endDate, totalCost, paymentMethod: paymentMethod || 'card', paymentStatus: paymentStatus || 'Paid' });
    const car = await Car.findById(carId);
    sendBookingAlert(((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))), car, booking);
    if (booking.paymentStatus === 'Paid') sendPaymentAlert(((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))), car, booking);
    res.status(201).json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyBookings = async (req, res) => {
  try {
    await Booking.updateMany({ user: ((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))))._id, status: 'Returned', paymentStatus: { $ne: 'Paid' } }, { $set: { paymentStatus: 'Paid' } });
    await Booking.updateMany({ user: ((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))))._id, status: { $in: ['Cancelled', 'Rejected'] }, paymentStatus: { $ne: 'Refunded' } }, { $set: { paymentStatus: 'Refunded' } });
    const bookings = await Booking.find({ user: ((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))))._id }).populate('car');
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    if (status === 'Returned') booking.paymentStatus = 'Paid';
    if (status === 'Rejected') booking.paymentStatus = 'Refunded';

    // --- NEW FIX: Automatically reject pending modifications if the trip is closed ---
    if (['Returned', 'Cancelled', 'Rejected'].includes(status) && booking.requestedModification && booking.requestedModification.status === 'Pending') {
        booking.requestedModification.status = 'Rejected';
    }

    await booking.save();
    await booking.populate('user', 'name email');
    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAllBookings = async (req, res) => {
  try {
    await Booking.updateMany({ status: 'Returned', paymentStatus: { $ne: 'Paid' } }, { $set: { paymentStatus: 'Paid' } });
    await Booking.updateMany({ status: { $in: ['Cancelled', 'Rejected'] }, paymentStatus: { $ne: 'Refunded' } }, { $set: { paymentStatus: 'Refunded' } });
    const bookings = await Booking.find({}).populate('user', 'name email').populate('car', 'make model');
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate({ _id: req.params.id, user: ((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))))._id }, { status: 'Cancelled', paymentStatus: 'Refunded' }, { new: true });
    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updatePayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user').populate('car');
    const isOwner = booking.user._id.toString() === ((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))))._id.toString();
    const isStaff = ['Admin', 'Rental Staff'].includes(((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))).role);
    if (!isOwner && !isStaff) return res.status(403).json({ message: 'Not authorized' });

    booking.paymentStatus = 'Paid';
    await booking.save();
    sendPaymentAlert(booking.user, booking.car, booking);
    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const requestModification = async (req, res) => {
  const { startDate, endDate, newTotalCost } = req.body;
  try {
    const booking = await Booking.findOneAndUpdate({ _id: req.params.id, user: ((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))))._id }, { requestedModification: { startDate, endDate, newTotalCost, status: 'Pending' } }, { new: true });
    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const approveModification = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if(booking.requestedModification && booking.requestedModification.status === 'Pending') {
      booking.startDate = booking.requestedModification.startDate;
      booking.endDate = booking.requestedModification.endDate;
      booking.totalCost = booking.requestedModification.newTotalCost;
      booking.requestedModification.status = 'Approved';
      booking.paymentStatus = 'Pending'; 
      await booking.save();
    }
    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const rejectModification = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if(booking.requestedModification && booking.requestedModification.status === 'Pending') {
      booking.requestedModification.status = 'Rejected';
      await booking.save();
    }
    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getCarBookings, createBooking, getMyBookings, updateBookingStatus, getAllBookings, cancelBooking, updatePayment, requestModification, approveModification, rejectModification };
