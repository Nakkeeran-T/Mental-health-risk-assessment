import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import './Assessment.css';

/* ────────────────────────────────────────────────
   Warm, varied transition messages shown between
   questions so the experience feels conversational.
   ──────────────────────────────────────────────── */
const transitionMessages = [
  "Thank you for sharing that.",
  "Your honesty is appreciated — let's keep going.",
  "Noted. Here's the next one.",
  "That's helpful to know.",
  "Thanks for that. Moving on.",
  "Understood — let's continue.",
  "Got it. One more step forward.",
  "Great, let's carry on.",
  "Thank you. Here comes the next one.",
  "Appreciate your openness. Let's continue.",
  "Every answer helps. Here's the next question.",
  "That's noted. Let's move forward together.",
];

const encouragementMessages = [
  "Take your time — there's no rush.",
  "Choose the answer that feels closest right now.",
  "Go with what feels most accurate lately.",
  "There's no right or wrong here.",
  "Think about the past two weeks.",
  "Just reflect honestly — that's all that matters.",
  "Trust your first instinct.",
  "Consider how you've felt most days recently.",
];

const pickRandom = (arr, avoid) => {
  let pick;
  do { pick = arr[Math.floor(Math.random() * arr.length)]; } while (pick === avoid && arr.length > 1);
  return pick;
};

