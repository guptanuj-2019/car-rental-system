import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = ({ userToken }) => {
  const [activeTab, setActiveTab] = useState('fleet');
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(2026);
  const [licensePlate, setLicensePlate] = useState('');
  const [dailyRate, setDailyRate] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    const config = { headers: { Authorization: `Bearer ${userToken}` } };
    try {
      if (activeTab === 'fleet') {
        const res = await axios.get('/api/cars', config);
        setCars(res.data.cars || []);
      } else if (activeTab === 'bookings') {
        const res = await axios.get('/api/admin/bookings', config);
        setBookings(res.data.bookings || []);
      } else if (activeTab === 'audit') {
        const res = await axios.get('/api/admin/audit-logs', config);
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load admin module data:', err);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/cars', {
        make, model, year, licensePlate, dailyRate: Number(dailyRate)
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setMake(''); setModel(''); setLicensePlate(''); setDailyRate('');
      fetchAdminData();
    } catch (err) {
      alert('Failed to register car into fleet.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2 text-indigo-500">Fleet Operations Command</h1>
        <p className="text-slate-400 mb-8">Integrated Identity, Fleet Control & Regulatory Audit Monitoring</p>

        <div className="flex space-x-4 border-b border-slate-800 mb-8">
          {['fleet', 'bookings', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-semibold capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'fleet' ? 'Fleet Registry' : tab === 'bookings' ? 'Rental Control' : 'System Audit Logs'}
            </button>
          ))}
        </div>

        {activeTab === 'fleet' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-fit">
              <h3 className="text-lg font-bold mb-4 text-indigo-400">Register New Vehicle</h3>
              <form onSubmit={handleAddCar} className="space-y-4">
                <input
                  placeholder="Make (e.g. Tesla)"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm"
                  required
                />
                <input
                  placeholder="Model (e.g. Model 3)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm"
                  required
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm"
                  required
                />
                <input
                  placeholder="License Plate"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm"
                  required
                />
                <input
                  type="number"
                  placeholder="Daily Rate ($)"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm"
                  required
                />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded font-semibold transition-colors">
                  Save Vehicle to Fleet
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-indigo-400">Active Fleet Vehicles</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="p-3">Vehicle</th>
                      <th className="p-3">Plate</th>
                      <th className="p-3">Rate/Day</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cars.map((car) => (
                      <tr key={car._id}>
                        <td className="p-3 font-medium">{car.make} {car.model} ({car.year})</td>
                        <td className="p-3 text-slate-400">{car.licensePlate}</td>
                        <td className="p-3 text-green-400 font-semibold">${car.dailyRate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            car.status === 'Available' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                          }`}>
                            {car.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-indigo-400">System Activity & Audit Log</h3>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log._id} className="p-3 bg-slate-950 border border-slate-800 rounded text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-300">{log.action}</span> - <span className="text-slate-400">{log.resource}</span>
                  </div>
                  <div className="text-slate-500">
                    IP: {log.ipAddress} | {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
