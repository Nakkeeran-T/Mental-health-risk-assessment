import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { to: '/dashboard', icon: '🏠', text: 'Dashboard' },
    ],
  },
  {
    label: 'Mental Health',
    links: [
      { to: '/assessment', icon: '📋', text: 'Risk Assessment', dataTour: 'nav-assess' },
      { to: '/chat',       icon: '🤖', text: 'AI Companion',   variant: 'ai-chat' },
      { to: '/history',    icon: '📊', text: 'Assessment History', dataTour: 'nav-history' },
    ],
  },
  {
    label: 'Wellness',
    links: [
      { to: '/habits',    icon: '✅', text: 'Coping Habits' },
      { to: '/breathing', icon: '🌬️', text: 'Breathing Tool' },
      { to: '/journal',   icon: '📓', text: 'Journal' },
    ],
  },
  {
    label: 'Support',
    links: [
      { to: '/crisis', icon: '💙', text: 'Crisis Help', variant: 'crisis' },
    ],
  },
];

const Sidebar = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const closeMobile = () => setMobileOpen(false);

  if (!isAuthenticated) return null;

  const displayName = user?.firstName || user?.email || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Dark overlay (mobile) ── */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'overlay-open' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* ── Sidebar panel ── */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation">

        {/* Brand */}
        <Link to="/dashboard" className="sidebar-brand" onClick={closeMobile}>
          <span className="sidebar-brand-logo">🧠</span>
          <span className="sidebar-brand-name">Aegis</span>
          <span className="sidebar-brand-badge">AI LIVE</span>
        </Link>

        {/* Nav sections */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <React.Fragment key={section.label}>
              <span className="sidebar-section-label">{section.label}</span>
              {section.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`sidebar-link ${link.variant || ''} ${isActive(link.to) ? 'active' : ''}`}
                  onClick={closeMobile}
                  aria-current={isActive(link.to) ? 'page' : undefined}
                  {...(link.dataTour ? { 'data-tour': link.dataTour } : {})}
                >
                  <span className="sidebar-link-icon">{link.icon}</span>
                  <span className="sidebar-link-text">{link.text}</span>
                </Link>
              ))}
            </React.Fragment>
          ))}

          {/* Admin (conditional) */}
          {isAdmin() && (
            <>
              <span className="sidebar-section-label">Admin</span>
              <Link
                to="/admin"
                className={`sidebar-link admin ${isActive('/admin') ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <span className="sidebar-link-icon">⚙️</span>
                <span className="sidebar-link-text">Admin Panel</span>
              </Link>
            </>
          )}
        </nav>

        {/* Footer: profile + logout */}
        <div className="sidebar-footer">
          <Link
            to="/profile"
            className={`sidebar-profile-link ${isActive('/profile') ? 'active' : ''}`}
            onClick={closeMobile}
            aria-current={isActive('/profile') ? 'page' : undefined}
            data-tour="nav-profile"
          >
            <div className="sidebar-avatar" aria-hidden="true">{initials}</div>
            <span className="sidebar-username">{displayName}</span>
          </Link>

          <button className="sidebar-logout-btn" onClick={handleLogout} id="sidebar-logout">
            <span aria-hidden="true">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Expose toggle for the topbar to call */}
      <MobileToggle onToggle={() => setMobileOpen(true)} />
    </>
  );
};

/* Invisible hook — the topbar calls the exposed toggle function */
const MobileToggle = ({ onToggle }) => {
  // Store the toggle function globally so the topbar can access it
  React.useEffect(() => {
    window.__sidebarToggle = onToggle;
    return () => { delete window.__sidebarToggle; };
  }, [onToggle]);
  return null;
};

export default Sidebar;
