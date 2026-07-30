import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Results from './pages/Results';
import History from './pages/History';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Habits from './pages/Habits';
import Breathing from './pages/Breathing';
import Journal from './pages/Journal';
import Crisis from './pages/Crisis';
import Chat from './pages/Chat';

/* Page titles mapped by route */
const PAGE_TITLES = {
  '/dashboard':  '🏠 Dashboard',
  '/assessment': '📋 Risk Assessment',
  '/chat':       '🤖 AI Companion',
  '/habits':     '✅ Coping Habits',
  '/breathing':  '🌬️ Breathing Tool',
  '/journal':    '📓 Journal',
  '/history':    '📊 Assessment History',
  '/crisis':     '💙 Crisis Help',
  '/profile':    '👤 Profile',
  '/admin':      '⚙️ Admin Panel',
};

/* Inner app shell — needs router + auth context */
const AppShell = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const pageTitle = PAGE_TITLES[location.pathname] || 'Aegis';

  if (isAuthPage) {
    // Auth pages: no sidebar, centered layout
    return (
      <div className="auth-layout">
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar navigation ── */}
      <Sidebar />

      {/* ── Main panel ── */}
      <div className="main-panel">
        {/* Top bar — title + mobile hamburger */}
        {isAuthenticated && (
          <header className="topbar">
            <button
              className="mobile-menu-btn"
              onClick={() => window.__sidebarToggle?.()}
              aria-label="Open menu"
            >
              ☰
            </button>
            <span className="topbar-title">{pageTitle}</span>
          </header>
        )}

        {/* Page content */}
        <main className="page-content">
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/assessment" element={
              <ProtectedRoute><Assessment /></ProtectedRoute>
            } />
            <Route path="/assessment/:id" element={
              <ProtectedRoute><Assessment /></ProtectedRoute>
            } />
            <Route path="/results/:assessmentId" element={
              <ProtectedRoute><Results /></ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute><History /></ProtectedRoute>
            } />
            <Route path="/habits" element={
              <ProtectedRoute><Habits /></ProtectedRoute>
            } />
            <Route path="/breathing" element={
              <ProtectedRoute><Breathing /></ProtectedRoute>
            } />
            <Route path="/journal" element={
              <ProtectedRoute><Journal /></ProtectedRoute>
            } />
            <Route path="/crisis" element={
              <ProtectedRoute><Crisis /></ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute><Chat /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}><Admin /></ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  );
}

export default App;
