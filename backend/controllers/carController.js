const Car = require('../models/Car');

// @desc    Fetch all available cars
// @route   GET /api/cars
const getAvailableCars = async (req, res) => {
  try {
    const cars = await Car.find({ isAvailable: true });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new car (Admin)
// @route   POST /api/cars
const addCar = async (req, res) => {
  try {
    const car = await Car.create(req.body);
    res.status(201).json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update car details or availability
// @route   PUT /api/cars/:id
const updateCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all cars for Staff/Admin (including unavailable ones)
// @route   GET /api/cars/all
const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find({});
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a car
// @route   DELETE /api/cars/:id
const deleteCar = async (req, res) => {
  try {
    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAvailableCars, addCar, updateCar, getAllCars, deleteCar };