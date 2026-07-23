import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');

  // Mock Config State
  const [config, setConfig] = useState({ hotlineNumber: '1-800-273-8255', mlThreshold: '0.85' });
  const [configSaved, setConfigSaved] = useState(false);

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

  const handleExportCSV = () => {
    let csv = "ID,User ID,Score,Risk Level,Status,Completed Date\n";
    assessments.forEach(a => {
      csv += `${a.id},${a.userId},${a.totalScore},${a.riskLevel},${a.status},${new Date(a.completedAt || a.createdAt).toISOString()}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessments_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const riskData = useMemo(() => {
    const counts = { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 };
    assessments.forEach(a => {
      if (a.riskLevel && counts[a.riskLevel] !== undefined) {
        counts[a.riskLevel]++;
      }
    });
    return Object.keys(counts)
      .map(key => ({ name: key, value: counts[key] }))
      .filter(item => item.value > 0);
  }, [assessments]);

  const crisisAssessments = useMemo(() => {
    return assessments
      .filter(a => a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH')
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [assessments]);

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
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Admin Control Panel</h1>
            <p className="admin-subtitle">Monitor user activity, manage crisis queues, and configure platform settings.</p>
          </div>
          <button className="btn-primary" onClick={handleExportCSV}>📥 Export Data (CSV)</button>
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
              <div className="glass-card stat-card" style={{ borderColor: crisisAssessments.length > 0 ? 'var(--color-critical)' : 'transparent', borderWidth: '1px', borderStyle: 'solid' }}>
                <div className="stat-icon">🚨</div>
                <div className="stat-content">
                  <span className="stat-num">{crisisAssessments.length}</span>
                  <span className="stat-label">At-Risk Cases Detected</span>
                </div>
              </div>
            </div>

            {/* Tab Controller */}
            <div className="admin-tabs">
              <button 
                className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
              <button 
                className={`admin-tab-btn ${activeTab === 'crisis' ? 'active' : ''}`}
                onClick={() => setActiveTab('crisis')}
              >
                Crisis Queue {crisisAssessments.length > 0 && <span className="tab-badge">{crisisAssessments.length}</span>}
              </button>
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
              <button 
                className={`admin-tab-btn ${activeTab === 'config' ? 'active' : ''}`}
                onClick={() => setActiveTab('config')}
              >
                System Config
              </button>
            </div>

            {/* Tab Contents */}
            <div className="glass-card admin-content-card">
              
              {activeTab === 'analytics' && (
                <div className="analytics-tab">
                  <h3 style={{ marginBottom: '1rem' }}>Platform Risk Distribution</h3>
                  {assessments.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No data available to display chart.</p>
                  ) : (
                    <div style={{ width: '100%', height: 400, marginTop: '2rem' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie 
                            data={riskData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={130} 
                            innerRadius={70}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {riskData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getRiskColor(entry.name)} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} 
                            itemStyle={{ color: '#fff' }} 
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'crisis' && (
                <div className="table-responsive">
                  <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-critical)' }}>Active Crisis Triage Queue</h3>
                  <table className="admin-table crisis-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Risk Level</th>
                        <th>Score</th>
                        <th>Detected At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crisisAssessments.length === 0 ? (
                        <tr><td colSpan="5" className="text-center">No critical or high risk cases detected.</td></tr>
                      ) : (
                        crisisAssessments.map(assessment => (
                          <tr key={assessment.id} className={`crisis-row-${assessment.riskLevel?.toLowerCase()}`}>
                            <td>User #{assessment.userId}</td>
                            <td>
                              <span className="risk-badge" style={{ color: getRiskColor(assessment.riskLevel), backgroundColor: `${getRiskColor(assessment.riskLevel)}15` }}>
                                {assessment.riskLevel}
                              </span>
                            </td>
                            <td><strong style={{ color: '#fff' }}>{assessment.totalScore}</strong></td>
                            <td>{new Date(assessment.completedAt || assessment.createdAt).toLocaleString()}</td>
                            <td>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '0.4rem 1rem' }} 
                                onClick={() => {
                                  alert(`Mock Action: Acknowledged case for User #${assessment.userId}. Emergency resources dispatched.`);
                                }}
                              >
                                Acknowledge Alert
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="config-form-container">
                  <h3 style={{ marginBottom: '0.5rem' }}>System Configuration</h3>
                  <p className="admin-subtitle" style={{ marginBottom: '2rem' }}>Update application-wide settings and AI thresholds.</p>
                  <form onSubmit={handleSaveConfig} className="config-form" style={{ maxWidth: '500px' }}>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Emergency Hotline Number</label>
                      <input 
                        type="text" 
                        value={config.hotlineNumber} 
                        onChange={(e) => setConfig({ ...config, hotlineNumber: e.target.value })} 
                        required 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: '#fff' }}
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>AI Risk Detection Threshold (0.0 - 1.0)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="1" 
                        value={config.mlThreshold} 
                        onChange={(e) => setConfig({ ...config, mlThreshold: e.target.value })} 
                        required 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button type="submit" className="btn-primary">Save Configuration</button>
                      {configSaved && <span style={{ color: 'var(--color-low)', fontWeight: 'bold' }}>✅ Settings updated successfully!</span>}
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'users' && (
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
              )}

              {activeTab === 'assessments' && (
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
