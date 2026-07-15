import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-container">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-logo">🧠</span> Aegis
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                to="/assessment"
                className={`nav-link ${isActive('/assessment') ? 'active' : ''}`}
                data-tour="nav-assess"
              >
                Assess Risk
              </Link>
              <Link
                to="/habits"
                className={`nav-link ${isActive('/habits') ? 'active' : ''}`}
              >
                Coping Habits
              </Link>
              <Link
                to="/breathing"
                className={`nav-link ${isActive('/breathing') ? 'active' : ''}`}
              >
                Breathing Tool
              </Link>
              <Link
                to="/journal"
                className={`nav-link ${isActive('/journal') ? 'active' : ''}`}
              >
                Journal
              </Link>
              <Link
                to="/history"
                className={`nav-link ${isActive('/history') ? 'active' : ''}`}
                data-tour="nav-history"
              >
                History
              </Link>
              <Link
                to="/crisis"
                className={`nav-link crisis-nav-link ${isActive('/crisis') ? 'active' : ''}`}
              >
                💙 Crisis Help
              </Link>
              {isAdmin() && (
                <Link
                  to="/admin"
                  className={`nav-link admin-btn ${isActive('/admin') ? 'active' : ''}`}
                >
                  Admin Panel
                </Link>
              )}
              <Link
                to="/profile"
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                data-tour="nav-profile"
              >
                Profile
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link to="/register" className="nav-btn-register">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
