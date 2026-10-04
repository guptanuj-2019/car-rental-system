import { useEffect, useState } from 'react';
import API from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import formatIndian from '../utils/formatNumber';
import Pagination from '../components/Pagination'; 

const StaffPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [activeTab, setActiveTab] = useState('reports'); 
  const [carSearch, setCarSearch] = useState('');

  const [pages, setPages] = useState({
    active: 1, all: 1, availability: 1
  });
  const ITEMS_PER_PAGE = 8; 

  useEffect(() => { setPages(prev => ({ ...prev, availability: 1 })); }, [carSearch]);

  const fetchData = async () => {
    try {
      const bookingsRes = await API.get('/bookings'); setBookings(bookingsRes.data.reverse()); 
      const carsRes = await API.get('/cars/all'); setCars(carsRes.data.reverse());
    } catch (error) { // alert('Backend Error: ' + (error.response?.data?.message || error.message)); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePageChange = (tab, newPage) => {
    setPages(prev => ({ ...prev, [tab]: newPage }));
  };

  const handleStatusUpdate = async (id, newStatus) => { try { await API.put(`/bookings/${id}/status`, { status: newStatus }); fetchData(); } catch (error) { // alert('Failed to update status'); } };
  const handleAvailabilityToggle = async (id, currentStatus) => { try { await API.put(`/cars/${id}`, { isAvailable: !currentStatus }); fetchData(); } catch (error) { // alert('Failed to update car availability'); } };

  const getStatusBadge = (status) => {
    const base = "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border inline-block min-w-[100px] text-center ";
    switch (status) {
      case 'Returned': return <span className={base + "bg-emerald-50 text-emerald-600 border-emerald-200"}>Returned</span>;
      case 'Rejected': case 'Cancelled': return <span className={base + "bg-red-50 text-red-600 border-red-200"}>{status}</span>;
      case 'Pending': return <span className={base + "bg-amber-50 text-amber-600 border-amber-200"}>Pending</span>;
      case 'Approved': case 'Picked': return <span className={base + "bg-blue-50 text-blue-600 border-blue-200"}>{status}</span>;
      default: return <span className={base + "bg-gray-50 text-gray-600 border-gray-200"}>{status}</span>;
    }
  };

  const activeBookings = bookings.filter(b => ['Pending', 'Approved', 'Picked'].includes(b.status));

  const filteredCars = cars.filter(car => {
    const search = carSearch.toLowerCase();
    return (car.make.toLowerCase().includes(search) || car.model.toLowerCase().includes(search) || car.year.toString().includes(search) || (car.pricePerDay && car.pricePerDay.toString().includes(search)) || (car.isAvailable ? 'available' : 'offline').includes(search));
  });

  const downloadReceipt = (booking) => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(30, 58, 138); doc.text("CarRentals - Official Payment Receipt", 14, 20); doc.setFontSize(11); doc.setTextColor(100); doc.text(`Receipt No: ${booking._id.substring(0, 10).toUpperCase()}`, 14, 30); doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    autoTable(doc, { startY: 45, head: [['Description', 'Details']], body: [['Customer Name', booking.user?.name || 'Deleted User'], ['Vehicle Rented', `${booking.car?.make || 'Unknown'} ${booking.car?.model || ''}`], ['Rental Duration', `${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}`], ['Status', booking.status.toUpperCase()], ['Total Amount', `Rs. ${formatIndian(booking.totalCost)}`]], theme: 'grid', headStyles: { fillColor: [30, 58, 138] } });
    doc.setFontSize(14); doc.setTextColor(21, 128, 61); doc.text(`Transaction Status: ${['Cancelled', 'Rejected'].includes(booking.status) ? 'REFUNDED/VOID' : 'SUCCESSFUL'}`, 14, doc.lastAutoTable.finalY + 15); 
    // NO AUTO-DOWNLOAD: Open natively in a new browser tab instead
    window.open(doc.output('bloburl'), '_blank');
  };

  const paginate = (dataArray, page) => dataArray.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const paginatedActive = paginate(activeBookings, pages.active);
  const paginatedAll = paginate(bookings, pages.all);
  const paginatedCars = paginate(filteredCars, pages.availability);

  return (
    <div className="bg-slate-50 min-h-screen p-6 md:p-10 font-sans pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-2 tracking-tight">Rental Staff Dashboard</h1>
            <p className="text-gray-500 font-bold tracking-wide uppercase text-sm">Operational Management Console</p>
          </div>
          <div className="mt-6 md:mt-0 w-full md:w-auto overflow-x-auto pb-2 scrollbar-hide">
            <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-200 inline-flex whitespace-nowrap">
              {['reports', 'active-bookings', 'all-bookings', 'availability'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 capitalize ${activeTab === tab ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 transform scale-105' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-amber-400 to-orange-600 text-white p-8 rounded-3xl shadow-xl shadow-orange-500/20 relative overflow-hidden transform transition hover:-translate-y-1">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">Pending Approvals</h2><p className="text-5xl font-black">{bookings.filter(b => b.status === 'Pending').length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-fuchsia-700 text-white p-8 rounded-3xl shadow-xl shadow-purple-500/20 relative overflow-hidden transform transition hover:-translate-y-1">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">Cars Currently Out</h2><p className="text-5xl font-black">{bookings.filter(b => b.status === 'Picked').length}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-8 rounded-3xl shadow-xl shadow-teal-500/20 relative overflow-hidden transform transition hover:-translate-y-1">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">Completed Rentals</h2><p className="text-5xl font-black">{bookings.filter(b => b.status === 'Returned').length}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-500/20 relative overflow-hidden transform transition hover:-translate-y-1">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">Cars Offline/Maint</h2><p className="text-5xl font-black">{cars.filter(c => !c.isAvailable).length}</p>
            </div>
          </div>
        )}

        {activeTab === 'active-bookings' && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr><th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th><th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th><th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th><th className="py-5 px-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Workflow Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedActive.map((booking) => (
                    <tr key={booking._id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-5 px-6 font-black text-gray-900 text-lg">{booking.user?.name}</td>
                      <td className="py-5 px-6 font-bold text-gray-600 bg-gray-50 rounded-lg p-2 inline-block mt-3">{booking.car?.make} {booking.car?.model}</td>
                      <td className="py-5 px-6 text-center">{getStatusBadge(booking.status)}</td>
                      
                      <td className="py-5 px-6">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="space-x-3">
                            {booking.status === 'Pending' && (<><button onClick={() => handleStatusUpdate(booking._id, 'Approved')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl font-bold shadow-md hover:shadow-indigo-500/30 transition active:scale-95 text-xs">Approve</button><button onClick={() => handleStatusUpdate(booking._id, 'Rejected')} className="bg-white text-red-500 border border-red-200 px-5 py-2 rounded-xl font-bold shadow-sm hover:bg-red-50 transition active:scale-95 text-xs">Reject</button></>)}
                            {booking.status === 'Approved' && (<button onClick={() => handleStatusUpdate(booking._id, 'Picked')} className="bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white px-5 py-2 rounded-xl font-bold shadow-md hover:shadow-purple-500/30 transition active:scale-95 text-xs">Handover Keys (Pick)</button>)}
                            {booking.status === 'Picked' && (<button onClick={() => handleStatusUpdate(booking._id, 'Returned')} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2 rounded-xl font-bold shadow-md hover:shadow-teal-500/30 transition active:scale-95 text-xs">Mark Vehicle Returned</button>)}
                          </div>

                          {booking.requestedModification?.status === 'Pending' && (
                            <div className="bg-orange-50/80 border border-orange-200 p-4 rounded-2xl w-full text-center shadow-sm">
                              <p className="font-black text-orange-800 mb-1 uppercase tracking-wider text-[10px]">Extension Requested</p>
                              <p className="text-gray-700 font-bold mb-3 text-sm">New End: {new Date(booking.requestedModification.endDate).toLocaleDateString()}</p>
                              <div className="flex space-x-2 justify-center">
                                <button onClick={async () => { await API.put(`/bookings/${booking._id}/approve-modification`); fetchData(); }} className="w-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-2 rounded-xl shadow-md transition active:scale-95 text-xs">Approve</button>
                                <button onClick={async () => { await API.put(`/bookings/${booking._id}/reject-modification`); fetchData(); }} className="w-1/2 bg-white text-red-500 border border-red-200 font-bold py-2 rounded-xl shadow-sm transition active:scale-95 text-xs">Reject</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Math.ceil(activeBookings.length / ITEMS_PER_PAGE) > 1 && (
                <div className="border-t border-gray-100 bg-white">
                  <Pagination currentPage={pages.active} totalPages={Math.ceil(activeBookings.length / ITEMS_PER_PAGE)} onPageChange={(p) => handlePageChange('active', p)} />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'all-bookings' && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr><th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th><th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th><th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Outcome Status</th><th className="py-5 px-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedAll.map((booking) => (
                    <tr key={booking._id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-5 px-6 font-black text-gray-900 text-lg">{booking.user?.name}</td><td className="py-5 px-6 font-bold text-gray-500">{booking.car?.make} {booking.car?.model}</td><td className="py-5 px-6 text-center">{getStatusBadge(booking.status)}</td>
                      <td className="py-5 px-6 text-center"><button onClick={() => downloadReceipt(booking)} className="bg-white text-indigo-600 border border-indigo-200 px-5 py-2 rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition active:scale-95 text-xs">👁️ View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Math.ceil(bookings.length / ITEMS_PER_PAGE) > 1 && (
                <div className="border-t border-gray-100 bg-white">
                  <Pagination currentPage={pages.all} totalPages={Math.ceil(bookings.length / ITEMS_PER_PAGE)} onPageChange={(p) => handlePageChange('all', p)} />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100">
              <div className="relative">
                <span className="absolute left-5 top-4 text-xl">🔍</span>
                <input type="text" placeholder="Search fleet by Brand, Model, Year, or Status..." value={carSearch} onChange={(e) => setCarSearch(e.target.value)} className="w-full p-4 pl-14 border-2 border-gray-100 bg-white rounded-2xl focus:border-indigo-500 outline-none transition font-bold text-gray-700 shadow-sm"/>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-white border-b border-gray-100">
                  <tr><th className="py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th><th className="py-5 px-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Current Status</th><th className="py-5 px-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Management Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedCars.map((car) => (
                    <tr key={car._id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-5 px-6 font-black text-gray-900 text-lg">{car.make} {car.model} <span className="text-sm font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded ml-2">{car.year}</span></td>
                      <td className="py-5 px-6 text-center"><span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${car.isAvailable ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}`}>{car.isAvailable ? 'AVAILABLE FOR RENT' : 'OFFLINE'}</span></td>
                      <td className="py-5 px-6 text-center"><button onClick={() => handleAvailabilityToggle(car._id, car.isAvailable)} className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95 ${car.isAvailable ? 'bg-white border border-red-200 text-red-500 hover:bg-red-50' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-teal-500/30'}`}>{car.isAvailable ? 'Mark Unavailable' : 'Mark Available'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Math.ceil(filteredCars.length / ITEMS_PER_PAGE) > 1 && (
                <div className="border-t border-gray-100 bg-white">
                  <Pagination currentPage={pages.availability} totalPages={Math.ceil(filteredCars.length / ITEMS_PER_PAGE)} onPageChange={(p) => handlePageChange('availability', p)} />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffPanel;

