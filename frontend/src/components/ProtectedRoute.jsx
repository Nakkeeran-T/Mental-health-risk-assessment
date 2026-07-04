import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'var(--text-secondary)'
      }}>
        Loading Aegis Platform...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save current location to return back to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin()) {
    // Authenticated but not an admin: redirect to standard user dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
