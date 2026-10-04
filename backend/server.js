const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json()); 

app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', apiLimiter);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/cars', require('./routes/carRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes')); // NEW UPLOAD ROUTE

app.get('/', (req, res) => {
  res.send('Car Rental API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// --- PRO TERMINAL COLORS ---
const c = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m"
};

app.listen(PORT, () => {
  console.log(`${c.cyan}
  🚗=============================================🚗
   🚀 CAR RENTAL API ENGINE INSTANTIATED 🚀
  🚗=============================================🚗${c.reset}`);
  console.log(`${c.magenta} [SERVER]${c.reset} Listening actively on Port: ${c.yellow}${PORT}${c.reset}`);
});