import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import './Assessment.css';

const Assessment = () => {
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [selectedScale, setSelectedScale] = useState(null); // 'DEPRESSION', 'ANXIETY', 'STRESS', 'ALL'
  const [answers, setAnswers] = useState({}); // { questionId: { score, responseText } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Likert scales mapping
  const standardOptions = [
    { score: 0, text: 'Not at all' },
    { score: 1, text: 'Several days' },
    { score: 2, text: 'More than half the days' },
    { score: 3, text: 'Nearly every day' }
  ];

  const stressOptions = [
    { score: 0, text: 'Never' },
    { score: 1, text: 'Almost Never' },
    { score: 2, text: 'Sometimes' },
    { score: 3, text: 'Fairly Often' },
    { score: 4, text: 'Very Often' }
  ];

  useEffect(() => {
    if (selectedScale) {
      const fetchQuestions = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await api.get('/questions');
          const allQuestions = res.data.data || [];
          
          // Filter questions based on selection
          let filtered = [];
          if (selectedScale === 'ALL') {
            filtered = allQuestions;
          } else {
            filtered = allQuestions.filter(q => q.category === selectedScale);
          }
          
          setQuestions(filtered);
          // Initialize empty answers state
          const initialAnswers = {};
          filtered.forEach(q => {
            initialAnswers[q.id] = null;
          });
          setAnswers(initialAnswers);
        } catch (err) {
          console.error('Failed to load questions:', err);
          setError('Could not load questionnaire questions. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchQuestions();
    }
  }, [selectedScale]);

  const handleSelectOption = (questionId, score, responseText) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { score, responseText }
    }));
  };

  const getOptionsForCategory = (category) => {
    if (category === 'STRESS') return stressOptions;
    return standardOptions;
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(val => val !== null).length;
  };

  const getProgressPercentage = () => {
    if (questions.length === 0) return 0;
    return (getAnsweredCount() / questions.length) * 100;
  };

  const isFormComplete = () => {
    return questions.length > 0 && getAnsweredCount() === questions.length;
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Format DTO payload
    const payload = {
      notes: notes,
      answers: Object.entries(answers).map(([qId, val]) => ({
        questionId: parseInt(qId),
        score: val.score,
        responseText: val.responseText
      }))
    };

    try {
      const res = await api.post('/assessments/submit', payload);
      const createdAssessment = res.data.data;
      navigate(`/results/${createdAssessment.id}`);
    } catch (err) {
      console.error('Failed to submit assessment:', err);
      setError('Failed to submit assessment. Please check your network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedScale) {
    return (
      <div className="main-content">
        <div className="assessment-selection">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Select Assessment Questionnaire</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Choose a clinical assessment scale to measure your current risk profile.</p>
          </div>

          <div className="selection-grid">
            <div className="glass-card selection-card" onClick={() => setSelectedScale('DEPRESSION')}>
              <div className="selection-icon">📉</div>
              <h3>PHQ-9</h3>
              <p>Patient Health Questionnaire — 9 items evaluating depression severity.</p>
            </div>

            <div className="glass-card selection-card" onClick={() => setSelectedScale('ANXIETY')}>
              <div className="selection-icon">📈</div>
              <h3>GAD-7</h3>
              <p>Generalized Anxiety Disorder — 7 items evaluating anxiety severity.</p>
            </div>

            <div className="glass-card selection-card" onClick={() => setSelectedScale('STRESS')}>
              <div className="selection-icon">⚡</div>
              <h3>Stress Scale</h3>
              <p>Evaluating perceived stress levels over the last month.</p>
            </div>

            <div className="glass-card selection-card" onClick={() => setSelectedScale('ALL')}>
              <div className="selection-icon">🔬</div>
              <h3>Full Assessment</h3>
              <p>Complete evaluation comprising all scales for a total risk profile.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="questionnaire-container">
        {/* Header progress tracking */}
        <div className="glass-card assessment-progress-wrapper">
          <div className="progress-header">
            <span>{selectedScale === 'ALL' ? 'Full Platform' : selectedScale} Assessment</span>
            <span>{getAnsweredCount()} / {questions.length} Answered</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
          </div>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '2rem' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading Questionnaire Questions...
          </div>
        ) : (
          <>
            {questions.map((q, idx) => (
              <div key={q.id} className="glass-card question-card">
                <p className="question-text">
                  {idx + 1}. {q.questionText}
                </p>
                <div className="options-grid">
                  {getOptionsForCategory(q.category).map((opt) => (
                    <div
                      key={opt.score}
                      onClick={() => handleSelectOption(q.id, opt.score, opt.text)}
                      className={`option-button ${answers[q.id]?.score === opt.score ? 'selected' : ''}`}
                    >
                      <span className="option-score">+{opt.score}</span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Notes and feedback */}
            <div className="glass-card question-card">
              <p className="question-text">Additional Notes (Optional)</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Feel free to detail your recent sleep patterns, physical symptoms, or context.
              </p>
              <textarea
                className="form-input"
                style={{ minHeight: '120px', resize: 'vertical' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How have you been feeling lately? Are there specific stressors affecting you?"
              />
            </div>

            {/* Bottom Controls */}
            <div className="assessment-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedScale(null)}
                disabled={submitting}
              >
                Back to Selection
              </button>
              <button
                className="btn-primary"
                disabled={!isFormComplete() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting Responses...' : 'Submit Assessment'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Assessment;
