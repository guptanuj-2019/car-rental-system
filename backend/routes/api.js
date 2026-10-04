const express = require('express');
const router = express.Router();
const controller = require('../controllers/rentalController');
const { authenticateToken, authorizeRoles, logActivity } = require('../middleware/auth');

// Auth
router.post('/users/login', controller.login);

// Fleet
router.get('/cars', controller.getCars);
router.post('/cars', authenticateToken, authorizeRoles('Admin'), logActivity('ADD_CAR', 'FLEET'), controller.addCar);

// Bookings
router.post('/bookings', authenticateToken, logActivity('CREATE_BOOKING', 'BOOKINGS'), controller.createBooking);

// Admin Data
router.get('/admin/bookings', authenticateToken, authorizeRoles('Admin', 'Rental Staff'), controller.getAdminBookings);
router.get('/admin/audit-logs', authenticateToken, authorizeRoles('Admin'), controller.getAuditLogs);

// Inspections & Maintenance
router.post('/inspections', authenticateToken, authorizeRoles('Rental Staff', 'Admin'), logActivity('INSPECTION', 'INSPECTION'), controller.recordInspection);
router.post('/maintenance', authenticateToken, authorizeRoles('Admin'), logActivity('MAINTENANCE', 'FLEET'), controller.scheduleMaintenance);

module.exports = router;
