const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [...Array(totalPages).keys()].map(num => num + 1);

  return (
    <div className="flex justify-center items-center space-x-2 mt-6 mb-6 p-4">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all duration-300 shadow-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 active:scale-95'}`}
      >
        ← Prev
      </button>

      <div className="flex space-x-1.5 bg-white/80 backdrop-blur-xl p-1.5 rounded-xl shadow-sm border border-gray-100">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs transition-all duration-300 ${currentPage === page ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105' : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            {page}
          </button>
        ))}
      </div>

      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all duration-300 shadow-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 active:scale-95'}`}
      >
        Next →
      </button>
    </div>
  );
};

export default Pagination;