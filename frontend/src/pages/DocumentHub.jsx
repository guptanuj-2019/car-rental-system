import { useState } from 'react';

const DocumentHub = () => {
  // Simulated data: Replace this with an API call to your backend that fetches the Cloudinary URLs
  const [documents, setDocuments] = useState([
    { id: '1', title: 'Booking Receipt - Toyota Camry', date: '2026-03-20', url: 'https://res.cloudinary.com/demo/image/upload/v1611111111/sample.pdf' },
    { id: '2', title: 'Rental Agreement - Honda Civic', date: '2026-03-18', url: 'https://res.cloudinary.com/demo/image/upload/v1622222222/sample.pdf' },
    { id: '3', title: 'Refund Confirmation', date: '2026-03-10', url: 'https://res.cloudinary.com/demo/image/upload/v1633333333/sample.pdf' },
  ]);

  // Helper function to inject the download flag into any Cloudinary URL
  const getDownloadUrl = (originalUrl) => {
    return originalUrl.replace('/upload/', '/upload/fl_attachment/');
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto animate-fade-in-up">
        
        {/* PREMIUM HEADER */}
        <div className="border-b border-gray-200 pb-6 mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-2 tracking-tight">
            Document Hub
          </h1>
          <p className="text-gray-500 font-bold tracking-wide uppercase text-sm">View and download your official receipts and agreements.</p>
        </div>

        {/* GLOWING GRID OF PDFs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-lg border border-gray-100 p-8 flex flex-col justify-between group hover:-translate-y-2 hover:shadow-indigo-500/20 transition-all duration-300">
              
              <div>
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-red-500/30 mb-6 group-hover:scale-110 transition-transform">
                  📄
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2 leading-tight">{doc.title}</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-6">
                  Generated: {new Date(doc.date).toLocaleDateString()}
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex space-x-3">
                {/* 1. VIEW BUTTON (Opens in new tab safely) */}
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-1/2 bg-white text-indigo-600 border border-indigo-100 py-3 rounded-xl font-bold text-sm text-center shadow-sm hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  👁️ View
                </a>

                {/* 2. DOWNLOAD BUTTON (Forces the file to download) */}
                <a 
                  href={getDownloadUrl(doc.url)} 
                  download 
                  className="w-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm text-center shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                >
                  📥 Download
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default DocumentHub;