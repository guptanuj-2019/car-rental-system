import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CustomerPanel = ({ userToken, onLogout }) => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const res = await axios.get('/api/cars');
      setCars(res.data.cars || []);
    } catch (err) {
      setMessage('Failed to load fleet catalog.');
    }
  };

  const calculateTotal = () => {
    if (!startDate || !endDate || !selectedCar) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days > 0 ? days * selectedCar.dailyRate : 0;
  };

  const generatePDFReceipt = (booking) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('OFFICIAL RENTAL RECEIPT', 14, 22);
    doc.setFontSize(11);
    doc.text(`Booking Ref: ${booking._id}`, 14, 32);
    doc.text(`Customer ID: ${booking.customer}`, 14, 40);
    doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 14, 48);

    doc.autoTable({
      startY: 55,
      head: [['Vehicle', 'Start Date', 'End Date', 'Payment Strategy', 'Total Amount']],
      body: [[
        `${selectedCar.make} ${selectedCar.model}`,
        new Date(booking.startDate).toLocaleDateString(),
        new Date(booking.endDate).toLocaleDateString(),
        booking.paymentMethod,
        `$${booking.totalCost}`
      ]],
    });

    doc.save(`Receipt_${booking._id}.pdf`);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post('/api/bookings', {
        carId: selectedCar._id,
        startDate,
        endDate,
        paymentMethod
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (res.data.success) {
        setMessage('Reservation successful! Receipt downloaded.');
        generatePDFReceipt(res.data.booking);
        setSelectedCar(null);
        fetchCars();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reservation booking failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-indigo-400">DrivePulse Enterprise Portal</h1>
        <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium">
          Sign Out
        </button>
      </header>

      {message && (
        <div className="mb-6 p-4 bg-indigo-900/50 border border-indigo-500 rounded-lg text-indigo-200">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {cars.map((car) => (
            <div key={car._id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between">
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{car.make} {car.model}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    car.status === 'Available' ? 'bg-green-900/60 text-green-300' : 'bg-amber-900/60 text-amber-300'
                  }`}>
                    {car.status}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-4">Model Year: {car.year} | Plate: {car.licensePlate}</p>
                <div className="text-2xl font-extrabold text-indigo-400">${car.dailyRate} <span className="text-xs font-normal text-slate-400">/ day</span></div>
              </div>
              <button
                disabled={car.status !== 'Available'}
                onClick={() => setSelectedCar(car)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed py-3 font-semibold transition-colors"
              >
                {car.status === 'Available' ? 'Select for Reservation' : 'Unavailable'}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Checkout Details</h2>
          {selectedCar ? (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Selected Vehicle</p>
                <p className="font-semibold text-indigo-300">{selectedCar.make} {selectedCar.model} (${selectedCar.dailyRate}/day)</p>
              </div>

              <div>
                <label className="block text-sm mb-1 text-slate-300">Pickup Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-slate-300">Return Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-slate-300">Payment Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  <option value="Card">Credit / Debit Card</option>
                  <option value="UPI">UPI Digital Transfer</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash at Counter</option>
                </select>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="flex flex-col items-center p-3 bg-slate-900 rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=carrental@bank%26am=${calculateTotal()}`}
                    alt="UPI Payment QR"
                    className="w-32 h-32 mb-2 rounded"
                  />
                  <p className="text-xs text-slate-400">Scan QR Code to finalize payment</p>
                </div>
              )}

              <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                <span className="font-bold">Total Computed:</span>
                <span className="text-2xl font-black text-green-400">${calculateTotal()}</span>
              </div>

              <button
                type="submit"
                disabled={loading || calculateTotal() <= 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 py-3 rounded-lg font-bold transition-colors"
              >
                {loading ? 'Processing...' : 'Confirm Reservation & Pay'}
              </button>
            </form>
          ) : (
            <p className="text-slate-400 text-sm">Select an available car from the catalog to begin reservation checkout.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPanel;
