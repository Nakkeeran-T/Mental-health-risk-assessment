import React, { useState, useEffect } from 'react';
import './Breathing.css';

const TECHNIQUES = {
  box: {
    name: 'Box Breathing (Focus & Calm)',
    description: 'Used by elite responders and Navy SEALs for rapid stress relief and situational awareness.',
    steps: [
      { name: 'Breathe In', duration: 4, action: 'expand' },
      { name: 'Hold', duration: 4, action: 'hold-large' },
      { name: 'Breathe Out', duration: 4, action: 'shrink' },
      { name: 'Hold', duration: 4, action: 'hold-small' }
    ]
  },
  relax: {
    name: '4-7-8 Breathing (Deep Relaxation)',
    description: 'Acts as a natural tranquilizer for the nervous system, helping to reduce anxiety and promote sleep.',
    steps: [
      { name: 'Breathe In', duration: 4, action: 'expand' },
      { name: 'Hold', duration: 7, action: 'hold-large' },
      { name: 'Breathe Out', duration: 8, action: 'shrink' }
    ]
  },
  equal: {
    name: 'Equal Breathing (Balance)',
    description: 'Smooths out breathing cycles, balancing energy levels and calming the active mind.',
    steps: [
      { name: 'Breathe In', duration: 5, action: 'expand' },
      { name: 'Breathe Out', duration: 5, action: 'shrink' }
    ]
  }
};

const Breathing = () => {
  const [techKey, setTechKey] = useState('box');
  const [isActive, setIsActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TECHNIQUES.box.steps[0].duration);
  const [cycles, setCycles] = useState(0);

  const currentTech = TECHNIQUES[techKey];
  const currentStep = currentTech.steps[stepIdx];

  // Reset state when technique changes
  useEffect(() => {
    setIsActive(false);
    setStepIdx(0);
    setSecondsLeft(currentTech.steps[0].duration);
    setCycles(0);
  }, [techKey, currentTech]);

  useEffect(() => {
    let timer = null;
    if (isActive) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Move to next step in the cycle
            setStepIdx((currentIdx) => {
              const nextIdx = (currentIdx + 1) % currentTech.steps.length;
              if (nextIdx === 0) {
                setCycles(c => c + 1);
              }
              setSecondsLeft(currentTech.steps[nextIdx].duration);
              return nextIdx;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isActive, currentTech]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setStepIdx(0);
    setSecondsLeft(currentTech.steps[0].duration);
    setCycles(0);
  };

  const getBubbleClass = () => {
    if (!isActive) return 'breathing-bubble idle';
    return `breathing-bubble ${currentStep.action}`;
  };

  const getBubbleStyle = () => {
    if (!isActive) return {};
    return {
      transitionDuration: `${currentStep.duration}s`
    };
  };

  return (
    <div className="main-content">
      <div className="breathing-container">
        <div className="breathing-header">
          <h1>Guided Breathing & Meditation</h1>
          <p className="breathing-subtitle">Regulate your autonomic nervous system using clinical breathing patterns.</p>
        </div>

        <div className="breathing-layout">
          {/* Controls & Selection */}
          <div className="glass-card breathing-config-card">
            <div>
              <h3>Technique Selector</h3>
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label" htmlFor="technique">Select Pattern</label>
                <select 
                  id="technique" 
                  className="form-input select-dark"
                  value={techKey} 
                  onChange={(e) => setTechKey(e.target.value)}
                >
                  {Object.entries(TECHNIQUES).map(([key, tech]) => (
                    <option key={key} value={key}>{tech.name}</option>
                  ))}
                </select>
              </div>
              <p className="tech-desc">{currentTech.description}</p>
            </div>
            
            <div>
              <div className="stats-box-row" style={{ marginTop: '1.5rem' }}>
                <div className="stat-box-mini">
                  <span className="stat-label-mini">Completed Cycles</span>
                  <span className="stat-val-mini">{cycles}</span>
                </div>
                <div className="stat-box-mini">
                  <span className="stat-label-mini">Current Phase</span>
                  <span className="stat-val-mini" style={{ color: 'var(--accent-secondary)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                    {currentStep.name}
                  </span>
                </div>
              </div>

              <div className="breathing-controls" style={{ marginTop: '2rem' }}>
                <button onClick={handleToggle} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {isActive ? 'Pause Exercise' : 'Start Exercise'}
                </button>
                <button onClick={handleReset} className="btn-secondary" style={{ width: '100%', marginTop: '0.8rem' }}>
                  Reset Timer
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Bubble */}
          <div className="glass-card breathing-visual-card">
            <div className="bubble-container">
              <div className={getBubbleClass()} style={getBubbleStyle()}>
                <div className="bubble-text">
                  <span className="bubble-instruction">
                    {isActive ? currentStep.name : 'Ready'}
                  </span>
                  {isActive && <span className="bubble-countdown">{secondsLeft}s</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breathing;
