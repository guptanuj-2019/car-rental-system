import { useState, useEffect } from 'react';
import API from '../services/api';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import formatIndian from '../utils/formatNumber';
import Pagination from '../components/Pagination'; 

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [carSearch, setCarSearch] = useState('');
  
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [editingCarId, setEditingCarId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [pages, setPages] = useState({
    users: 1, fleet: 1, availability: 1, bookings: 1, records: 1, revenue: 1
  });
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setPages(prev => ({ ...prev, fleet: 1 }));
  }, [carSearch]);

  const fetchData = async () => {
    try {
      const usersRes = await API.get('/users');
      const bookingsRes = await API.get('/bookings');
      const carsRes = await API.get('/cars/all');
      setUsers(usersRes.data); setBookings(bookingsRes.data); setCars(carsRes.data);
    } catch (error) { console.error('Failed to fetch admin data:', error); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (editingUser) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [editingUser]);

  const handlePageChange = (tab, newPage) => {
    setPages(prev => ({ ...prev, [tab]: newPage }));
  };

  const handleCarSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCarId) {
        await API.put(`/cars/${editingCarId}`, { make, model, year: Number(year), pricePerDay: Number(pricePerDay) });
        // alert('Vehicle updated successfully!');
      } else {
        await API.post('/cars', { make, model, year: Number(year), pricePerDay: Number(pricePerDay) });
        // alert('Vehicle added successfully!');
      }
      setMake(''); setModel(''); setYear(''); setPricePerDay(''); setEditingCarId(null); fetchData();
    } catch (error) { console.error('Failed to save car:', error); }
  };

  const handleEditClick = (car) => { setMake(car.make); setModel(car.model); setYear(car.year); setPricePerDay(car.pricePerDay); setEditingCarId(car._id); };
  const handleDeleteCar = async (id) => { if (window.confirm('Delete this vehicle?')) { try { await API.delete(`/cars/${id}`); fetchData(); } catch (error) { console.error('Failed to delete car:', error); } } };
  const handleAvailabilityToggle = async (id, currentStatus) => { try { await API.put(`/cars/${id}`, { isAvailable: !currentStatus }); fetchData(); } catch (error) { console.error('Failed to update car availability:', error); } };
  const handleStatusUpdate = async (id, newStatus) => { try { await API.put(`/bookings/${id}/status`, { status: newStatus }); fetchData(); } catch (error) { console.error('Failed to update booking status:', error); } };
  const handleDeleteUser = async (id) => { if (window.confirm('Delete this user?')) { try { await API.delete(`/users/${id}`); fetchData(); } catch (error) { console.error('Failed to delete user:', error); } } };

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/${editingUser._id}`, { username: editingUser.username, email: editingUser.email, mobile: editingUser.mobile, role: editingUser.role });
      // alert('User details updated successfully!'); setEditingUser(null); fetchData(); 
    } catch (error) { console.error('Failed to update user:', error); }
  };

  const revenueBookings = bookings.filter(b => b.paymentStatus === 'Paid' && !['Cancelled', 'Rejected'].includes(b.status));
  const totalRevenue = revenueBookings.reduce((acc, curr) => acc + curr.totalCost, 0);
  const activeBookings = bookings.filter(b => ['Pending', 'Approved', 'Picked'].includes(b.status));
  const historicalRecords = bookings.filter(b => ['Returned', 'Rejected', 'Cancelled'].includes(b.status));

  const filteredCars = cars.filter(car => {
    const search = carSearch.toLowerCase();
    return (car.make.toLowerCase().includes(search) || car.model.toLowerCase().includes(search) || car.year.toString().includes(search) || car.pricePerDay.toString().includes(search) || (car.isAvailable ? 'available' : 'offline').includes(search));
  });

  const paginate = (dataArray, page) => dataArray.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const paginatedUsers = paginate(users, pages.users);
  const paginatedActiveBookings = paginate(activeBookings, pages.bookings);
  const paginatedHistorical = paginate(historicalRecords, pages.records);
  const paginatedRevenue = paginate(revenueBookings, pages.revenue);
  const paginatedFleet = paginate(filteredCars, pages.fleet);
  const paginatedCars = paginate(cars, pages.availability);
  
  const downloadReceipt = (booking) => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(30, 58, 138); doc.text("CarRentals - Official Payment Receipt", 14, 20);
    doc.setFontSize(11); doc.setTextColor(100); doc.text(`Receipt No: ${booking._id.substring(0, 10).toUpperCase()}`, 14, 30); doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    autoTable(doc, { startY: 45, head: [['Description', 'Details']], body: [['Customer Name', booking.user?.name || 'Deleted User'], ['Vehicle Rented', `${booking.car?.make || 'Unknown'} ${booking.car?.model || ''}`], ['Rental Duration', `${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}`], ['Booking Status', booking.status.toUpperCase()], ['Payment Method', booking.paymentMethod ? booking.paymentMethod.toUpperCase() : 'N/A'], ['Payment Status', booking.paymentStatus ? booking.paymentStatus.toUpperCase() : 'PAID'], ['Total Amount', `Rs. ${formatIndian(booking.totalCost)}`]], theme: 'grid', headStyles: { fillColor: [30, 58, 138] } });
    doc.setFontSize(14); if (booking.paymentStatus === 'Pending' && !['Cancelled', 'Rejected'].includes(booking.status)) { doc.setTextColor(202, 138, 4); doc.text("Transaction Status: PENDING (Balance Due)", 14, doc.lastAutoTable.finalY + 15); } else { doc.setTextColor(21, 128, 61); doc.text(`Transaction Status: ${['Cancelled', 'Rejected'].includes(booking.status) ? 'REFUNDED/VOID' : 'SUCCESSFUL'}`, 14, doc.lastAutoTable.finalY + 15); }
    window.open(doc.output('bloburl'), '_blank');
  };

  const generateRevenuePDF = () => {
    const doc = new jsPDF(); doc.setFontSize(18); doc.text("Official Revenue Report", 14, 20); doc.setFontSize(11); doc.setTextColor(100); doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    const tableRows = []; revenueBookings.forEach(b => tableRows.push([b._id.substring(0, 8).toUpperCase(), new Date(b.createdAt || b.startDate).toLocaleDateString(), b.user?.name || 'Deleted', `${b.car?.make || 'Unknown'} ${b.car?.model || ''}`, b.paymentStatus || 'Paid', `Rs. ${formatIndian(b.totalCost)}`]));
    autoTable(doc, { head: [["Transaction ID", "Date Generated", "Customer", "Vehicle", "Payment", "Amount"]], body: tableRows, startY: 35, theme: 'grid', headStyles: { fillColor: [21, 128, 61] } });
    doc.setFontSize(14); doc.setTextColor(21, 128, 61); doc.setFont("helvetica", "bold"); doc.text(`Total Verified Revenue: Rs. ${formatIndian(totalRevenue)}`, 14, doc.lastAutoTable.finalY + 15); 
    window.open(doc.output('bloburl'), '_blank');
  };

  const generateRecordsPDF = () => {
    const doc = new jsPDF(); doc.setFontSize(18); doc.text("Official Rental Records Ledger", 14, 20); doc.setFontSize(11); doc.setTextColor(100); doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    const tableRows = []; historicalRecords.forEach(r => tableRows.push([r._id.substring(0, 8).toUpperCase(), r.user?.name || 'Deleted', `${r.car?.make || 'Unknown'} ${r.car?.model || ''}`, `${new Date(r.startDate).toLocaleDateString()} to ${new Date(r.endDate).toLocaleDateString()}`, `Rs. ${formatIndian(r.totalCost)}`, r.paymentStatus || 'Paid', r.status]));
    autoTable(doc, { head: [["Transaction ID", "Customer", "Vehicle", "Dates", "Final Cost", "Payment", "Outcome"]], body: tableRows, startY: 35, theme: 'grid', headStyles: { fillColor: [55, 65, 81] } }); 
    window.open(doc.output('bloburl'), '_blank');
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 md:p-10 font-sans pb-20">
      <div className="max-w-[90rem] mx-auto space-y-6 sm:space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-4 sm:pb-6 print:hidden">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-indigo-800 mb-1 sm:mb-2 tracking-tight leading-tight">
              Master Admin Dashboard
            </h1>
            <p className="text-gray-500 font-bold tracking-wide uppercase text-xs sm:text-sm">System Command Center</p>
          </div>
          
          <div className="mt-4 md:mt-0 w-full md:w-auto flex justify-center md:justify-end">
            <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 flex flex-wrap justify-center gap-0.5 sm:gap-1">
              {['dashboard', 'users', 'fleet', 'availability', 'bookings', 'records'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-3 sm:px-2.5 py-2 sm:py-2.5 text-[9px] sm:text-[11px] lg:text-xs font-bold rounded-full transition-all duration-300 whitespace-nowrap ${activeTab === tab ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-[1.02]' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {tab === 'dashboard' ? 'Revenue & Reports' : tab === 'availability' ? 'Car Availability' : tab === 'bookings' ? 'Monitor Active Bookings' : tab === 'records' ? 'Rental Records' : `Manage ${tab}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 sm:space-y-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-teal-500/20 relative overflow-hidden transform transition hover:-translate-y-1">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2 opacity-90">Total Revenue</h2>
                <p className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight truncate">₹{formatIndian(totalRevenue)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-700 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-500/20 relative overflow-hidden transform transition hover:-translate-y-1">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2 opacity-90">Active Rentals</h2>
                <p className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight truncate">{activeBookings.length}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-fuchsia-700 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/20 relative overflow-hidden transform transition hover:-translate-y-1">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2 opacity-90">Registered Users</h2>
                <p className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight truncate">{users.length}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-500/20 relative overflow-hidden transform transition hover:-translate-y-1">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2 opacity-90">Total Vehicles</h2>
                <p className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight truncate">{cars.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/50">
                <div><h2 className="text-lg sm:text-2xl font-black text-gray-800">Official Revenue Report</h2><p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1 uppercase tracking-wide">Breakdown of all verified transactions.</p></div>
                <button onClick={generateRevenuePDF} className="mt-4 md:mt-0 w-full sm:w-auto bg-white text-emerald-600 border border-emerald-200 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold shadow-sm hover:bg-emerald-50 transition text-xs sm:text-base">📥 View Report</button>
              </div>
              
              <div className="overflow-x-auto w-full">
                <table className="min-w-full text-left whitespace-nowrap">
                  <thead className="bg-white border-b border-gray-100">
                    <tr><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction ID</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Date Generated</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Rented</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Payment</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-right text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Amount (₹)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedRevenue.map((b) => (
                      <tr key={b._id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400">{b._id.substring(0, 10).toUpperCase()}</td><td className="py-3 sm:py-4 px-3 sm:px-6 text-[10px] sm:text-sm font-bold text-gray-600">{new Date(b.createdAt || b.startDate).toLocaleDateString()}</td><td className="py-3 sm:py-4 px-3 sm:px-6 font-black text-gray-800 text-xs sm:text-base">{b.user?.name || 'Deleted User'}</td><td className="py-3 sm:py-4 px-3 sm:px-6 text-[10px] sm:text-sm font-bold text-gray-700">{b.car?.make} {b.car?.model}</td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-center"><span className="text-[9px] sm:text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-emerald-200 uppercase tracking-wider">PAID</span></td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 font-black text-emerald-600 text-right text-sm sm:text-lg">₹{formatIndian(b.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan="5" className="py-4 sm:py-5 px-3 sm:px-6 text-right font-black text-gray-700 uppercase tracking-wider text-[10px] sm:text-sm">Total Verified Revenue:</td>
                      <td className="py-4 sm:py-5 px-3 sm:px-6 font-black text-emerald-600 text-right text-lg sm:text-2xl truncate">₹{formatIndian(totalRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
                {Math.ceil(revenueBookings.length / ITEMS_PER_PAGE) > 1 && (
                  <div className="border-t border-gray-100 p-4 bg-white">
                    <Pagination currentPage={pages.revenue} totalPages={Math.ceil(revenueBookings.length / ITEMS_PER_PAGE)} onPageChange={(p) => handlePageChange('revenue', p)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="min-w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</th>
                    <th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Username</th>
                    <th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</th>
                    <th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Join Date</th>
                    <th className="py-3 sm:py-5 px-3 sm:px-6 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 sm:py-5 px-3 sm:px-6 font-black text-gray-900 text-xs sm:text-base">{u.name}</td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-sm font-bold text-indigo-500">@{u.username || 'N/A'}</td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-sm font-medium text-gray-600"><div>{u.email}</div><div className="text-gray-400 text-xs">{u.mobile || 'No Mobile'}</div></td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-sm ${u.role === 'Admin' ? 'bg-red-50 text-red-600 border-red-200' : u.role === 'Rental Staff' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{u.role}</span>
                      </td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-sm font-bold text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 text-center space-x-1 sm:space-x-3">
                        <button onClick={() => setEditingUser(u)} className="bg-white text-blue-600 border border-blue-200 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg font-bold hover:bg-blue-50 transition shadow-sm text-[9px] sm:text-xs">Edit</button>
                        <button onClick={() => handleDeleteUser(u._id)} className="bg-white text-red-600 border border-red-200 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg font-bold hover:bg-red-50 transition shadow-sm text-[9px] sm:text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Math.ceil(users.length / ITEMS_PER_PAGE) > 1 && (
                <div className="border-t border-gray-100 p-4 bg-white">
                  <Pagination currentPage={pages.users} totalPages={Math.ceil(users.length / ITEMS_PER_PAGE)} onPageChange={(p) => handlePageChange('users', p)} />
                </div>
              )}
            </div>

            {/* FULL SCREEN EDIT USER MODAL */}
            {editingUser && (
              <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 relative w-full">
                  <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 sm:top-10 sm:right-10 text-gray-400 hover:text-red-500 font-black text-2xl sm:text-3xl transition bg-gray-100 hover:bg-red-50 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center">✕</button>
                  
                  <div className="w-full max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-8 sm:mb-12 text-center">Edit User Details</h2>
                    <form onSubmit={handleUserUpdate} className="space-y-6 sm:space-y-8">
                      <div><label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label><input type="text" value={editingUser.name} disabled className="w-full p-4 sm:p-5 border border-gray-200 rounded-2xl bg-gray-100 text-gray-500 cursor-not-allowed font-bold text-sm sm:text-lg" /></div>
                      <div><label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label><input type="text" value={editingUser.username || ''} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className="w-full p-4 sm:p-5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-gray-50 text-sm sm:text-lg" required /></div>
                      <div><label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label><input type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full p-4 sm:p-5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-gray-50 text-sm sm:text-lg" required /></div>
                      <div><label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mobile Number</label><input type="text" maxLength="10" value={editingUser.mobile || ''} onChange={(e) => setEditingUser({...editingUser, mobile: e.target.value.replace(/\D/g, '')})} className="w-full p-4 sm:p-5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-gray-50 text-sm sm:text-lg" required /></div>
                      <div><label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System Role</label>
                        <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} className="w-full p-4 sm:p-5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-black text-indigo-600 shadow-sm cursor-pointer text-sm sm:text-lg">
                          <option value="Customer">Customer</option><option value="Rental Staff">Rental Staff</option><option value="Admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 pt-6 sm:pt-8">
                        <button type="submit" className="w-full sm:w-2/3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 sm:p-5 rounded-2xl font-black shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition hover:-translate-y-0.5 active:scale-95 text-sm sm:text-lg uppercase tracking-widest">Save Changes</button>
                        <button type="button" onClick={() => setEditingUser(null)} className="w-full sm:w-1/3 bg-red-500 text-white p-4 sm:p-5 rounded-2xl font-bold shadow-md hover:bg-red-600 transition active:scale-95 text-sm sm:text-lg uppercase tracking-widest">Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
          
        {/* 3. FLEET TAB */}
        {activeTab === 'fleet' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-1 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 h-fit">
              <h2 className="text-lg sm:text-2xl font-black text-gray-800 mb-4 sm:mb-6 border-b border-gray-100 pb-3 sm:pb-4">{editingCarId ? 'Update Vehicle' : 'Add New Vehicle'}</h2>
              <form onSubmit={handleCarSubmit} className="space-y-3 sm:space-y-5">
                <div><label className="block text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Brand</label><input type="text" placeholder="e.g., Toyota" className="w-full p-3 sm:p-4 border border-gray-200 rounded-xl bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base" value={make} onChange={(e) => setMake(e.target.value)} required /></div>
                <div><label className="block text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Model</label><input type="text" placeholder="e.g., Camry" className="w-full p-3 sm:p-4 border border-gray-200 rounded-xl bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base" value={model} onChange={(e) => setModel(e.target.value)} required /></div>
                <div><label className="block text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Year</label><input type="number" placeholder="e.g., 2024" className="w-full p-3 sm:p-4 border border-gray-200 rounded-xl bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base" value={year} onChange={(e) => setYear(e.target.value)} required /></div>
                <div><label className="block text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Price Per Day (₹)</label><input type="number" placeholder="e.g., 1500" className="w-full p-3 sm:p-4 border border-gray-200 rounded-xl bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} required /></div>
                <button type="submit" className={`w-full text-white p-3 sm:p-4 rounded-xl font-black shadow-lg transition hover:-translate-y-0.5 active:scale-95 text-xs sm:text-base ${editingCarId ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30 hover:shadow-amber-500/50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/50'}`}>{editingCarId ? 'Save Updates' : 'Add Vehicle'}</button>
                {editingCarId && <button type="button" onClick={() => { setEditingCarId(null); setMake(''); setModel(''); setYear(''); setPricePerDay(''); }} className="w-full bg-white border border-gray-200 text-gray-600 p-3 sm:p-4 rounded-xl font-bold hover:bg-gray-50 mt-2 sm:mt-3 transition text-xs sm:text-base">Cancel Edit</button>}
              </form>
            </div>
            <div className="lg:col-span-2 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-x-auto w-full">
              <div className="mb-4 sm:mb-6 relative">
                <span className="absolute left-4 top-3 sm:top-4 text-lg sm:text-xl">🔍</span>
                <input type="text" placeholder="Search by Brand, Model, Year, Price, or Status..." value={carSearch} onChange={(e) => setCarSearch(e.target.value)} className="w-full p-3 sm:p-4 pl-10 sm:pl-12 border-2 border-gray-100 bg-gray-50 rounded-xl sm:rounded-2xl focus:border-indigo-500 outline-none transition font-bold text-gray-700 text-xs sm:text-base"/>
              </div>
              <table className="min-w-full bg-white text-left whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr><th className="py-3 sm:py-4 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th><th className="py-3 sm:py-4 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Rate / Day</th><th className="py-3 sm:py-4 px-3 sm:px-6 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th><th className="py-3 sm:py-4 px-3 sm:px-6 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedFleet.map((car) => (
                    <tr key={car._id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 sm:py-4 px-3 sm:px-6 font-black text-gray-900 text-xs sm:text-lg">{car.make} {car.model} <span className="text-[10px] sm:text-sm font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded ml-1 sm:ml-2">{car.year}</span></td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 font-black text-indigo-600 text-sm sm:text-lg">₹{formatIndian(car.pricePerDay)}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center"><span className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-sm ${car.isAvailable ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{car.isAvailable ? 'Available' : 'Offline'}</span></td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 flex justify-center gap-1 sm:gap-3"><button onClick={() => handleEditClick(car)} className="bg-white text-amber-600 border border-amber-200 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg font-bold hover:bg-amber-50 shadow-sm text-[9px] sm:text-xs transition">Edit</button><button onClick={() => handleDeleteCar(car._id)} className="bg-white text-red-600 border border-red-200 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg font-bold hover:bg-red-50 shadow-sm text-[9px] sm:text-xs transition">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Math.ceil(filteredCars.length / ITEMS_PER_PAGE) > 1 && (
                <div className="border-t border-gray-100 bg-white p-4">
                  <Pagination currentPage={pages.fleet} totalPages={Math.ceil(filteredCars.length / ITEMS_PER_PAGE)} onPageChange={(p) => handlePageChange('fleet', p)} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. AVAILABILITY TAB */}
        {activeTab === 'availability' && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-lg opacity-70">🔍</span>
                <input type="text" placeholder="Search fleet..." value={carSearch} onChange={(e) => setCarSearch(e.target.value)} className="w-full pl-10 p-2.5 border border-gray-300 bg-white rounded-lg focus:border-indigo-500 outline-none transition text-sm text-gray-700"/>
              </div>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="min-w-full bg-white text-left whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Details</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Year</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Current Status</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedCars.map((car) => (
                    <tr key={car._id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 sm:py-5 px-3 sm:px-6 font-black text-gray-900 text-xs sm:text-lg">{car.make} {car.model}</td><td className="py-3 sm:py-5 px-3 sm:px-6 font-bold text-gray-500 text-xs sm:text-base">{car.year}</td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 text-center"><span className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-sm min-w-[100px] sm:min-w-[120px] justify-center ${car.isAvailable ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{car.isAvailable ? 'Available for Rent' : 'In Maintenance'}</span></td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 text-center"><button onClick={() => handleAvailabilityToggle(car._id, car.isAvailable)} className={`w-full sm:w-auto px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-bold shadow-md transition hover:-translate-y-0.5 active:scale-95 ${car.isAvailable ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-teal-500/30'}`}>{car.isAvailable ? 'Mark Offline' : 'Mark Available'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Math.ceil(cars.length / ITEMS_PER_PAGE) > 1 && (
                <div className="border-t border-gray-100 p-4 bg-white">
                  <Pagination currentPage={pages.availability} totalPages={Math.ceil(cars.length / ITEMS_PER_PAGE)} onPageChange={(p) => handlePageChange('availability', p)} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="min-w-full bg-white whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-left">
                  <tr><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Customer & Vehicle</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Finances / Mod Requests</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Workflow Status</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Management Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedActiveBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 sm:py-5 px-3 sm:px-6">
                        <div className="font-black text-gray-900 text-sm sm:text-lg mb-1">{booking.user?.name || 'Deleted User'}</div>
                        <div className="text-[10px] sm:text-sm font-bold text-gray-500 bg-gray-100 inline-block px-2 sm:px-3 py-1 rounded-lg border border-gray-200">{booking.car?.make || 'Deleted Car'} {booking.car?.model}</div>
                      </td>
                      
                      <td className="py-3 sm:py-5 px-3 sm:px-6">
                        <div className="font-black text-lg sm:text-2xl text-indigo-600 mb-1 sm:mb-2">₹{formatIndian(booking.totalCost)}</div>
                        {booking.paymentStatus === 'Pending' ? (
                          <button onClick={async () => { if(window.confirm("Mark as Paid (Cash Collected)?")) { await API.put(`/bookings/${booking._id}/pay`); fetchData(); } }} className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] sm:text-[10px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm hover:bg-amber-100 transition">💰 Collect Cash</button>
                        ) : (<div className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] sm:text-[10px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-black uppercase tracking-wider">✅ PAID SECURELY</div>)}

                        {booking.requestedModification?.status === 'Pending' && (
                          <div className="bg-orange-50/80 border border-orange-200 p-2 sm:p-4 rounded-xl sm:rounded-2xl mt-2 sm:mt-4 shadow-sm max-w-xs w-full">
                            <p className="font-black text-orange-800 mb-1 uppercase tracking-wider text-[9px] sm:text-[10px]">Extension Requested</p>
                            <p className="font-bold text-gray-700 mb-2 sm:mb-3 text-[10px] sm:text-sm">New End Date: {new Date(booking.requestedModification.endDate).toLocaleDateString()}</p>
                            <div className="flex gap-2">
                              <button onClick={async () => { await API.put(`/bookings/${booking._id}/approve-modification`); fetchData(); }} className="w-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-md hover:shadow-teal-500/30 transition active:scale-95 text-[9px] sm:text-xs">Approve</button>
                              <button onClick={async () => { await API.put(`/bookings/${booking._id}/reject-modification`); fetchData(); }} className="w-1/2 bg-white text-red-500 border border-red-200 font-bold py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-sm hover:bg-red-50 transition active:scale-95 text-[9px] sm:text-xs">Reject</button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 sm:py-5 px-3 sm:px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-sm ${booking.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : booking.status === 'Approved' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{booking.status}</span>
                      </td>
                      
                      <td className="py-3 sm:py-5 px-3 sm:px-6 text-center">
                        <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                          {booking.status === 'Pending' && (<div className="flex flex-col gap-1 sm:gap-2 w-full max-w-[150px] mx-auto"><button onClick={() => handleStatusUpdate(booking._id, 'Approved')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-xs shadow-md hover:shadow-indigo-500/30 transition hover:-translate-y-0.5">Approve Rental</button><button onClick={() => handleStatusUpdate(booking._id, 'Rejected')} className="w-full bg-white text-red-500 border border-red-200 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-xs hover:bg-red-50 transition">Reject Request</button></div>)}
                          {booking.status === 'Approved' && (<button onClick={() => handleStatusUpdate(booking._id, 'Picked')} className="w-full max-w-[150px] mx-auto bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-xs shadow-md hover:shadow-purple-500/30 transition hover:-translate-y-0.5">Handover Keys</button>)}
                          {booking.status === 'Picked' && (<button onClick={() => handleStatusUpdate(booking._id, 'Returned')} className="w-full max-w-[150px] mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-xs shadow-md hover:shadow-teal-500/30 transition hover:-translate-y-0.5">Mark Returned</button>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Math.ceil(activeBookings.length / ITEMS_PER_PAGE) > 1 && (
                <div className="border-t border-gray-100 p-4 bg-white">
                  <Pagination currentPage={pages.bookings} totalPages={Math.ceil(activeBookings.length / ITEMS_PER_PAGE)} onPageChange={(p) => handlePageChange('bookings', p)} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="p-5 sm:p-8 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-gray-800">Historical Ledger</h2>
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1 uppercase tracking-wide">A permanent record of finalized bookings.</p>
              </div>
              <button onClick={generateRecordsPDF} className="mt-3 md:mt-0 w-full md:w-auto bg-slate-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold shadow-lg shadow-slate-500/30 hover:bg-slate-900 transition hover:-translate-y-0.5 text-xs sm:text-base">📥 View Ledger</button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="min-w-full bg-white text-left whitespace-nowrap">
                <thead className="bg-white border-b border-gray-100">
                  <tr><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction ID</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Final Cost</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Payment</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Outcome</th><th className="py-3 sm:py-5 px-3 sm:px-6 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedHistorical.map((record) => (
                    <tr key={record._id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 sm:py-5 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-400">{record._id.substring(0, 8).toUpperCase()}</td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 font-black text-gray-900 text-xs sm:text-base">{record.user?.name || 'Deleted User'}</td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 font-bold text-gray-600 text-[10px] sm:text-sm">{record.car?.make || 'Deleted Car'} {record.car?.model}</td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 font-black text-indigo-600 text-sm sm:text-lg">₹{formatIndian(record.totalCost)}</td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-sm ${record.paymentStatus === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : record.paymentStatus === 'Refunded' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                          {record.paymentStatus || 'Paid'}
                        </span>
                      </td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6"><span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-sm ${record.status === 'Returned' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-500 border-red-200'}`}>{record.status}</span></td>
                      <td className="py-3 sm:py-5 px-3 sm:px-6 text-center">
                        <button onClick={() => downloadReceipt(record)} className="w-full sm:w-auto bg-white text-indigo-600 border border-indigo-200 px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition text-[9px] sm:text-xs active:scale-95">👁️ View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Math.ceil(historicalRecords.length / ITEMS_PER_PAGE) > 1 && (
                <div className="border-t border-gray-100 p-4 bg-white">
                  <Pagination currentPage={pages.records} totalPages={Math.ceil(historicalRecords.length / ITEMS_PER_PAGE)} onPageChange={(p) => handlePageChange('records', p)} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
