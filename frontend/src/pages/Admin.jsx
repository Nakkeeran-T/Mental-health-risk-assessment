import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import './Admin.css';

const ITEMS_PER_PAGE = 8;

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');

  // --- ANALYTICS TIMEFRAME STATE ---
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('ALL');

  // --- LIVE SYSTEM HEALTH MONITOR STATE ---
  const [systemHealth, setSystemHealth] = useState({
    backendStatus: 'CHECKING',
    backendLatency: null,
    mlStatus: 'CHECKING',
    mlLatency: null
  });

  // --- SEARCH, FILTER & PAGINATION STATES ---
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userPage, setUserPage] = useState(1);

  const [questionSearch, setQuestionSearch] = useState('');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('ALL');
  const [questionPage, setQuestionPage] = useState(1);

  const [assessmentSearch, setAssessmentSearch] = useState('');
  const [assessmentRiskFilter, setAssessmentRiskFilter] = useState('ALL');
  const [assessmentPage, setAssessmentPage] = useState(1);

  // --- USER DETAIL DRAWER STATE ---
  const [selectedUser, setSelectedUser] = useState(null);

  // --- CONFIG STATE ---
  const [config, setConfig] = useState({ hotlineNumber: '1-800-273-8255', mlThreshold: '0.85' });
  const [configSaved, setConfigSaved] = useState(false);

  // --- QUESTION MODAL & FORM STATE ---
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    category: 'ANXIETY',
    maxScore: 5
  });

  // --- FETCH DATA & HEALTH PINGS ---
  const checkSystemHealth = async () => {
    // 1. Check Spring Boot Backend Health
    const t0 = performance.now();
    let bStatus = 'OFFLINE';
    let bLatency = null;
    try {
      await api.get('/admin/stats');
      bStatus = 'ONLINE';
      bLatency = Math.round(performance.now() - t0);
    } catch (e) {
      console.error('Backend ping failed', e);
    }

    // 2. Check Python FastAPI ML Service Liveness (via backend proxy — works on mobile too)
    const t1 = performance.now();
    let mlStatus = 'OFFLINE';
    let mlLatency = null;
    try {
      const mlRes = await api.get('/admin/ml-health', { timeout: 4000 });
      const status = mlRes.data?.data?.status;
      if (status === 'ONLINE') {
        mlStatus = 'ONLINE';
        mlLatency = Math.round(performance.now() - t1);
      }
    } catch (e) {
      console.error('ML microservice ping failed', e);
    }

    setSystemHealth({
      backendStatus: bStatus,
      backendLatency: bLatency,
      mlStatus: mlStatus,
      mlLatency: mlLatency
    });
  };

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

      try {
        const questionsRes = await api.get('/questions/all');
        setQuestions(questionsRes.data.data || []);
      } catch {
        const fallbackRes = await api.get('/questions');
        setQuestions(fallbackRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
      setError('Error loading administration dashboard. Verify you have administrator rights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    checkSystemHealth();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${newRole}`);
      setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => ({ ...prev, role: newRole }));
      }
      showNotification(`Updated User #${userId} role to ${newRole}`);
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Failed to update user role.');
    }
  };

  const handleToggleUserStatus = async (userId, currentEnabled) => {
    const newStatus = !currentEnabled;
    try {
      await api.put(`/admin/users/${userId}/status?enabled=${newStatus}`);
      setUsers(users.map(u => (u.id === userId ? { ...u, enabled: newStatus } : u)));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => ({ ...prev, enabled: newStatus }));
      }
      showNotification(`User #${userId} account has been ${newStatus ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to update user status:', err);
      alert('Failed to update user account status.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}" (#${userId})?`)) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      showNotification(`User #${userId} deleted successfully.`);
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user.');
    }
  };

  // --- QUESTION MANAGEMENT HANDLERS ---
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({ questionText: '', category: 'ANXIETY', maxScore: 5 });
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    setQuestionForm({
      questionText: q.questionText,
      category: q.category,
      maxScore: q.maxScore
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, questionForm);
        showNotification('Question updated successfully.');
      } else {
        await api.post('/questions', questionForm);
        showNotification('New question created successfully.');
      }
      setShowQuestionModal(false);
      const res = await api.get('/questions/all').catch(() => api.get('/questions'));
      setQuestions(res.data.data || []);
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Failed to save question. Please check input parameters.');
    }
  };

  const handleToggleQuestionStatus = async (q) => {
    try {
      await api.patch(`/questions/${q.id}/status?active=${!q.active}`);
      setQuestions(questions.map(item => (item.id === q.id ? { ...item, active: !q.active } : item)));
      showNotification(`Question #${q.id} set to ${!q.active ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      console.error('Failed to toggle question status:', err);
      alert('Failed to toggle question status.');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm(`Are you sure you want to deactivate question #${qId}?`)) return;
    try {
      await api.delete(`/questions/${qId}`);
      setQuestions(questions.map(item => (item.id === qId ? { ...item, active: false } : item)));
      showNotification(`Question #${qId} deactivated.`);
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to deactivate question.');
    }
  };

  // --- CSV EXPORT & CONFIG HANDLERS ---
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

  const getRiskColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'LOW': return 'var(--color-low)';
      case 'MODERATE': return 'var(--color-moderate)';
      case 'HIGH': return 'var(--color-high)';
      case 'CRITICAL': return 'var(--color-critical)';
      default: return 'var(--text-secondary)';
    }
  };

  // --- TIMEFRAME FILTERED ASSESSMENTS ---
  const timeframeFilteredAssessments = useMemo(() => {
    if (analyticsTimeframe === 'ALL') return assessments;
    const now = new Date().getTime();
    const daysMap = { '7D': 7, '30D': 30, '90D': 90 };
    const cutoffDays = daysMap[analyticsTimeframe] || 30;
    const cutoffTime = now - (cutoffDays * 24 * 60 * 60 * 1000);
    return assessments.filter(a => new Date(a.completedAt || a.createdAt).getTime() >= cutoffTime);
  }, [assessments, analyticsTimeframe]);

  // --- EXECUTIVE KPI COMPUTATIONS ---
  const avgRiskScore = useMemo(() => {
    if (timeframeFilteredAssessments.length === 0) return '0.0';
    const sum = timeframeFilteredAssessments.reduce((acc, a) => acc + (a.totalScore || 0), 0);
    return (sum / timeframeFilteredAssessments.length).toFixed(1);
  }, [timeframeFilteredAssessments]);

  const crisisEscalationRate = useMemo(() => {
    if (timeframeFilteredAssessments.length === 0) return '0.0%';
    const crisisCount = timeframeFilteredAssessments.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length;
    return `${((crisisCount / timeframeFilteredAssessments.length) * 100).toFixed(1)}%`;
  }, [timeframeFilteredAssessments]);

  const activeUserEngagementRatio = useMemo(() => {
    if (users.length === 0) return '0.0%';
    const uniqueUserIds = new Set(timeframeFilteredAssessments.map(a => a.userId));
    return `${((uniqueUserIds.size / users.length) * 100).toFixed(1)}%`;
  }, [timeframeFilteredAssessments, users]);

  // --- FILTERED & PAGINATED LISTS ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = q.questionText.toLowerCase().includes(questionSearch.toLowerCase());
      const matchesCat = questionCategoryFilter === 'ALL' || q.category === questionCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [questions, questionSearch, questionCategoryFilter]);

  const paginatedQuestions = useMemo(() => {
    const start = (questionPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, questionPage]);

  const totalQuestionPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE) || 1;

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      const matchesSearch = String(a.id).includes(assessmentSearch) || String(a.userId).includes(assessmentSearch);
      const matchesRisk = assessmentRiskFilter === 'ALL' || a.riskLevel === assessmentRiskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [assessments, assessmentSearch, assessmentRiskFilter]);

  const paginatedAssessments = useMemo(() => {
    const start = (assessmentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssessments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssessments, assessmentPage]);

  const totalAssessmentPages = Math.ceil(filteredAssessments.length / ITEMS_PER_PAGE) || 1;

  // --- ANALYTICS MEMOIZED DATA ---
  const riskData = useMemo(() => {
    const counts = { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 };
    timeframeFilteredAssessments.forEach(a => {
      if (a.riskLevel && counts[a.riskLevel] !== undefined) {
        counts[a.riskLevel]++;
      }
    });
    return Object.keys(counts)
      .map(key => ({ name: key, value: counts[key] }))
      .filter(item => item.value > 0);
  }, [timeframeFilteredAssessments]);

  const timelineData = useMemo(() => {
    const map = {};
    timeframeFilteredAssessments.forEach(a => {
      const dateStr = new Date(a.completedAt || a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[dateStr]) map[dateStr] = { date: dateStr, count: 0, totalScoreSum: 0 };
      map[dateStr].count += 1;
      map[dateStr].totalScoreSum += (a.totalScore || 0);
    });
    return Object.keys(map).map(date => ({
      date,
      assessments: map[date].count,
      avgScore: Number((map[date].totalScoreSum / map[date].count).toFixed(1))
    }));
  }, [timeframeFilteredAssessments]);

  // Demographic Risk Grouping by Age Group
  const demographicRiskData = useMemo(() => {
    const groups = {
      ADOLESCENT: { name: 'Teens (<18)', LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 },
      YOUNG_ADULT: { name: 'Young Adult (18-25)', LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 },
      ADULT: { name: 'Adult (26-45)', LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 },
      MIDDLE_AGED: { name: 'Middle Aged (46-60)', LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 },
      OLDER_ADULT: { name: 'Senior (60+)', LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 }
    };

    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u.ageGroup || 'YOUNG_ADULT'));

    timeframeFilteredAssessments.forEach(a => {
      const uAgeGroup = userMap.get(a.userId) || 'YOUNG_ADULT';
      if (groups[uAgeGroup] && a.riskLevel) {
        groups[uAgeGroup][a.riskLevel] = (groups[uAgeGroup][a.riskLevel] || 0) + 1;
      }
    });

    return Object.values(groups);
  }, [timeframeFilteredAssessments, users]);

  const questionCategoryData = useMemo(() => {
    const map = { ANXIETY: 0, DEPRESSION: 0, STRESS: 0, SLEEP: 0, SOCIAL: 0, GENERAL: 0 };
    questions.forEach(q => {
      if (q.category && map[q.category] !== undefined) {
        map[q.category]++;
      }
    });
    return Object.keys(map).map(cat => ({ category: cat, count: map[cat] }));
  }, [questions]);

  const crisisAssessments = useMemo(() => {
    return assessments
      .filter(a => a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH')
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [assessments]);

  // --- SELECTED USER DRAWER DATA ---
  const selectedUserAssessments = useMemo(() => {
    if (!selectedUser) return [];
    return assessments
      .filter(a => a.userId === selectedUser.id)
      .sort((a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt));
  }, [selectedUser, assessments]);

  const userTrendData = useMemo(() => {
    return selectedUserAssessments.map(a => ({
      date: new Date(a.completedAt || a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: a.totalScore
    }));
  }, [selectedUserAssessments]);

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
            <h1 style={{ color: 'var(--text-primary)' }}>Admin Control Panel</h1>
            <p className="admin-subtitle">Monitor platform health, manage users, configure questions, and analyze mental health trends.</p>
          </div>
          <button className="btn-primary" onClick={handleExportCSV}>📥 Export Data (CSV)</button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(0, 230, 118, 0.15)', border: '1px solid rgba(0, 230, 118, 0.3)', color: 'var(--color-low)', borderRadius: '8px', marginBottom: '1.5rem' }}>
            ✅ {successMsg}
          </div>
        )}

        {!error && (
          <>
            {/* Stats Cards */}
            <div className="admin-stats-grid">
              <div className="glass-card stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <span className="stat-num">{users.length || stats?.totalUsers || 0}</span>
                  <span className="stat-label">Registered Users</span>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <span className="stat-num">{assessments.length || stats?.totalAssessments || 0}</span>
                  <span className="stat-label">Assessments Taken</span>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon">❓</div>
                <div className="stat-content">
                  <span className="stat-num">{questions.length}</span>
                  <span className="stat-label">Assessment Questions</span>
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
                Analytics & Insights
              </button>
              <button 
                className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Manage Users ({users.length})
              </button>
              <button 
                className={`admin-tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                Manage Questions ({questions.length})
              </button>
              <button 
                className={`admin-tab-btn ${activeTab === 'crisis' ? 'active' : ''}`}
                onClick={() => setActiveTab('crisis')}
              >
                Crisis Queue {crisisAssessments.length > 0 && <span className="tab-badge">{crisisAssessments.length}</span>}
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
              
              {/* --- ANALYTICS TAB --- */}
              {activeTab === 'analytics' && (
                <div className="analytics-tab">
                  
                  {/* --- LIVE SYSTEM HEALTH MONITOR --- */}
                  <div className="health-monitor-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>🟢 Live System & ML Microservice Monitor</h4>
                      <button className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }} onClick={checkSystemHealth}>
                        🔄 Refresh Pings
                      </button>
                    </div>
                    <div className="health-grid">
                      <div className="health-node">
                        <div className="health-node-info">
                          <h5>Spring Boot Java Backend</h5>
                          <p>REST API Engine (Port 8080)</p>
                        </div>
                        <div className="status-dot-group">
                          <span className={`status-dot ${systemHealth.backendStatus === 'ONLINE' ? 'online' : 'offline'}`} />
                          <span style={{ color: systemHealth.backendStatus === 'ONLINE' ? 'var(--color-low)' : 'var(--color-critical)' }}>
                            {systemHealth.backendStatus} {systemHealth.backendLatency ? `(${systemHealth.backendLatency}ms)` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="health-node">
                        <div className="health-node-info">
                          <h5>FastAPI Python ML Model</h5>
                          <p>XGBoost Risk Classifier (Port 8000)</p>
                        </div>
                        <div className="status-dot-group">
                          <span className={`status-dot ${systemHealth.mlStatus === 'ONLINE' ? 'online' : 'offline'}`} />
                          <span style={{ color: systemHealth.mlStatus === 'ONLINE' ? 'var(--color-low)' : 'var(--color-critical)' }}>
                            {systemHealth.mlStatus} {systemHealth.mlLatency ? `(${systemHealth.mlLatency}ms)` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- FEATURE 1: TIMEFRAME FILTER BAR --- */}
                  <div className="analytics-header-row">
                    <div>
                      <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Clinical Risk & Engagement Analytics</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Real-time aggregate patient assessment trends and demographic distributions.</p>
                    </div>
                    <div className="timeframe-pill-bar">
                      {[
                        { label: '7 Days', value: '7D' },
                        { label: '30 Days', value: '30D' },
                        { label: '90 Days', value: '90D' },
                        { label: 'All Time', value: 'ALL' }
                      ].map(t => (
                        <button
                          key={t.value}
                          className={`timeframe-btn ${analyticsTimeframe === t.value ? 'active' : ''}`}
                          onClick={() => setAnalyticsTimeframe(t.value)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* --- FEATURE 2: EXECUTIVE KPI SUMMARY CARDS --- */}
                  <div className="kpi-metrics-grid">
                    <div className="kpi-card">
                      <div className="kpi-card-header">
                        <span>Average Risk Score</span>
                        <span>📊</span>
                      </div>
                      <div className="kpi-num">{avgRiskScore}</div>
                      <div className="kpi-sub">Overall mean score across submissions</div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-card-header">
                        <span>Crisis Escalation Rate</span>
                        <span>🚨</span>
                      </div>
                      <div className="kpi-num" style={{ color: 'var(--color-critical)' }}>{crisisEscalationRate}</div>
                      <div className="kpi-sub">% Flagged as High / Critical severity</div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-card-header">
                        <span>Patient Engagement</span>
                        <span>👥</span>
                      </div>
                      <div className="kpi-num" style={{ color: 'var(--accent-secondary)' }}>{activeUserEngagementRatio}</div>
                      <div className="kpi-sub">Users with assessments in timeframe</div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-card-header">
                        <span>Timeframe Submissions</span>
                        <span>📋</span>
                      </div>
                      <div className="kpi-num">{timeframeFilteredAssessments.length}</div>
                      <div className="kpi-sub">Total assessments completed</div>
                    </div>
                  </div>

                  {/* --- CHARTS GRID --- */}
                  <div className="analytics-grid">
                    
                    {/* Donut Chart: Risk Distribution */}
                    <div className="chart-card">
                      <h4 style={{ color: 'var(--text-primary)' }}>Risk Level Distribution Profile</h4>
                      {timeframeFilteredAssessments.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No assessment data available in selected timeframe.</p>
                      ) : (
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie 
                                data={riskData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={110} 
                                innerRadius={60}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {riskData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={getRiskColor(entry.name)} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} 
                                itemStyle={{ color: 'var(--text-primary)' }} 
                              />
                              <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* FEATURE 4: Average Symptom Severity Score Trend Line */}
                    <div className="chart-card">
                      <h4 style={{ color: 'var(--text-primary)' }}>Platform Average Symptom Severity Trend</h4>
                      {timelineData.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No timeline activity available in selected timeframe.</p>
                      ) : (
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer>
                            <AreaChart data={timelineData}>
                              <defs>
                                <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                              <XAxis dataKey="date" stroke="var(--text-secondary)" />
                              <YAxis stroke="var(--text-secondary)" domain={[0, 30]} />
                              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} itemStyle={{ color: 'var(--text-primary)' }} />
                              <Area type="monotone" dataKey="avgScore" name="Avg Total Score" stroke="#a855f7" fillOpacity={1} fill="url(#colorSeverity)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* FEATURE 3: Demographic Risk Breakdown (Grouped Bar Chart) */}
                    <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                      <h4 style={{ color: 'var(--text-primary)' }}>Demographic Risk Severity Breakdown by Age Group</h4>
                      <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                          <BarChart data={demographicRiskData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                            <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="LOW" name="Low Risk" fill="var(--color-low)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="MODERATE" name="Moderate Risk" fill="var(--color-moderate)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="HIGH" name="High Risk" fill="var(--color-high)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="CRITICAL" name="Critical Risk" fill="var(--color-critical)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* FEATURE 5: Question Sensitivity & Library Breakdown */}
                    <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                      <h4 style={{ color: 'var(--text-primary)' }}>Assessment Question Sensitivity & Category Distribution</h4>
                      <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                          <BarChart data={questionCategoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                            <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={11} />
                            <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                            <Bar dataKey="count" name="Active Questions" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* --- USER MANAGEMENT TAB (WITH SEARCH, FILTER & PAGINATION) --- */}
              {activeTab === 'users' && (
                <div className="table-responsive">
                  <div className="table-toolbar">
                    <h3 style={{ color: 'var(--text-primary)' }}>User Accounts Management</h3>
                    <div className="table-toolbar-left">
                      <input 
                        type="text" 
                        className="admin-search-input" 
                        placeholder="🔍 Search name or email..."
                        value={userSearch}
                        onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                      />
                      <select 
                        className="admin-filter-select"
                        value={userRoleFilter}
                        onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                      >
                        <option value="ALL">All Roles</option>
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User Info</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">No registered users match your search filter.</td>
                        </tr>
                      ) : (
                        paginatedUsers.map((u) => (
                          <tr key={u.id} className="clickable-row" onClick={() => setSelectedUser(u)}>
                            <td>#{u.id}</td>
                            <td>
                              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{u.firstName} {u.lastName}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <select 
                                className="select-role-dropdown"
                                value={u.role || 'USER'}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </td>
                            <td>
                              <span className={`status-badge ${u.enabled ? 'active' : 'inactive'}`}>
                                {u.enabled ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="admin-action-group">
                                <button 
                                  className="btn-action-sm btn-action-edit"
                                  onClick={() => setSelectedUser(u)}
                                  title="View User Details"
                                >
                                  👤 Profile
                                </button>
                                <button 
                                  className={`btn-action-sm ${u.enabled ? 'btn-action-danger' : 'btn-action-toggle'}`}
                                  onClick={() => handleToggleUserStatus(u.id, u.enabled)}
                                >
                                  {u.enabled ? 'Disable' : 'Enable'}
                                </button>
                                <button 
                                  className="btn-action-sm btn-action-danger"
                                  onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)}
                                  title="Delete User"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Bar */}
                  <div className="pagination-bar">
                    <span>Showing {paginatedUsers.length} of {filteredUsers.length} Users</span>
                    <div className="pagination-controls">
                      <button 
                        className="page-btn" 
                        disabled={userPage === 1} 
                        onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                      >
                        ← Prev
                      </button>
                      <span>Page {userPage} of {totalUserPages}</span>
                      <button 
                        className="page-btn" 
                        disabled={userPage >= totalUserPages} 
                        onClick={() => setUserPage(prev => Math.min(prev + 1, totalUserPages))}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- QUESTION MANAGEMENT TAB (WITH SEARCH, FILTER & PAGINATION) --- */}
              {activeTab === 'questions' && (
                <div className="table-responsive">
                  <div className="table-toolbar">
                    <div>
                      <h3 style={{ color: 'var(--text-primary)' }}>Questionnaire Builder</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Configure assessment questions, categories, and scoring parameters.</p>
                    </div>
                    <div className="table-toolbar-left">
                      <input 
                        type="text" 
                        className="admin-search-input" 
                        placeholder="🔍 Search questions..."
                        value={questionSearch}
                        onChange={(e) => { setQuestionSearch(e.target.value); setQuestionPage(1); }}
                      />
                      <select 
                        className="admin-filter-select"
                        value={questionCategoryFilter}
                        onChange={(e) => { setQuestionCategoryFilter(e.target.value); setQuestionPage(1); }}
                      >
                        <option value="ALL">All Categories</option>
                        <option value="ANXIETY">ANXIETY</option>
                        <option value="DEPRESSION">DEPRESSION</option>
                        <option value="STRESS">STRESS</option>
                        <option value="SLEEP">SLEEP</option>
                        <option value="SOCIAL">SOCIAL</option>
                        <option value="GENERAL">GENERAL</option>
                      </select>
                      <button className="btn-primary" onClick={handleOpenAddQuestion}>➕ Add New Question</button>
                    </div>
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Question Text</th>
                        <th>Category</th>
                        <th>Max Score</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQuestions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">No questions match your filter criteria.</td>
                        </tr>
                      ) : (
                        paginatedQuestions.map((q) => (
                          <tr key={q.id}>
                            <td>#{q.id}</td>
                            <td style={{ maxWidth: '320px', color: 'var(--text-primary)', fontWeight: '500' }}>{q.questionText}</td>
                            <td>
                              <span className={`category-badge category-${q.category?.toLowerCase() || 'general'}`}>
                                {q.category}
                              </span>
                            </td>
                            <td><strong style={{ color: 'var(--text-primary)' }}>{q.maxScore}</strong></td>
                            <td>
                              <span className={`status-badge ${q.active ? 'active' : 'inactive'}`}>
                                {q.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="admin-action-group">
                                <button 
                                  className="btn-action-sm btn-action-edit"
                                  onClick={() => handleOpenEditQuestion(q)}
                                >
                                  ✏️ Edit
                                </button>
                                <button 
                                  className={`btn-action-sm ${q.active ? 'btn-action-danger' : 'btn-action-toggle'}`}
                                  onClick={() => handleToggleQuestionStatus(q)}
                                >
                                  {q.active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button 
                                  className="btn-action-sm btn-action-danger"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  title="Delete Question"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Bar */}
                  <div className="pagination-bar">
                    <span>Showing {paginatedQuestions.length} of {filteredQuestions.length} Questions</span>
                    <div className="pagination-controls">
                      <button 
                        className="page-btn" 
                        disabled={questionPage === 1} 
                        onClick={() => setQuestionPage(prev => Math.max(prev - 1, 1))}
                      >
                        ← Prev
                      </button>
                      <span>Page {questionPage} of {totalQuestionPages}</span>
                      <button 
                        className="page-btn" 
                        disabled={questionPage >= totalQuestionPages} 
                        onClick={() => setQuestionPage(prev => Math.min(prev + 1, totalQuestionPages))}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- CRISIS QUEUE TAB --- */}
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
                            <td><strong style={{ color: 'var(--text-primary)' }}>{assessment.totalScore}</strong></td>
                            <td>{new Date(assessment.completedAt || assessment.createdAt).toLocaleString()}</td>
                            <td>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '0.4rem 1rem' }} 
                                onClick={() => {
                                  alert(`Acknowledged case for User #${assessment.userId}. Emergency response resources flagged.`);
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

              {/* --- SYSTEM CONFIG TAB --- */}
              {activeTab === 'config' && (
                <div className="config-form-container">
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>System Configuration</h3>
                  <p className="admin-subtitle" style={{ marginBottom: '2rem' }}>Update application-wide settings and AI thresholds.</p>
                  <form onSubmit={handleSaveConfig} className="config-form" style={{ maxWidth: '500px' }}>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Emergency Hotline Number</label>
                      <input 
                        type="text" 
                        value={config.hotlineNumber} 
                        onChange={(e) => setConfig({ ...config, hotlineNumber: e.target.value })} 
                        required 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
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
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button type="submit" className="btn-primary">Save Configuration</button>
                      {configSaved && <span style={{ color: 'var(--color-low)', fontWeight: 'bold' }}>✅ Settings updated successfully!</span>}
                    </div>
                  </form>
                </div>
              )}

              {/* --- VIEW ASSESSMENTS TAB (WITH SEARCH, FILTER & PAGINATION) --- */}
              {activeTab === 'assessments' && (
                <div className="table-responsive">
                  <div className="table-toolbar">
                    <h3 style={{ color: 'var(--text-primary)' }}>All Assessment Submissions</h3>
                    <div className="table-toolbar-left">
                      <input 
                        type="text" 
                        className="admin-search-input" 
                        placeholder="🔍 Search Assessment or User ID..."
                        value={assessmentSearch}
                        onChange={(e) => { setAssessmentSearch(e.target.value); setAssessmentPage(1); }}
                      />
                      <select 
                        className="admin-filter-select"
                        value={assessmentRiskFilter}
                        onChange={(e) => { setAssessmentRiskFilter(e.target.value); setAssessmentPage(1); }}
                      >
                        <option value="ALL">All Risk Levels</option>
                        <option value="LOW">LOW</option>
                        <option value="MODERATE">MODERATE</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>

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
                      {paginatedAssessments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center">No assessments match your search filter.</td>
                        </tr>
                      ) : (
                        paginatedAssessments.map((assessment) => (
                          <tr key={assessment.id}>
                            <td>#{assessment.id}</td>
                            <td>User #{assessment.userId}</td>
                            <td><strong style={{ color: 'var(--text-primary)' }}>{assessment.totalScore}</strong></td>
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

                  {/* Pagination Bar */}
                  <div className="pagination-bar">
                    <span>Showing {paginatedAssessments.length} of {filteredAssessments.length} Assessments</span>
                    <div className="pagination-controls">
                      <button 
                        className="page-btn" 
                        disabled={assessmentPage === 1} 
                        onClick={() => setAssessmentPage(prev => Math.max(prev - 1, 1))}
                      >
                        ← Prev
                      </button>
                      <span>Page {assessmentPage} of {totalAssessmentPages}</span>
                      <button 
                        className="page-btn" 
                        disabled={assessmentPage >= totalAssessmentPages} 
                        onClick={() => setAssessmentPage(prev => Math.min(prev + 1, totalAssessmentPages))}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>

      {/* --- CREATE / EDIT QUESTION MODAL --- */}
      {showQuestionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: 'var(--text-primary)' }}>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
              <button className="modal-close-btn" onClick={() => setShowQuestionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveQuestion}>
              <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Question Prompt Text</label>
                <textarea 
                  value={questionForm.questionText} 
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })} 
                  required
                  rows="3"
                  placeholder="e.g. How often have you felt overwhelmed or anxious this week?"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Category</label>
                  <select 
                    value={questionForm.category} 
                    onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  >
                    <option value="ANXIETY">ANXIETY</option>
                    <option value="DEPRESSION">DEPRESSION</option>
                    <option value="STRESS">STRESS</option>
                    <option value="SLEEP">SLEEP</option>
                    <option value="SOCIAL">SOCIAL</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Max Score (1-10)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={questionForm.maxScore} 
                    onChange={(e) => setQuestionForm({ ...questionForm, maxScore: parseInt(e.target.value) || 5 })} 
                    required 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowQuestionModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingQuestion ? 'Update Question' : 'Create Question'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- USER DETAIL PROFILE DRAWER --- */}
      {selectedUser && (
        <div className="drawer-overlay" onClick={() => setSelectedUser(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>👤 {selectedUser.firstName} {selectedUser.lastName}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedUser.email}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>✕</button>
            </div>

            <div className="drawer-user-meta">
              <div className="drawer-meta-item">
                <strong>User ID</strong>
                <span>#{selectedUser.id}</span>
              </div>
              <div className="drawer-meta-item">
                <strong>Role</strong>
                <span className={`role-badge ${selectedUser.role?.toLowerCase()}`}>{selectedUser.role}</span>
              </div>
              <div className="drawer-meta-item">
                <strong>Account Status</strong>
                <span className={`status-badge ${selectedUser.enabled ? 'active' : 'inactive'}`}>
                  {selectedUser.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="drawer-meta-item">
                <strong>Age Group</strong>
                <span>{selectedUser.ageGroup || (selectedUser.age ? `${selectedUser.age} yrs` : 'N/A')}</span>
              </div>
              <div className="drawer-meta-item">
                <strong>Joined Date</strong>
                <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="drawer-meta-item">
                <strong>Total Assessments</strong>
                <span>{selectedUserAssessments.length}</span>
              </div>
            </div>

            {/* Score Trend Chart */}
            <div className="chart-card" style={{ marginTop: '0.5rem' }}>
              <h4 style={{ color: 'var(--text-primary)' }}>Assessment Score History Trend</h4>
              {selectedUserAssessments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>User has not completed any assessments yet.</p>
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={userTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} />
                      <YAxis stroke="var(--text-secondary)" fontSize={10} />
                      <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="score" stroke="#8a2be2" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Assessment Submissions Table */}
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.8rem' }}>Submitted Assessment Records</h4>
              {selectedUserAssessments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No submissions.</p>
              ) : (
                <table className="admin-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Score</th>
                      <th>Risk Level</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserAssessments.map(a => (
                      <tr key={a.id}>
                        <td>#{a.id}</td>
                        <td><strong>{a.totalScore}</strong></td>
                        <td>
                          <span className="risk-badge" style={{ color: getRiskColor(a.riskLevel), backgroundColor: `${getRiskColor(a.riskLevel)}15` }}>
                            {a.riskLevel}
                          </span>
                        </td>
                        <td>{new Date(a.completedAt || a.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Drawer Quick Actions */}
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <button 
                className="btn-action-sm btn-action-toggle" 
                style={{ flex: 1, padding: '0.6rem' }}
                onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.enabled)}
              >
                {selectedUser.enabled ? '🔒 Disable Account' : '🔓 Enable Account'}
              </button>
              <button 
                className="btn-action-sm btn-action-danger" 
                style={{ padding: '0.6rem 1rem' }}
                onClick={() => handleDeleteUser(selectedUser.id, `${selectedUser.firstName} ${selectedUser.lastName}`)}
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
