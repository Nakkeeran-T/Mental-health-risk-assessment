import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'assessments'

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes, assessmentsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/assessments')
        ]);
        
        setStats(statsRes.data.data);
        setUsers(usersRes.data.data || []);
        setAssessments(assessmentsRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch admin dashboard data:', err);
        setError('Error loading administration dashboard. Verify you have administrator rights.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const getRiskColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'LOW': return 'var(--color-low)';
      case 'MODERATE': return 'var(--color-moderate)';
      case 'HIGH': return 'var(--color-high)';
      case 'CRITICAL': return 'var(--color-critical)';
      default: return 'var(--text-secondary)';
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4rem' }}>
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Control Panel</h1>
          <p className="admin-subtitle">Monitor user activity, view assessment records, and analyze platform statistics.</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '2rem' }}>{error}</div>}

        {!error && (
          <>
            {/* Stats Cards */}
            <div className="admin-stats-grid">
              <div className="glass-card stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <span className="stat-num">{stats?.totalUsers || 0}</span>
                  <span className="stat-label">Registered Users</span>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <span className="stat-num">{stats?.totalAssessments || 0}</span>
                  <span className="stat-label">Total Assessments Taken</span>
                </div>
              </div>
            </div>

            {/* Tab Controller */}
            <div className="admin-tabs">
              <button 
                className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Manage Users
              </button>
              <button 
                className={`admin-tab-btn ${activeTab === 'assessments' ? 'active' : ''}`}
                onClick={() => setActiveTab('assessments')}
              >
                View Assessments
              </button>
            </div>

            {/* Tab Contents */}
            <div className="glass-card admin-content-card">
              {activeTab === 'users' ? (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">No users registered on the platform.</td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td>#{user.id}</td>
                            <td>{user.firstName} {user.lastName}</td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`role-badge ${user.role?.toLowerCase()}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${user.enabled ? 'active' : 'inactive'}`}>
                                {user.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User ID</th>
                        <th>Score</th>
                        <th>Risk Level</th>
                        <th>Status</th>
                        <th>Completed Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center">No assessments completed yet.</td>
                        </tr>
                      ) : (
                        assessments.map((assessment) => (
                          <tr key={assessment.id}>
                            <td>#{assessment.id}</td>
                            <td>User #{assessment.userId}</td>
                            <td>{assessment.totalScore}</td>
                            <td>
                              <span className="risk-badge" style={{
                                color: getRiskColor(assessment.riskLevel),
                                backgroundColor: `${getRiskColor(assessment.riskLevel)}15`,
                                borderColor: `${getRiskColor(assessment.riskLevel)}30`,
                                borderStyle: 'solid',
                                borderWidth: '1px',
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem'
                              }}>
                                {assessment.riskLevel}
                              </span>
                            </td>
                            <td>{assessment.status}</td>
                            <td>{new Date(assessment.completedAt || assessment.createdAt).toLocaleString()}</td>
                            <td>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', borderRadius: '4px' }}
                                onClick={() => navigate(`/results/${assessment.id}`)}
                              >
                                View Results
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
