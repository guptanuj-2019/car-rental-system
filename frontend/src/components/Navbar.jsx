import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// IMPORT YOUR LOCAL LOGO HERE
import logo from '../assets/logo.png'; 

const Navbar = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // --- DROPDOWN & MENU STATES ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // --- ENHANCED DARK MODE LOGIC ---
  // Defaults to 'system' if no preference is saved
  const [themePref, setThemePref] = useState(() => {
    return localStorage.getItem('themePref') || 'system';
  });

  useEffect(() => {
    const applyTheme = (isDark) => {
      let styleEl = document.getElementById('magic-dark-mode');
      
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'magic-dark-mode';
        document.head.appendChild(styleEl);
      }

      if (isDark) {
        // Apply the inversion math with !important
        styleEl.innerHTML = `
          html { filter: invert(1) hue-rotate(180deg) !important; background-color: #111 !important; min-height: 100vh; }
          html img, html video, html [style*="background-image"] { filter: invert(1) hue-rotate(180deg) !important; }
        `;
      } else {
        // Clear the styles for light mode
        styleEl.innerHTML = '';
      }
    };

    // If set to Auto/System, listen to the user's OS settings
    if (themePref === 'system') {
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(darkQuery.matches); // Apply initial system state
      
      // Listen for system theme changes in real-time
      const listener = (e) => applyTheme(e.matches);
      darkQuery.addEventListener('change', listener);
      
      return () => darkQuery.removeEventListener('change', listener);
    } else {
      // If manually forced to Day or Night
      applyTheme(themePref === 'night');
    }
    
    // Save preference
    localStorage.setItem('themePref', themePref);
  }, [themePref]);
  // --- END DARK MODE LOGIC ---

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handleThemeChange = (mode) => {
    setThemePref(mode);
    setIsThemeMenuOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-blue-800 p-4 text-white shadow-lg relative z-40">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* --- BRANDING --- */}
        <Link to="/" className="flex items-center space-x-3 text-2xl font-bold tracking-wider hover:opacity-90 transition">
          <img src={logo} alt="CarRentals Logo" className="h-10 w-10 object-contain drop-shadow-md" />
          <span>CarRentals</span>
        </Link>
        
        <div className="space-x-4 flex items-center">
          <Link to="/" className="hover:text-blue-200 font-semibold">Home</Link>
          
          {userInfo?.role === 'Rental Staff' && (
            <Link to="/staff" className="hover:text-blue-200 font-semibold">Staff Panel</Link>
          )}

          {userInfo?.role === 'Admin' && (
            <Link to="/admin" className="hover:text-blue-200 font-semibold">Admin Panel</Link>
          )}
          
          {userInfo ? (
            <div className="flex items-center space-x-4 ml-4 border-l border-blue-600 pl-4 relative">
              <Link to="/mybookings" className="hover:text-blue-200 text-sm font-semibold">My Bookings</Link>

              <span>Hello, {userInfo.name}</span>

              {/* LIST ICON & USER GREETING TRIGGER */}
              <div className="relative">
                <button 
                  onClick={() => { setIsMenuOpen(!isMenuOpen); setIsThemeMenuOpen(false); }} 
                  className="flex items-center gap-2 text-sm text-blue-100 font-semibold hover:text-white transition focus:outline-none bg-blue-900/50 px-4 py-2 rounded-lg"
                >
                  {/* <span>Hello, {userInfo.name}</span> */}
                  {/* The List / Menu Icon */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>

                {/* DROPDOWN MENU */}
                {isMenuOpen && (
                  <>
                    {/* Invisible overlay to close menu when clicking outside */}
                    <div className="fixed inset-0 z-40" onClick={() => { setIsMenuOpen(false); setIsThemeMenuOpen(false); }}></div>
                    
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-2 text-gray-800 z-50 border border-gray-100 overflow-hidden">
                      
                      {/* Option 1: Profile */}
                      <Link 
                        to="/profile" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 font-bold transition text-sm"
                      >
                        👤 View Profile
                      </Link>

                      {/* Option 2: Change Mode */}
                      <button 
                        onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)} 
                        className="w-full flex justify-between items-center px-5 py-3 hover:bg-gray-50 font-bold transition text-sm"
                      >
                        <span className="flex items-center gap-3">🌗 Change Mode</span>
                        <span className="text-gray-400 text-xs">{isThemeMenuOpen ? '▲' : '▼'}</span>
                      </button>

                      {/* Nested Theme Options */}
                      {isThemeMenuOpen && (
                        <div className="bg-gray-50/80 border-y border-gray-100 py-1 flex flex-col">
                          <button onClick={() => handleThemeChange('day')} className={`text-left px-10 py-2.5 text-xs font-bold hover:bg-gray-200 transition ${themePref === 'day' ? 'text-blue-600' : 'text-gray-600'}`}>
                            ☀️ Day Mode
                          </button>
                          <button onClick={() => handleThemeChange('night')} className={`text-left px-10 py-2.5 text-xs font-bold hover:bg-gray-200 transition ${themePref === 'night' ? 'text-blue-600' : 'text-gray-600'}`}>
                            🌙 Night Mode
                          </button>
                          <button onClick={() => handleThemeChange('system')} className={`text-left px-10 py-2.5 text-xs font-bold hover:bg-gray-200 transition ${themePref === 'system' ? 'text-blue-600' : 'text-gray-600'}`}>
                            ⚙️ Auto / System Default
                          </button>
                        </div>
                      )}

                      {/* Option 3: Logout */}
                      <button 
                        onClick={logoutHandler} 
                        className="w-full flex items-center gap-3 text-left px-5 py-3 hover:bg-red-50 text-red-500 font-bold transition text-sm border-t border-gray-100 mt-1"
                      >
                        🚪 Logout
                      </button>

                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="bg-green-500 px-5 py-2 rounded-md hover:bg-green-600 transition font-bold shadow ml-4 border-l border-blue-600 pl-4">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;