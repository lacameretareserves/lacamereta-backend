import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import CalendarioDisponibilidadPage from './pages/CalendarioDisponibilidadPage2';
import CalendariReservesPage from './pages/CalendariReservesPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setIsLoggedIn(false);
    window.location.href = '/login';
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <Router>
      <div className="app-container">
        {/* NAVBAR RESPONSIVE */}
        <nav className="navbar">
          <div className="navbar-content">
            {/* Logo - siempre visible y centrado en móvil */}
            <div className="navbar-logo">
              <Link to="/" onClick={closeMenu}>
                <img 
                  src="/images/lacamereta-mini-negre.png" 
                  alt="La Camereta" 
                />
              </Link>
            </div>

            {/* Botón hamburguesa - solo móvil */}
            <button 
              className="navbar-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>

            {/* Links de navegación */}
            <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
              <Link to="/" className="nav-link" onClick={closeMenu}>
                📝 Fer Reserva
              </Link>

              {isLoggedIn && (
                <Link to="/admin" className="nav-link" onClick={closeMenu}>
                  ⚙️ Panell Admin
                </Link>
              )}

              {isLoggedIn ? (
                <button onClick={() => { handleLogout(); closeMenu(); }} className="nav-link nav-button">
                  🚪 Tancar Sessió
                </button>
              ) : (
                <Link to="/login" className="nav-link" onClick={closeMenu}>
                  🔑 Accés Admin
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Overlay para cerrar menú en móvil */}
        {menuOpen && <div className="navbar-overlay" onClick={closeMenu}></div>}

        {/* CONTENIDO PRINCIPAL */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/admin" 
              element={isLoggedIn ? <AdminPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/horarios" 
              element={isLoggedIn ? <CalendarioDisponibilidadPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/calendari" 
              element={isLoggedIn ? <CalendariReservesPage /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;