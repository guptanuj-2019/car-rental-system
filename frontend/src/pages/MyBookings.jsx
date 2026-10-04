import { useEffect, useState } from 'react';
import API from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from '../components/Pagination'; 
import formatIndian from '../utils/formatNumber';

const MyBookings = () => {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modifyingBooking, setModifyingBooking] = useState(null);
  const [newEndDate, setNewEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchMyBookings = async () => {
    try {
      const { data } = await API.get('/bookings/mybookings');
      setMyBookings(data.reverse()); 
    } catch (error) { console.error('Failed to fetch history:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMyBookings(); }, []);

  const handleCancelBooking = async (id) => {
    if (window.confirm("Cancel this booking? Payment will be refunded.")) {
      try { await API.put(`/bookings/${id}/cancel`); fetchMyBookings(); } 
      catch (error) { console.error('Failed to cancel booking:', error); }
    }
  };

  const handlePayBalance = async (id) => {
    if (window.confirm("Complete your pending payment via online gateway?")) {
      try {
        await API.put(`/bookings/${id}/pay`);
        // alert("Payment Successful!");
        fetchMyBookings();
      } catch (error) { console.error('Failed to complete payment:', error); }
    }
  };

  const handleRequestExtension = async (e) => {
    e.preventDefault();
    const start = new Date(modifyingBooking.startDate);
    const end = new Date(newEndDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); 
    const newTotal = diffDays * modifyingBooking.car.pricePerDay;

    try {
      await API.put(`/bookings/${modifyingBooking._id}/request-modification`, {
        startDate: modifyingBooking.startDate,
        endDate: newEndDate,
        newTotalCost: newTotal
      });
      // alert("Modification requested! Waiting for staff approval.");
      setModifyingBooking(null);
      fetchMyBookings();
    } catch (error) { console.error('Failed to request booking modification:', error); }
  };

  const downloadReceipt = (booking) => {
    const doc = new jsPDF();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    doc.setFontSize(22); doc.setTextColor(30, 58, 138); doc.text("CarRentals - Official Receipt", 14, 20);
    doc.setFontSize(11); doc.setTextColor(100); 
    doc.text(`Receipt No: ${booking._id.substring(0, 10).toUpperCase()}`, 14, 30);
    
    autoTable(doc, {
      startY: 40, head: [['Description', 'Details']],
      body: [
        ['Customer Name', userInfo?.name],
        ['Vehicle Rented', `${booking.car?.make} ${booking.car?.model}`],
        ['Rental Duration', `${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}`],
        ['Booking Status', booking.status.toUpperCase()],
        ['Payment Method', booking.paymentMethod ? booking.paymentMethod.toUpperCase() : 'N/A'],
        ['Payment Status', booking.paymentStatus.toUpperCase()],
        ['Total Amount', `Rs. ${formatIndian(booking.totalCost)}`],
      ], theme: 'grid', headStyles: { fillColor: [30, 58, 138] }
    });

    doc.setFontSize(14);
    if (booking.paymentStatus === 'Pending' && !['Cancelled', 'Rejected'].includes(booking.status)) {
      doc.setTextColor(202, 138, 4); 
      doc.text("Transaction Status: PENDING (Balance Due)", 14, doc.lastAutoTable.finalY + 15);
    } else {
      doc.setTextColor(21, 128, 61); 
      doc.text(`Transaction Status: ${['Cancelled', 'Rejected'].includes(booking.status) ? 'REFUNDED/VOID' : 'SUCCESSFUL'}`, 14, doc.lastAutoTable.finalY + 15);
    }
    
    window.open(doc.output('bloburl'), '_blank');
  };

  const totalPages = Math.ceil(myBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = myBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-indigo-500 text-2xl animate-pulse">Loading your journeys...</div>;

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 md:p-10 font-sans pb-20">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-2 tracking-tight">
            My Rental History
          </h1>
          <p className="text-gray-500 font-bold tracking-wide uppercase text-xs sm:text-sm">Review and manage your past and upcoming journeys.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr><th className="py-5 px-4 sm:px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th><th className="py-5 px-4 sm:px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Duration & Mods</th><th className="py-5 px-4 sm:px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Financials</th><th className="py-5 px-4 sm:px-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th><th className="py-5 px-4 sm:px-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBookings.map((b) => {
                  let modStatus = b.requestedModification?.status;
                  if (modStatus === 'Pending' && ['Returned', 'Cancelled', 'Rejected'].includes(b.status)) modStatus = 'Rejected'; 

                  return (
                    <tr key={b._id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-5 px-4 sm:px-6">
                        <div className="font-black text-gray-900 text-base sm:text-lg">{b.car?.make} {b.car?.model}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID: {b._id.substring(0,8)}</div>
                      </td>
                      <td className="py-5 px-4 sm:px-6">
                        <div className="text-xs sm:text-sm font-bold text-gray-600 bg-gray-50 inline-block px-3 py-1.5 rounded-lg border border-gray-200">
                          {new Date(b.startDate).toLocaleDateString()} ➔ {new Date(b.endDate).toLocaleDateString()}
                        </div>
                        {modStatus === 'Pending' && <span className="block text-[11px] font-black mt-2 text-amber-500 uppercase tracking-wider">🕒 Mod Pending</span>}
                        {modStatus === 'Approved' && <span className="block text-[11px] font-black mt-2 text-emerald-500 uppercase tracking-wider">✅ Mod Approved</span>}
                        {modStatus === 'Rejected' && <span className="block text-[11px] font-black mt-2 text-red-500 uppercase tracking-wider">❌ Mod Rejected</span>}
                      </td>
                      <td className="py-5 px-4 sm:px-6">
                        <div className="font-black text-lg sm:text-xl text-indigo-600 mb-1">₹{formatIndian(b.totalCost)}</div>
                        {b.paymentStatus === 'Pending' && !['Cancelled', 'Rejected'].includes(b.status) ? (
                          <button onClick={() => handlePayBalance(b._id)} className="text-[10px] bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-200 font-bold shadow-sm hover:bg-amber-100 uppercase tracking-wider">Pay Balance</button>
                        ) : b.paymentStatus === 'Refunded' ? (
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">Refunded</span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Paid Online</span>
                        )}
                      </td>
                      <td className="py-5 px-4 sm:px-6 text-center">
                         <span className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm border inline-block min-w-[90px] sm:min-w-[100px] ${b.status === 'Returned' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : b.status === 'Cancelled' || b.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' : b.status === 'Picked' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-5 px-4 sm:px-6 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <button 
                            onClick={() => downloadReceipt(b)} 
                            className="w-24 bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 transition flex items-center justify-center gap-1.5"
                          >
                            👁️ View
                          </button>
                          
                          {['Pending', 'Approved', 'Picked'].includes(b.status) && b.requestedModification?.status !== 'Pending' && (
                            <button onClick={() => setModifyingBooking(b)} className="w-24 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:shadow-indigo-500/30 transition">Modify Trip</button>
                          )}
                          {b.status === 'Pending' && (
                            <button onClick={() => handleCancelBooking(b._id)} className="w-24 bg-white text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 shadow-sm hover:bg-red-50 transition">Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="border-t border-gray-100 bg-white">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </div>
        </div>
      </div>

      {modifyingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl relative border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">Adjust Timeline</h2>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mb-6">Select a new return date for your {modifyingBooking.car?.make}. Staff must approve this extension.</p>
            <form onSubmit={handleRequestExtension}>
              <label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Return Date</label>
              <input type="date" required min={modifyingBooking.startDate.split('T')[0]} value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-8 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-bold transition"/>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" className="w-full sm:w-2/3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/40 transition hover:-translate-y-0.5 active:scale-95">Submit Request</button>
                <button type="button" onClick={() => setModifyingBooking(null)} className="w-full sm:w-1/3 bg-red-500 text-white p-3 rounded-xl font-bold hover:bg-red-600 shadow-md transition active:scale-95">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
