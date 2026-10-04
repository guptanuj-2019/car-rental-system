import { useEffect, useState } from 'react';
import API from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import formatIndian from '../utils/formatNumber';
import Pagination from '../components/Pagination'; 

import heroBg from '../assets/hero-bg.jpg';
import fallbackCarImg from '../assets/hero-bg2.jpg';

const CustomerPanel = () => {
  const [cars, setCars] = useState([]);
  const [carSearch, setCarSearch] = useState('');
  const [selectedCar, setSelectedCar] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  const [dateError, setDateError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [cardMobileNumber, setCardMobileNumber] = useState('');
  const [cardOtp, setCardOtp] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [netBankingPassword, setNetBankingPassword] = useState('');
  const [netBankingOtp, setNetBankingOtp] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => { setCurrentPage(1); }, [carSearch]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const { data } = await API.get('/cars');
        setCars(data);
      } catch (err) { console.error('Failed to fetch cars'); }
    };
    fetchCars();
  }, []);

  useEffect(() => {
    if (selectedCar) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [selectedCar]);

  
  useEffect(() => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0,0,0,0); end.setHours(0,0,0,0);

    let hasOverlap = false;
    for (let booking of bookedDates) {
      const bStart = new Date(booking.startDate);
      const bEnd = new Date(booking.endDate);
      bStart.setHours(0,0,0,0); bEnd.setHours(0,0,0,0);
      if (start <= bEnd && end >= bStart) { hasOverlap = true; break; }
    }

    if (hasOverlap) setDateError("Dates Unavailable: This vehicle is already booked during this time.");
    else if (end < start) setDateError("Invalid Dates: Return date must be on or after the pick-up date.");
    else setDateError('');
  }, [startDate, endDate, bookedDates]);

  const handleOpenModal = async (car) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) return alert("Please log in to book a car.");

    setSelectedCar(car);
    setPaymentMethod('cash');
    setCardHolderName(''); setCardNumber(''); setExpiry(''); setCvv(''); setCardPin(''); setCardMobileNumber(''); setCardOtp('');
    setUpiId(''); setBank(''); setAccountName(''); setAccountNumber(''); setMobileNumber(''); setNetBankingPassword(''); setNetBankingOtp('');
    setDateError(''); setBookedDates([]);
    
    const today = new Date().toISOString().split('T')[0];
    let tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    
    setStartDate(today);
    setEndDate(tomorrow.toISOString().split('T')[0]);

    try {
      const { data } = await API.get(`/bookings/car/${car._id}`);
      setBookedDates(data);
    } catch (err) { console.error("Could not fetch booked dates"); }
  };

  const calculateTotal = () => {
    if (!startDate || !endDate || !selectedCar || dateError) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays * selectedCar.pricePerDay : selectedCar.pricePerDay;
  };

  const generateReceipt = async (bookingId, totalAmount) => {
    const doc = new jsPDF();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    doc.setFontSize(22); doc.setTextColor(30, 58, 138); doc.text("CarRentals - Official Payment Receipt", 14, 20);
    doc.setFontSize(11); doc.setTextColor(100); doc.text(`Receipt No: ${bookingId.substring(0, 10).toUpperCase()}`, 14, 30); doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);

    autoTable(doc, {
      startY: 45, head: [['Description', 'Details']],
      body: [
        ['Customer Name', userInfo?.name || 'Guest'],
        ['Vehicle Rented', `${selectedCar.make} ${selectedCar.model} (${selectedCar.year})`],
        ['Rental Duration', `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`],
        ['Booking Status', 'PENDING (Awaiting Staff Approval)'],
        ['Payment Method', paymentMethod.toUpperCase()],
        ['Payment Status', paymentMethod === 'cash' ? 'PENDING' : 'PAID'],
        ['Total Amount', `Rs. ${formatIndian(totalAmount)}`],
      ], theme: 'grid', headStyles: { fillColor: [30, 58, 138] }
    });

    doc.setFontSize(14);
    if (paymentMethod === 'cash') {
      doc.setTextColor(202, 138, 4); doc.setFont("helvetica", "bold"); doc.text("Transaction Status: PENDING (CASH ON PICKUP)", 14, doc.lastAutoTable.finalY + 15);
    } else {
      doc.setTextColor(21, 128, 61); doc.setFont("helvetica", "bold"); doc.text("Transaction Status: SUCCESSFUL", 14, doc.lastAutoTable.finalY + 15);
    }

    try {
      const pdfBase64 = doc.output('datauristring');
      const response = await API.post('/upload/receipt', {
        pdfData: pdfBase64,
        bookingId: bookingId
      });
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error("Cloudinary upload failed", error);
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (dateError) return alert(dateError); 
    const total = calculateTotal();

    if (paymentMethod === 'card') {
      if (!cardHolderName) return alert("Please enter the Account Holder Name.");
      if (cardNumber.replace(/\s/g, '').length !== 16) return alert("Valid 16-digit card required.");
      if (cvv.length !== 3) return alert("Valid 3-digit CVV required.");
      if (!cardPin || cardPin.length < 4) return alert("Valid 4-digit Card PIN required."); 
      if (cardMobileNumber.length !== 10) return alert("Please enter a valid 10-digit mobile number.");
      if (!cardOtp) return alert("Please enter the OTP.");
    } else if (paymentMethod === 'upi' && !upiId.includes('@')) { return alert("Valid UPI ID required (e.g., name@bank).");
    } else if (paymentMethod === 'netbanking') {
      if (!bank || !accountName || !accountNumber || !mobileNumber || !netBankingPassword || !netBankingOtp) return alert("Please fill in all Net Banking details including OTP.");
      if (mobileNumber.length !== 10) return alert("Please enter a valid 10-digit mobile number.");
    }

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { data } = await API.post('/bookings', {
        carId: selectedCar._id, startDate, endDate, totalCost: total,
        paymentMethod: paymentMethod, paymentStatus: paymentMethod === 'cash' ? 'Pending' : 'Paid' 
      });
      await generateReceipt(data._id, total); 
      setSelectedCar(null); 
    } catch (error) { alert(`Booking failed: ${error.response?.data?.message || error.message}`);
    } finally { setIsProcessing(false); }
  };

  const sendMockOTP = () => { alert("An OTP (123456) has been sent."); };

  const filteredCars = cars.filter(car => {
    const search = carSearch.toLowerCase();
    return ( car.make.toLowerCase().includes(search) || car.model.toLowerCase().includes(search) || car.year.toString().includes(search) || (car.pricePerDay && car.pricePerDay.toString().includes(search)) || (car.isAvailable ? 'available' : 'offline').includes(search));
  });

  const totalPages = Math.ceil(filteredCars.length / ITEMS_PER_PAGE);
  const paginatedCars = filteredCars.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="bg-slate-50 min-h-screen pb-12 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-700/30 rounded-full mix-blend-multiply blur-[100px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply blur-[100px]"></div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[350px] md:h-[450px] flex items-center justify-center mb-10 overflow-hidden rounded-b-[3rem] shadow-2xl mx-2 md:mx-4 mt-2">
        <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.7)' }} />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-indigo-900/80 to-slate-900/95"></div>

        <div className="text-center px-6 z-20 flex flex-col items-center">
          <div className="flex items-center gap-2 bg-white/10 px-5 py-2 rounded-full text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md border border-white/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Premium Fleet
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-indigo-400 mb-4 drop-shadow-2xl tracking-tighter leading-tight">
            Drive Your Dreams.
          </h1>
          <p className="text-sm md:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed px-4">
            Experience next-level luxury, absolute affordability, and instant digital booking. 
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative -mt-28 z-30 mb-20">
        <div className="max-w-4xl mx-auto p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-[0_20px_50px_rgba(79,_70,_229,_0.3)] transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(79,_70,_229,_0.4)]">
          <div className="bg-white/95 backdrop-blur-2xl p-2 rounded-full flex items-center">
            <span className="text-2xl sm:text-3xl mr-2 sm:mr-4 ml-4 sm:ml-6">✨</span>
            <input 
              type="text" 
              placeholder="Search for your next vehicle..." 
              value={carSearch} 
              onChange={(e) => setCarSearch(e.target.value)} 
              className="w-full p-3 sm:p-4 bg-transparent outline-none text-base sm:text-xl font-bold text-gray-800 placeholder-gray-400" 
            />
            <button className="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold uppercase tracking-widest text-xs sm:text-sm hover:bg-indigo-600 transition-colors shadow-md hidden sm:block">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Car Grid */}
      <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginatedCars.map((car) => (
          <div key={car._id} className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-700/10 hover:-translate-y-1 transition-all flex flex-col overflow-hidden group">
            <div className="h-56 overflow-hidden relative bg-slate-100">
              <img 
                src={`https://source.unsplash.com/800x600/?${car.make},car`} alt={`${car.make} ${car.model}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                onError={(e) => { e.target.onerror = null; e.target.src = fallbackCarImg; }} 
              />
              <div className="absolute top-4 left-4 z-20">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-xl flex items-center gap-1.5 ${car.isAvailable ? 'bg-white/90 text-slate-900' : 'bg-red-500/90 text-white'}`}>
                  {car.isAvailable ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available</> : '❌ Rented'}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{car.make} {car.model}</h2>
              </div>
              <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-wider mb-6">🗓️ {car.year} Model</span>
              
              <div className="pt-5 border-t border-slate-100 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Daily Rate</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-900">₹{formatIndian(car.pricePerDay)}</span>
                </div>
                
                {car.isAvailable ? (
                  <button 
                    onClick={() => handleOpenModal(car)} 
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-95 transition-transform"
                  >
                    Reserve
                  </button>
                ) : (
                  <button disabled className="bg-slate-200 text-slate-400 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-not-allowed border border-slate-300">
                    Reserved
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="container mx-auto px-4 mt-12">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* FULL SCREEN CHECKOUT MODAL */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="min-h-screen flex flex-col relative w-full">
            
            <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white hover:text-red-400 font-black text-2xl sm:text-3xl bg-black/20 hover:bg-black/40 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all z-20 backdrop-blur-md">✕</button>
            
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-6 py-12 sm:px-12 sm:py-20 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="max-w-5xl mx-auto relative z-10">
                <h2 className="text-4xl sm:text-6xl font-black mb-2 sm:mb-4">Secure Checkout</h2>
                <p className="text-indigo-200 font-bold text-lg sm:text-2xl">{selectedCar.make} {selectedCar.model} • ₹{formatIndian(selectedCar.pricePerDay)} / day</p>
              </div>
            </div>
            
            <div className="flex-grow px-6 py-10 sm:px-12 sm:py-16 w-full max-w-5xl mx-auto">
              {bookedDates.length > 0 && (
                <div className="bg-red-50 border border-red-100 p-4 sm:p-6 rounded-2xl mb-8 sm:mb-10 shadow-sm">
                  <p className="text-sm sm:text-base font-black text-red-600 mb-2 uppercase tracking-widest flex items-center gap-2"><span className="text-xl">⚠️</span> Unavailable Dates</p>
                  <ul className="text-sm sm:text-base text-red-800 font-bold list-disc pl-6 space-y-1">
                    {bookedDates.map((b, i) => <li key={i}>{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</li>)}
                  </ul>
                </div>
              )}

              <form onSubmit={handleConfirmBooking} className="space-y-6 sm:space-y-8">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pick-up Date</label>
                    <input type="date" required min={new Date().toISOString().split('T')[0]} value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isProcessing} className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-slate-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm sm:text-lg text-slate-900 font-bold"/>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Return Date</label>
                    <input type="date" required min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isProcessing} className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-slate-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm sm:text-lg text-slate-900 font-bold"/>
                  </div>
                </div>

                {dateError && <div className="bg-red-500 text-white p-4 sm:p-5 rounded-2xl text-sm sm:text-base font-bold text-center shadow-lg">{dateError}</div>}

                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Secure Payment Method</h3>
                  <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-2 bg-slate-100 p-2 rounded-2xl">
                    {['cash', 'card', 'upi', 'netbanking'].map(method => (
                      <button key={method} type="button" disabled={isProcessing} onClick={() => setPaymentMethod(method)} className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${paymentMethod === method ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{method.replace('netbanking', 'Net Banking')}</button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {paymentMethod === 'card' && (
                      <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                        <input type="text" placeholder="Cardholder Name" required disabled={isProcessing} value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-slate-700"/>
                        <input type="text" placeholder="Card Number (16 digits)" maxLength="16" required disabled={isProcessing} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-slate-700"/>
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                          <input type="text" placeholder="MM/YY" maxLength="5" required disabled={isProcessing} value={expiry} onChange={(e) => setExpiry(e.target.value)} className="px-2 py-4 sm:py-5 text-xs sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-center"/>
                          <input type="password" placeholder="CVV" maxLength="3" required disabled={isProcessing} value={cvv} onChange={(e) => setCvv(e.target.value)} className="px-2 py-4 sm:py-5 text-xs sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-center"/>
                          <input type="password" placeholder="PIN" maxLength="4" required disabled={isProcessing} value={cardPin} onChange={(e) => setCardPin(e.target.value)} className="px-2 py-4 sm:py-5 text-xs sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-center"/>
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                          <input type="text" placeholder="Mobile" maxLength="10" required disabled={isProcessing} value={cardMobileNumber} onChange={(e) => setCardMobileNumber(e.target.value)} className="col-span-2 px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-slate-700"/>
                          <button type="button" onClick={sendMockOTP} className="col-span-1 bg-slate-900 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition active:scale-95">Get OTP</button>
                        </div>
                        <input type="text" placeholder="Enter OTP" maxLength="6" required disabled={isProcessing} value={cardOtp} onChange={(e) => setCardOtp(e.target.value)} className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-center text-indigo-600 tracking-[0.3em]"/>
                      </div>
                    )}

                    {paymentMethod === 'upi' && (
                      <div className="flex flex-col items-center bg-slate-50 p-8 sm:p-12 rounded-2xl border border-slate-200">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=carrentals@bank&am=${calculateTotal()}`} alt="UPI QR" className="w-40 h-40 sm:w-48 sm:h-48 mb-6 rounded-xl shadow-md border-4 border-white" />
                        <p className="text-xs sm:text-sm font-black text-slate-500 mb-6 uppercase tracking-widest">Scan to verify ₹{formatIndian(calculateTotal())}</p>
                        <input type="text" placeholder="Or enter VPA (name@bank)" required disabled={isProcessing} value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-center"/>
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                        <input type="text" placeholder="Select Bank Name" required disabled={isProcessing} value={bank} onChange={(e) => setBank(e.target.value)} className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-slate-700"/>
                        <input type="text" placeholder="Account Holder" required disabled={isProcessing} value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-slate-700"/>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <input type="text" placeholder="Account No." required disabled={isProcessing} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-slate-700"/>
                          <input type="password" placeholder="Password" required disabled={isProcessing} value={netBankingPassword} onChange={(e) => setNetBankingPassword(e.target.value)} className="px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-slate-700"/>
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                          <input type="text" placeholder="Mobile" maxLength="10" required disabled={isProcessing} value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="col-span-2 px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-slate-700"/>
                          <button type="button" onClick={sendMockOTP} className="col-span-1 bg-slate-900 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition active:scale-95">Get OTP</button>
                        </div>
                        <input type="text" placeholder="OTP" maxLength="6" required disabled={isProcessing} value={netBankingOtp} onChange={(e) => setNetBankingOtp(e.target.value)} className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base border border-gray-200 focus:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-center text-indigo-600 tracking-[0.3em]"/>
                      </div>
                    )}
                    
                    {paymentMethod === 'cash' && (
                      <div className="bg-amber-50 border border-amber-200 p-8 sm:p-12 rounded-2xl text-center">
                        <div className="text-6xl sm:text-8xl mb-4">💵</div>
                        <p className="text-amber-800 font-black uppercase tracking-widest text-sm sm:text-base mb-2">Pay at Counter</p>
                        <p className="text-amber-900 font-bold text-sm sm:text-lg">Your booking will remain in a "Pending" state until you physically provide ₹{formatIndian(calculateTotal())} at the time of vehicle pickup.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl flex justify-between items-center shadow-lg mt-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Final Authorization</span>
                    <span className="text-white font-bold text-sm sm:text-lg">Including all taxes</span>
                  </div>
                  <div className={`text-4xl sm:text-5xl font-black truncate tracking-tighter ${paymentMethod === 'cash' ? "text-amber-400" : "text-emerald-400"}`}>
                    ₹{formatIndian(calculateTotal())}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4">
                  <button 
                    type="submit" disabled={isProcessing || !!dateError} 
                    className={`w-full sm:w-2/3 text-white p-5 sm:p-6 rounded-2xl font-black uppercase tracking-widest text-sm sm:text-lg transition-colors shadow-lg active:scale-95 ${isProcessing || dateError ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-indigo-500/30'}`}
                  >
                    {isProcessing ? 'Processing...' : paymentMethod === 'cash' ? 'Confirm Reservation' : 'Secure Checkout'}
                  </button>
                  <button 
                    type="button" onClick={() => setSelectedCar(null)} disabled={isProcessing} 
                    className="w-full sm:w-1/3 bg-red-500 text-white p-5 sm:p-6 rounded-2xl font-black uppercase tracking-widest text-sm sm:text-lg shadow-md hover:bg-red-600 transition-colors active:scale-95"
                  >
                    Abort
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPanel;