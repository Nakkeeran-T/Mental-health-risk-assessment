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
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch Assessment Details
        const detailRes = await api.get(`/assessments/${id}`);
        setAssessment(detailRes.data.data);

        // Try to fetch report if it exists
        try {
          const reportRes = await api.get(`/reports/assessment/${id}`);
          setReport(reportRes.data.data);
        } catch (reportErr) {
          // Report might not be generated yet, which is fine
          console.log('No report generated yet.');
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
    try {
      const res = await api.post(`/reports/generate/${id}`);
      setReport(res.data.data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Could not generate report. Please try again.');
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
        {/* Header Summary */}
        <div className="glass-card results-header-card">
          <h2>Assessment Completed</h2>
          <div className="results-score-box" style={{ color: getRiskColor(assessment.riskLevel), border: `2px solid ${getRiskColor(assessment.riskLevel)}` }}>
            {assessment.totalScore}
          </div>
          <span className="risk-badge" style={{
            fontSize: '1.1rem',
            padding: '0.6rem 1.5rem',
            color: getRiskColor(assessment.riskLevel),
            backgroundColor: `${getRiskColor(assessment.riskLevel)}15`,
            borderColor: `${getRiskColor(assessment.riskLevel)}30`,
            borderStyle: 'solid',
            borderWidth: '1px'
          }}>
            {assessment.riskLevel} Risk
          </span>
          <p className="results-meta">
            Taken on {new Date(assessment.completedAt).toLocaleString()} | Status: {assessment.status}
          </p>
          {assessment.notes && (
            <p style={{ marginTop: '1.5rem', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              &ldquo;{assessment.notes}&rdquo;
            </p>
          )}
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
