import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import DashboardTour, { STORAGE_KEY as TOUR_KEY } from '../components/DashboardTour';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from 'recharts';
import './Dashboard.css';

const MOODS = [
  { val: 1, emoji: '😩', label: 'Severely Down' },
  { val: 2, emoji: '😟', label: 'Anxious / Stressed' },
  { val: 3, emoji: '😐', label: 'Neutral' },
  { val: 4, emoji: '🙂', label: 'Good' },
  { val: 5, emoji: '😀', label: 'Great!' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [wellnessScore, setWellnessScore] = useState(null);

  // Daily Mood Tracker State
  const [moodHistory, setMoodHistory] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodNote, setMoodNote] = useState('');
  const [loggingMood, setLoggingMood] = useState(false);
  const [logSuccess, setLogSuccess] = useState('');

  // Dashboard Tour state — show on first visit
  const [showTour, setShowTour] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // Fetch Assessment History
      const historyRes = await api.get('/assessments/history');
      const historyData = historyRes.data.data || [];
      setHistory(historyData);

      // Fetch Mood History
      try {
        const moodRes = await api.get('/mood/history');
        setMoodHistory(moodRes.data.data || []);
      } catch (e) {
        console.warn('Mood history not available:', e);
      }

      // Fetch Wellness Score
      try {
        const wellnessRes = await api.get('/wellness/score');
        setWellnessScore(wellnessRes.data.data);
      } catch (e) {
        console.warn('Wellness score not available:', e);
      }

      if (historyData.length > 0) {
        const latestId = historyData[0].id;
        try {
          const detailRes = await api.get(`/assessments/${latestId}`);
          const detailData = detailRes.data.data;
          setLatestAssessment(detailData);
          setRecommendations(detailData.recommendations || []);
        } catch (e) {
          console.warn('Failed to load assessment details:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-show tour on first login (after data is loaded)
  useEffect(() => {
    if (!loading && !localStorage.getItem(TOUR_KEY)) {
      const timer = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleLogMood = async (e) => {
    e.preventDefault();
    if (!selectedMood) return;
    setLoggingMood(true);
    setLogSuccess('');
    try {
      const res = await api.post('/mood', { moodScore: selectedMood, note: moodNote });
      setMoodHistory(prev => [res.data.data, ...prev]);
      setLogSuccess('Mood logged! 🎉');
      setSelectedMood(null);
      setMoodNote('');
      setTimeout(() => setLogSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to log mood:', err);
    } finally {
      setLoggingMood(false);
    }
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

  const getRiskGlow = (level) => {
    const color = getRiskColor(level);
    return `0 0 20px ${color}40`;
  };

  // Format data for Recharts
  const chartData = [...history]
    .reverse()
    .map(item => ({
      date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: item.totalScore,
      risk: item.riskLevel
    }));

  // Mood graph data
  const moodData = moodHistory.length > 0
    ? [...moodHistory].reverse().map(item => ({
      date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      mood: item.moodScore
    }))
    : chartData.map(item => {
      let moodValue = 3;
      if (item.risk === 'LOW') moodValue = 5;
      else if (item.risk === 'MODERATE') moodValue = 4;
      else if (item.risk === 'HIGH') moodValue = 2;
      else if (item.risk === 'CRITICAL') moodValue = 1;
      return { date: item.date, mood: moodValue };
    });

  if (loading) {
    return (
      <div className="main-content" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4rem' }}>
        <div className="loading-spinner-lg">Loading Aegis Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="main-content">

      {/* Guided Dashboard Tour */}
      <DashboardTour active={showTour} onComplete={() => setShowTour(false)} />

      {/* Welcome Banner */}
      <div className="welcome-banner" data-tour="welcome">
        <div className="welcome-text">
          <h1>Hello, {user?.email.split('@')[0]} 👋</h1>
          <p>Welcome back to your mental wellness hub. Track, breathe, and grow.</p>
        </div>
        <Link to="/assessment" className="btn-primary">
          Take Risk Assessment
        </Link>
      </div>

      {/* Assessment Reminder Banner */}
      {wellnessScore?.assessmentDue && (
        <div className="reminder-banner">
          <span className="reminder-icon">🔔</span>
          <div className="reminder-text">
            <strong>Assessment Reminder</strong>
            <span>Your last assessment was {wellnessScore.daysSinceLastAssessment === 999 ? 'never' : `${wellnessScore.daysSinceLastAssessment} days ago`}. Regular check-ins help track your progress accurately.</span>
          </div>
          <Link to="/assessment" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            Take Now
          </Link>
        </div>
      )}

      {/* Quick Access Cards */}
      <div className="quick-access-row" data-tour="quick-access">
        <div className="quick-card" onClick={() => navigate('/assessment')}>
          <span className="quick-icon">🧩</span>
          <span className="quick-label">Risk Assessment</span>
          <span className="quick-sub">Evaluate your current state</span>
        </div>
        <div className="quick-card" onClick={() => navigate('/breathing')}>
          <span className="quick-icon">🌬️</span>
          <span className="quick-label">Guided Breathing</span>
          <span className="quick-sub">Calm your nervous system</span>
        </div>
        <div className="quick-card" onClick={() => navigate('/habits')}>
          <span className="quick-icon">✅</span>
          <span className="quick-label">Coping Habits</span>
          <span className="quick-sub">Track daily self-care goals</span>
        </div>
        <div className="quick-card" onClick={() => navigate('/journal')}>
          <span className="quick-icon">📓</span>
          <span className="quick-label">Journal</span>
          <span className="quick-sub">Write daily reflections</span>
        </div>
        <div className="quick-card" onClick={() => navigate('/crisis')}>
          <span className="quick-icon">💙</span>
          <span className="quick-label">Crisis Help</span>
          <span className="quick-sub">Support resources</span>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">

        {/* ── LEFT / MAIN COLUMN ── */}
        <div className="dashboard-main">

          {/* Mood Log Widget */}
          <div className="glass-card mood-logging-widget" data-tour="mood-log">
            <h3 className="widget-title">How Are You Feeling Today?</h3>

            {logSuccess ? (
              <div className="auth-success" style={{ margin: '1rem 0', textAlign: 'center' }}>
                {logSuccess}
              </div>
            ) : (
              <form onSubmit={handleLogMood}>
                <div className="mood-emojis-row">
                  {MOODS.map((m) => (
                    <button
                      key={m.val}
                      type="button"
                      className={`mood-emoji-btn ${selectedMood === m.val ? 'selected' : ''}`}
                      onClick={() => setSelectedMood(m.val)}
                      title={m.label}
                    >
                      <span className="mood-emoji">{m.emoji}</span>
                      <span className="mood-label-text">{m.label}</span>
                    </button>
                  ))}
                </div>

                {selectedMood && (
                  <div style={{ marginTop: '1.2rem', animation: 'fadeIn 0.3s ease-out' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add a quick note... (Optional)"
                      value={moodNote}
                      onChange={(e) => setMoodNote(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loggingMood}
                      style={{ width: '100%', marginTop: '0.8rem', justifyContent: 'center' }}
                    >
                      {loggingMood ? 'Logging...' : '💾 Log Mood'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Assessment Progress Chart — only when assessments exist */}
          {history.length > 0 ? (
            <>
              <div className="glass-card">
                <h3 className="widget-title">Risk Score Progress</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                      <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '0.8rem' }} />
                      <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.8rem' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', color: '#fff' }}
                        itemStyle={{ color: 'var(--accent-secondary)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        name="Assessment Score"
                        stroke="var(--accent-secondary)"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mood Trend Chart */}
              <div className="glass-card">
                <h3 className="widget-title">Mood Trend Tracker</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={moodData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                      <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '0.8rem' }} />
                      <YAxis
                        stroke="var(--text-muted)"
                        style={{ fontSize: '0.8rem' }}
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tickFormatter={(val) => {
                          if (val === 5) return '😀';
                          if (val === 4) return '🙂';
                          if (val === 3) return '😐';
                          if (val === 2) return '😟';
                          if (val === 1) return '😩';
                          return '';
                        }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', color: '#fff' }}
                        formatter={(value) => {
                          if (value === 5) return ['Great', 'Mood'];
                          if (value === 4) return ['Good', 'Mood'];
                          if (value === 3) return ['Neutral', 'Mood'];
                          if (value === 2) return ['Anxious/Stressed', 'Mood'];
                          if (value === 1) return ['Severely Down', 'Mood'];
                          return [value, 'Mood'];
                        }}
                      />
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="var(--accent-primary)"
                        fillOpacity={1}
                        fill="url(#colorMood)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Assessments */}
              <div className="glass-card">
                <div className="widget-title">
                  <span>Recent Assessments</span>
                  <span className="widget-action" onClick={() => navigate('/history')}>View All →</span>
                </div>
                <div className="assessment-list">
                  {history.slice(0, 3).map((item) => (
                    <div key={item.id} className="assessment-item">
                      <div className="assessment-meta">
                        <h4>Assessment Completed</h4>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="risk-badge" style={{
                          color: getRiskColor(item.riskLevel),
                          backgroundColor: `${getRiskColor(item.riskLevel)}15`,
                          borderColor: `${getRiskColor(item.riskLevel)}30`,
                          borderStyle: 'solid',
                          borderWidth: '1px'
                        }}>
                          {item.riskLevel}
                        </span>
                        <button
                          onClick={() => navigate(`/results/${item.id}`)}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                        >
                          View Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Assessments Yet</h3>
              <p>Complete your first risk assessment to unlock charts, trends, and personalized AI coping recommendations.</p>
              <Link to="/assessment" className="btn-primary" style={{ marginTop: '1rem' }}>
                Start Assessment
              </Link>
            </div>
          )}
        </div>

        {/* ── RIGHT / SIDEBAR COLUMN ── */}
        <div className="dashboard-sidebar" data-tour="sidebar">

          {/* Wellness Radar Chart */}
          {wellnessScore && (
            <div className="glass-card wellness-radar-card">
              <h3 className="widget-title" style={{ border: 'none', textAlign: 'center', display: 'block', marginBottom: '0.5rem' }}>
                Wellness Score
              </h3>
              <div className="wellness-overall-score">
                <span className="wellness-score-num">{wellnessScore.overallScore}</span>
                <span className="wellness-score-label">/ 100</span>
              </div>
              <div style={{ height: '200px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { dimension: 'Risk', value: wellnessScore.riskScore },
                    { dimension: 'Mood', value: wellnessScore.moodScore },
                    { dimension: 'Habits', value: wellnessScore.habitScore },
                    { dimension: 'Journal', value: wellnessScore.journalScore },
                  ]}>
                    <PolarGrid stroke="var(--border-glass)" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Radar
                      name="Wellness"
                      dataKey="value"
                      stroke="var(--accent-secondary)"
                      fill="var(--accent-secondary)"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', color: '#fff', fontSize: '0.8rem' }}
                      formatter={(val) => [`${val}/100`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="wellness-dims-row">
                {[
                  { key: 'riskScore', label: 'Risk', color: 'var(--color-low)' },
                  { key: 'moodScore', label: 'Mood', color: 'var(--accent-primary)' },
                  { key: 'habitScore', label: 'Habits', color: '#ffa726' },
                  { key: 'journalScore', label: 'Journal', color: 'var(--accent-secondary)' },
                ].map(dim => (
                  <div key={dim.key} className="wellness-dim-item">
                    <span className="wellness-dim-val" style={{ color: dim.color }}>{wellnessScore[dim.key]}</span>
                    <span className="wellness-dim-label">{dim.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Risk Level Widget */}

          {latestAssessment ? (
            <div className="glass-card risk-widget" style={{ boxShadow: getRiskGlow(latestAssessment?.riskLevel) }}>
              <h3 className="widget-title" style={{ border: 'none', textAlign: 'center', display: 'block' }}>
                Current Risk Level
              </h3>
              <div className="risk-score-circle" style={{
                borderColor: getRiskColor(latestAssessment?.riskLevel),
                borderStyle: 'solid',
                borderWidth: '3px'
              }}>
                <span className="risk-score-value" style={{ color: getRiskColor(latestAssessment?.riskLevel) }}>
                  {latestAssessment?.totalScore}
                </span>
                <span className="risk-score-label">Score</span>
              </div>
              <span className="risk-badge" style={{
                fontSize: '1rem',
                padding: '0.5rem 1.2rem',
                color: getRiskColor(latestAssessment?.riskLevel),
                backgroundColor: `${getRiskColor(latestAssessment?.riskLevel)}15`,
                borderColor: `${getRiskColor(latestAssessment?.riskLevel)}30`,
                borderStyle: 'solid',
                borderWidth: '1px'
              }}>
                {latestAssessment?.riskLevel} Risk
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                Based on assessment taken {new Date(latestAssessment?.createdAt).toLocaleDateString()}.
              </p>
            </div>
          ) : (
            <div className="glass-card risk-widget-placeholder">
              <span className="risk-placeholder-icon">🎯</span>
              <h4>No Risk Data</h4>
              <p>Take an assessment to see your risk level here.</p>
            </div>
          )}

          {/* Wellness Tools Quick Links */}
          <div className="glass-card">
            <h3 className="widget-title">Wellness Tools</h3>
            <div className="wellness-links">
              <div className="wellness-link-item" onClick={() => navigate('/breathing')}>
                <span className="wellness-link-icon">🌬️</span>
                <div>
                  <h4>Guided Breathing</h4>
                  <p>Box • 4-7-8 • Equal patterns</p>
                </div>
                <span className="wellness-arrow">→</span>
              </div>
              <div className="wellness-link-item" onClick={() => navigate('/habits')}>
                <span className="wellness-link-icon">✅</span>
                <div>
                  <h4>Coping Habits Tracker</h4>
                  <p>Daily self-care goal streaks</p>
                </div>
                <span className="wellness-arrow">→</span>
              </div>
            </div>
          </div>

          {/* AI Coping Recommendations */}
          <div className="glass-card">
            <h3 className="widget-title">AI Coping Suggestions</h3>
            <div className="recs-container">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <div key={rec.id} className="rec-card">
                    <div className="rec-header">
                      <span style={{ color: 'var(--accent-secondary)' }}>💡 Suggestion</span>
                    </div>
                    <p className="rec-desc">{rec.description}</p>
                  </div>
                ))
              ) : (
                <div className="empty-recs">
                  <span className="empty-recs-icon">🤖</span>
                  <p>Complete an assessment to get personalised coping strategies tailored to your risk level.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
