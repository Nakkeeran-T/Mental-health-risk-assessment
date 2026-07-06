import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import './History.css';

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/assessments/history');
        setHistory(res.data.data || []);
      } catch (err) {
        console.error('Failed to load assessment history:', err);
        setError('Failed to load assessment history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
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
        Loading assessment history...
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="history-container">
        <div className="history-header">
          <h1>Assessment History</h1>
          <p className="history-subtitle">Track your mental health records and clinical evaluations over time.</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '2rem' }}>{error}</div>}

        {history.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>No Assessments Completed</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              You haven't completed any mental health risk assessments yet. Take your first one today.
            </p>
            <button className="btn-primary" onClick={() => navigate('/assessment')}>
              Take Assessment
            </button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="glass-card history-item-card">
                <div className="history-item-details">
                  <div className="history-item-info">
                    <h3>Assessment #{item.id}</h3>
                    <p className="history-item-date">
                      Completed: {new Date(item.completedAt || item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="history-item-stats">
                    <div className="history-stat-box">
                      <span className="history-stat-label">Score</span>
                      <span className="history-stat-val">{item.totalScore}</span>
                    </div>

                    <span className="risk-badge" style={{
                      color: getRiskColor(item.riskLevel),
                      backgroundColor: `${getRiskColor(item.riskLevel)}15`,
                      borderColor: `${getRiskColor(item.riskLevel)}30`,
                      borderStyle: 'solid',
                      borderWidth: '1px',
                      alignSelf: 'center'
                    }}>
                      {item.riskLevel} Risk
                    </span>

                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                      onClick={() => navigate(`/results/${item.id}`)}
                    >
                      View Results
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
