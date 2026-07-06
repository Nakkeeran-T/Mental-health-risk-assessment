import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/assessment" 
            element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/assessment/:id" 
            element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/results/:assessmentId" 
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/habits" 
            element={
              <ProtectedRoute>
                <Habits />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/breathing" 
            element={
              <ProtectedRoute>
                <Breathing />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/journal" 
            element={
              <ProtectedRoute>
                <Journal />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/crisis" 
            element={
              <ProtectedRoute>
                <Crisis />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
