const express = require('express');
const router = express.Router();
const { getAvailableCars, addCar, updateCar, getAllCars, deleteCar } = require('../controllers/carController');
const { protect, adminOnly, staffOnly } = require('../middleware/authMiddleware');

// Get all available cars (Customer)
router.get('/', getAvailableCars);

// New route for Staff to manage inventory
router.get('/all', protect, staffOnly, getAllCars);

// Add a new car (Admin Only)
router.post('/', protect, adminOnly, addCar);

// Update car status (Staff or Admin)
router.put('/:id', protect, staffOnly, updateCar);

// Add the delete route at the bottom (Admin Only)
router.delete('/:id', protect, adminOnly, deleteCar);

module.exports = router;