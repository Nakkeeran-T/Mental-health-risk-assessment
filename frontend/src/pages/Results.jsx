import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import './Results.css';

const Results = () => {
  const { assessmentId: id } = useParams();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch Assessment Details
        const detailRes = await api.get(`/assessments/${id}`);
        const assessmentData = detailRes.data.data;
        setAssessment(assessmentData);

        // 🚨 CRITICAL SAFETY: Auto-redirect to crisis page for CRITICAL risk level
        if (assessmentData?.riskLevel?.toUpperCase() === 'CRITICAL') {
          setTimeout(() => navigate('/crisis'), 3500);
        }

        // Try to fetch report if it exists
        try {
          const reportRes = await api.get(`/reports/assessment/${id}`);
          setReport(reportRes.data.data);
        } catch (reportErr) {
          // Report might not be generated yet, which is fine
        }
      } catch (err) {
        console.error('Failed to load results:', err);
        setError('Failed to load assessment results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportError('');
    setReportSuccess(false);
    try {
      const res = await api.post(`/reports/generate/${id}`);
      setReport(res.data.data);
      setReportSuccess(true);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setReportError('Could not generate report. Please try again.');
    } finally {
      setReportLoading(false);
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

  const getEmotionEmoji = (emotion) => {
    const map = { joy: '😊', optimism: '🌟', sadness: '😔', anger: '😠', neutral: '😐' };
    return map[emotion?.toLowerCase()] || '🧠';
  };

  const getEmotionColor = (emotion) => {
    const map = { joy: '#0284c7', optimism: '#b45309', sadness: '#6d28d9', anger: '#dc2626', neutral: 'var(--text-secondary)' };
    return map[emotion?.toLowerCase()] || 'var(--text-secondary)';
  };

  if (loading) {
    return <div className="main-content" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4rem' }}>Loading assessment results...</div>;
  }

  if (error || !assessment) {
    return (
      <div className="main-content">
        <div className="glass-card text-center" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--color-critical)' }}>Error Loading Results</h3>
          <p style={{ margin: '1rem 0' }}>{error || 'We could not load the results for this assessment.'}</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="results-container">
          {/* 🚨 CRITICAL Risk: Auto-redirect banner */}
          {assessment.riskLevel?.toUpperCase() === 'CRITICAL' && (
            <div style={{
              marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: '14px',
              background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)',
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <span style={{ fontSize: '1.8rem' }}>🚨</span>
              <div>
                <strong style={{ color: '#991b1b', fontSize: '1rem' }}>Immediate Support Needed</strong>
                <p style={{ color: '#7f1d1d', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                  Your assessment indicates a <strong>CRITICAL</strong> risk level. You are being redirected to Crisis Support resources in a few seconds.
                  <button
                    onClick={() => navigate('/crisis')}
                    style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: '#b91c1c',
                      cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', padding: 0 }}
                  >Go now →</button>
                </p>
              </div>
            </div>
          )}

          {/* Header Summary */}
        <div className="glass-card results-header-card">
          <h2>Assessment Completed</h2>

          {/* Source & Clinical Standard Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.75rem', padding: '0.25rem 0.75rem',
              borderRadius: '999px', fontWeight: 600, letterSpacing: '0.05em',
              background: assessment.source === 'AI_CHAT' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
              color: assessment.source === 'AI_CHAT' ? '#4338ca' : '#047857',
              border: `1px solid ${assessment.source === 'AI_CHAT' ? '#6366f140' : '#10b98140'}`
            }}>
              {assessment.source === 'AI_CHAT' ? '🤖 AI Chat Assessment' : '📋 Manual Assessment'}
            </span>
            <span style={{
              fontSize: '0.75rem', padding: '0.25rem 0.75rem',
              borderRadius: '999px', fontWeight: 600,
              background: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              🏥 PHQ-9 & GAD-7 Standard
            </span>
          </div>

          <div className="results-score-box" style={{ color: getRiskColor(assessment.riskLevel), border: `3px solid ${getRiskColor(assessment.riskLevel)}` }}>
            {assessment.totalScore}
          </div>
          <span className="risk-badge" style={{
            fontSize: '1.1rem', padding: '0.6rem 1.5rem',
            color: getRiskColor(assessment.riskLevel),
            backgroundColor: `${getRiskColor(assessment.riskLevel)}15`,
            borderColor: `${getRiskColor(assessment.riskLevel)}40`,
            borderStyle: 'solid', borderWidth: '1px'
          }}>
            {assessment.riskLevel} Risk
          </span>

          {/* ML Confidence Score */}
          {assessment.mlRiskConfidence != null && (
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>🧠 XGBoost ensemble confidence:</span>
              <div style={{ position: 'relative', width: 140, height: 10, background: 'rgba(0,0,0,0.08)', borderRadius: 999 }}>
                <div style={{
                  width: `${(assessment.mlRiskConfidence * 100).toFixed(0)}%`,
                  height: '100%', borderRadius: 999,
                  background: `linear-gradient(90deg, ${getRiskColor(assessment.riskLevel)}, ${getRiskColor(assessment.riskLevel)}aa)`
                }} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: getRiskColor(assessment.riskLevel) }}>
                {(assessment.mlRiskConfidence * 100).toFixed(1)}%
              </span>
            </div>
          )}
          {assessment.mlRiskConfidence == null && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              ⚡ Rule-based scoring (ML service offline)
            </p>
          )}

          {/* Detected Emotion (AI_CHAT only) */}
          {assessment.mlEmotion && (
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <span style={{
                padding: '0.35rem 1rem', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600,
                background: `${getEmotionColor(assessment.mlEmotion)}18`,
                color: getEmotionColor(assessment.mlEmotion),
                border: `1px solid ${getEmotionColor(assessment.mlEmotion)}40`
              }}>
                {getEmotionEmoji(assessment.mlEmotion)} Detected emotion: {assessment.mlEmotion}
              </span>
            </div>
          )}

          <p className="results-meta">
            Taken on {new Date(assessment.completedAt).toLocaleString()} | Status: <strong>{assessment.status}</strong>
          </p>
          {assessment.notes && (
            <p style={{ marginTop: '1.5rem', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              &ldquo;{assessment.notes}&rdquo;
            </p>
          )}

          {/* Ethical Clinical Disclaimer Banner */}
          <div style={{
            marginTop: '1.5rem', padding: '0.9rem 1.25rem', borderRadius: '12px',
            background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.3)',
            textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>⚕️</span>
            <div style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.5, fontWeight: 500 }}>
              <strong style={{ color: '#78350f' }}>Clinical Screening Notice:</strong> MindEase provides automated risk assessment indicators calculated from PHQ-9 & GAD-7 standardized screening tools. This score is intended for self-monitoring and triage, <u>not a formal medical diagnosis</u>. Please consult a licensed mental health professional for medical advice.
            </div>
          </div>
        </div>

        {/* Coping Recommendations */}
        <div className="glass-card">
          <h3 className="widget-title">AI Coping Recommendations</h3>
          <div className="recs-grid">
            {assessment.recommendations && assessment.recommendations.length > 0 ? (
              assessment.recommendations.map((rec) => (
                <div key={rec.id} className="result-rec-card">
                  <div className="result-rec-icon">🌱</div>
                  <div className="result-rec-content">
                    <h4>Coping Strategy</h4>
                    <p>{rec.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No automated recommendations generated.</p>
            )}
          </div>
        </div>

        {/* Clinical Report Generation */}
        <div className="glass-card">
          <div className="widget-title">
            <span>Clinical Summary Report</span>
            {!report && (
              <button 
                className="btn-primary" 
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                onClick={handleGenerateReport}
                disabled={reportLoading}
              >
                {reportLoading ? 'Generating...' : 'Generate Report'}
              </button>
            )}
          </div>
          {reportError && (
            <p style={{ color: 'var(--color-critical)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
              ⚠️ {reportError}
            </p>
          )}
          {reportSuccess && (
            <p style={{ color: 'var(--color-low)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
              ✅ Report generated successfully!
            </p>
          )}
          {report ? (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Official summary generated for reference or sharing with a mental health provider.
              </p>
              <div className="report-text-area">{report.details}</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-secondary)' }}>
              {reportLoading ? 'Analyzing responses...' : 'No clinical summary report generated for this assessment yet.'}
            </div>
          )}
        </div>

        {/* Answer Responses Breakdown */}
        <div className="glass-card">
          <h3 className="widget-title">Responses Breakdown</h3>
          <div className="answers-review-list">
            {assessment.answers && assessment.answers.map((ans, idx) => (
              <div key={ans.id} className="answer-review-item">
                <span className="answer-review-text">
                  {idx + 1}. {ans.questionText}
                </span>
                <span className="answer-review-val">
                  {ans.responseText || '—'} (Score: {ans.score})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
          <button className="btn-primary" onClick={() => navigate('/assessment')}>
            New Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
