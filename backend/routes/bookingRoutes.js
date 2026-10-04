const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, updateBookingStatus, getAllBookings, cancelBooking, updatePayment, requestModification, approveModification, rejectModification, getCarBookings } = require('../controllers/bookingController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

router.get('/', protect, staffOnly, getAllBookings);
router.post('/', protect, createBooking);
router.get('/mybookings', protect, getMyBookings);
router.get('/car/:carId', protect, getCarBookings);

router.put('/:id/status', protect, staffOnly, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/pay', protect, updatePayment);
router.put('/:id/request-modification', protect, requestModification);
router.put('/:id/approve-modification', protect, staffOnly, approveModification);
router.put('/:id/reject-modification', protect, staffOnly, rejectModification);

module.exports = router;