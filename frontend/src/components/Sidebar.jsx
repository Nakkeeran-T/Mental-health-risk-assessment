import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

// ── SVG Icons ────────────────────────────────────────────────────────
const DashboardIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1"/>
    <rect width="7" height="5" x="14" y="3" rx="1"/>
    <rect width="7" height="9" x="14" y="12" rx="1"/>
    <rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);

const AssessmentIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/>
    <path d="m9 14 2 2 4-4"/>
  </svg>
);

const BotSparklesIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
  </svg>
);

const ChartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" x2="18" y1="20" y2="10"/>
    <line x1="12" x2="12" y1="20" y2="4"/>
    <line x1="6" x2="6" y1="20" y2="14"/>
  </svg>
);

const HabitsIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const WindIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
  </svg>
);

const BookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
    <path d="M6.5 6H20"/>
  </svg>
);

const CrisisIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m4.93 4.93 4.24 4.24"/>
    <path d="m14.83 9.17 4.24-4.24"/>
    <path d="m14.83 14.83 4.24 4.24"/>
    <path d="m9.17 14.83-4.24 4.24"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>
);

const SettingsIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const LogOutIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
);

const NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { to: '/dashboard', icon: <DashboardIcon />, text: 'Dashboard' },
    ],
  },
  {
    label: 'Mental Health',
    links: [
      { to: '/assessment', icon: <AssessmentIcon />, text: 'Risk Assessment', dataTour: 'nav-assess' },
      { to: '/chat',       icon: <BotSparklesIcon />, text: 'AI Companion',   variant: 'ai-chat' },
      { to: '/history',    icon: <ChartIcon />, text: 'Assessment History', dataTour: 'nav-history' },
    ],
  },
  {
    label: 'Wellness',
    links: [
      { to: '/habits',    icon: <HabitsIcon />, text: 'Coping Habits' },
      { to: '/breathing', icon: <WindIcon />, text: 'Breathing Tool' },
      { to: '/journal',   icon: <BookIcon />, text: 'Journal' },
    ],
  },
  {
    label: 'Support',
    links: [
      { to: '/crisis', icon: <CrisisIcon />, text: 'Crisis Help', variant: 'crisis' },
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
          <span className="sidebar-brand-logo">
            <BotSparklesIcon size={22} />
          </span>
          <span className="sidebar-brand-name">Aegis</span>
          <span className="sidebar-brand-badge">CLINICAL AI</span>
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
                <span className="sidebar-link-icon"><SettingsIcon /></span>
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

          <button className="sidebar-logout-btn" onClick={handleLogout} id="sidebar-logout" title="Sign out">
            <LogOutIcon size={16} />
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
  React.useEffect(() => {
    window.__sidebarToggle = onToggle;
    return () => { delete window.__sidebarToggle; };
  }, [onToggle]);
  return null;
};

export default Sidebar;