/* ────────── Component ────────── */
const Assessment = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [selectedScale, setSelectedScale] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 = intro screen
  const [slideDirection, setSlideDirection] = useState('in');
  const [transitionText, setTransitionText] = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const lastTransition = useRef('');
  const lastEncouragement = useRef('');
  const cardRef = useRef(null);

  // Likert scales
  const standardOptions = [
    { score: 0, text: 'Not at all' },
    { score: 1, text: 'Several days' },
    { score: 2, text: 'More than half the days' },
    { score: 3, text: 'Nearly every day' },
  ];

  const stressOptions = [
    { score: 0, text: 'Never' },
    { score: 1, text: 'Almost Never' },
    { score: 2, text: 'Sometimes' },
    { score: 3, text: 'Fairly Often' },
    { score: 4, text: 'Very Often' },
  ];

  /* ── Fetch questions ── */
  useEffect(() => {
    if (selectedScale) {
      const fetchQuestions = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await api.get('/questions/personalized');
          const allQuestions = (res.data.data || []).map(q => ({
            id: q.questionId ?? q.id,
            questionText: q.variationText ?? q.questionText,
            category: q.category,
            orderNumber: q.orderNumber,
          }));

          let filtered = [];
          if (selectedScale === 'ALL') {
            filtered = allQuestions;
          } else {
            filtered = allQuestions.filter(q => q.category === selectedScale);
          }

          setQuestions(filtered);
          const initialAnswers = {};
          filtered.forEach(q => { initialAnswers[q.id] = null; });
          setAnswers(initialAnswers);
          setCurrentQuestionIndex(-1); // show intro first
          setNotes('');
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

  /* ── Pick encouragement on question change ── */
  useEffect(() => {
    const msg = pickRandom(encouragementMessages, lastEncouragement.current);
    setEncouragement(msg);
    lastEncouragement.current = msg;
  }, [currentQuestionIndex]);

  /* ── Helpers ── */
  const getOptionsForCategory = (category) =>
    category === 'STRESS' ? stressOptions : standardOptions;

  const getAnsweredCount = () =>
    Object.values(answers).filter(v => v !== null).length;

  const getProgressPercentage = () => {
    if (questions.length === 0) return 0;
    return (getAnsweredCount() / questions.length) * 100;
  };

  const isFormComplete = () =>
    questions.length > 0 && getAnsweredCount() === questions.length;

  const currentQuestion = questions[currentQuestionIndex];
  const isIntroStep = currentQuestionIndex === -1;
  const isNotesStep = questions.length > 0 && currentQuestionIndex >= questions.length;

  /* ── Transition helper ── */
  const animateNext = (nextIndex) => {
    setSlideDirection('out');
    setTimeout(() => {
      setCurrentQuestionIndex(nextIndex);
      setSlideDirection('in');
    }, 350);
  };

  const showTransitionThenAdvance = (nextIdx) => {
    const msg = pickRandom(transitionMessages, lastTransition.current);
    lastTransition.current = msg;
    setTransitionText(msg);

    // first slide question out
    setSlideDirection('out');
    setTimeout(() => {
      setShowTransition(true);   // show transition card
      setTimeout(() => {
        setShowTransition(false);
        setCurrentQuestionIndex(nextIdx);
        setSlideDirection('in');
      }, 1200);                   // transition visible for 1.2 s
    }, 350);
  };

  /* ── Navigation ── */
  const handleSelectOption = (questionId, score, responseText) => {
    setError('');
    setAnswers(prev => ({
      ...prev,
      [questionId]: { score, responseText },
    }));
  };

  const handleContinue = () => {
    if (isIntroStep) {
      animateNext(0);
      return;
    }
    if (!currentQuestion || !answers[currentQuestion.id]) {
      setError('Choose the answer that feels closest right now.');
      return;
    }
    setError('');
    const nextIdx = Math.min(currentQuestionIndex + 1, questions.length);
    showTransitionThenAdvance(nextIdx);
  };

  const handleBack = () => {
    setError('');
    if (isIntroStep) {
      setSelectedScale(null);
      return;
    }
    const prevIdx = currentQuestionIndex - 1;
    setSlideDirection('out');
    setTimeout(() => {
      setCurrentQuestionIndex(prevIdx);
      setSlideDirection('in');
    }, 300);
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');

    const payload = {
      notes,
      answers: Object.entries(answers).map(([qId, val]) => ({
        questionId: parseInt(qId),
        score: val.score,
        responseText: val.responseText,
      })),
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

  /* ────────── SCALE SELECTION SCREEN ────────── */
  if (!selectedScale) {
    return (
      <div className="main-content">
        <div className="assessment-selection">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              Select Assessment Questionnaire
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Choose a clinical assessment scale to measure your current risk profile.
            </p>
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

  /* ────────── CONVERSATIONAL FLOW ────────── */
  const scaleName =
    selectedScale === 'ALL' ? 'Full check-in' : `${selectedScale.charAt(0) + selectedScale.slice(1).toLowerCase()} check-in`;

  const visibleStep = isIntroStep ? 0 : Math.min(currentQuestionIndex + 1, questions.length);

  return (
    <div className="main-content conversation-assessment">
      <div className="questionnaire-container">
        {/* ── Progress bar ── */}
        {!isIntroStep && (
          <div className="glass-card assessment-progress-wrapper">
            <div className="progress-header">
              <span>{scaleName}</span>
              <span>{visibleStep} of {questions.length}</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${getProgressPercentage()}%` }} />
            </div>
          </div>
        )}

        {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {loading ? (
          <div className="conversation-loading">
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
            <p>Preparing your check-in…</p>
          </div>
        ) : (
          <>
            {/* ── TRANSITION TEXT (shows briefly between questions) ── */}
            {showTransition && (
              <div className="conversation-transition" key="transition">
                <p className="transition-text">{transitionText}</p>
              </div>
            )}

            {/* ── INTRO STEP ── */}
            {!showTransition && isIntroStep && (
              <div className={`conversation-intro slide-${slideDirection}`} ref={cardRef}>
                <div className="intro-icon">🌿</div>
                <h2 className="intro-heading">Before we begin</h2>
                <p className="intro-body">
                  This check-in is a simple series of questions — you'll see them one at a time.
                  There are no right or wrong answers. Just choose what feels closest to your
                  experience over the past couple of weeks.
                </p>
                <p className="intro-body-secondary">
                  Take as much time as you need. You can always go back to change an answer.
                </p>
              </div>
            )}

            {/* ── QUESTION STEP ── */}
            {!showTransition && !isIntroStep && !isNotesStep && currentQuestion && (
              <div className={`glass-card question-card conversation-card slide-${slideDirection}`} ref={cardRef}>
                <p className="conversation-kicker">{encouragement}</p>
                <p className="question-text">{currentQuestion.questionText}</p>
                <div className="options-grid">
                  {getOptionsForCategory(currentQuestion.category).map((opt) => (
                    <div
                      key={opt.score}
                      onClick={() => handleSelectOption(currentQuestion.id, opt.score, opt.text)}
                      className={`option-button ${answers[currentQuestion.id]?.score === opt.score ? 'selected' : ''}`}
                    >
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── NOTES STEP ── */}
            {!showTransition && isNotesStep && (
              <div className={`glass-card question-card conversation-card slide-${slideDirection}`} ref={cardRef}>
                <div className="notes-step-icon">✍️</div>
                <p className="conversation-kicker">You've answered everything — well done.</p>
                <p className="question-text">Is there anything else you'd like to share?</p>
                <p className="gentle-note">
                  This is completely optional. You can add some context, leave a short note, or
                  skip this step entirely.
                </p>
                <textarea
                  className="form-input"
                  style={{ minHeight: '140px', resize: 'vertical' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write anything that feels important…"
                />
              </div>
            )}

            {/* ── BOTTOM CONTROLS ── */}
            {!showTransition && (
              <div className="assessment-footer">
                <button
                  className="btn-secondary"
                  onClick={handleBack}
                  disabled={submitting}
                >
                  {isIntroStep ? '← Back to scales' : '← Previous'}
                </button>

                {isNotesStep ? (
                  <button
                    className="btn-primary"
                    disabled={!isFormComplete() || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Saving…' : 'Finish & view results'}
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    disabled={(!isIntroStep && (!currentQuestion || !answers[currentQuestion?.id])) || submitting}
                    onClick={handleContinue}
                  >
                    {isIntroStep
                      ? "I'm ready — let's start"
                      : currentQuestionIndex === questions.length - 1
                        ? 'Almost there →'
                        : "Let's continue →"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Assessment;
