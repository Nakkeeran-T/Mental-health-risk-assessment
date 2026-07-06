import React from 'react';
import { Link } from 'react-router-dom';
import './Crisis.css';

const HOTLINES = [
  {
    name: 'iCall — TISS',
    number: '9152987821',
    description: 'Psychological counselling by trained professionals. India\'s most trusted crisis line.',
    hours: 'Mon–Sat, 8am–10pm',
    icon: '📞'
  },
  {
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    description: '24/7 mental health helpline offering free counselling and crisis support.',
    hours: '24 hours / 7 days',
    icon: '🆘'
  },
  {
    name: 'SNEHI',
    number: '044-24640050',
    description: 'Emotional support and suicide prevention. Trained volunteers available.',
    hours: '24 hours / 7 days',
    icon: '💚'
  },
  {
    name: 'Fortis SLAM',
    number: '8376804102',
    description: 'Stress, anxiety, and mental health support from Fortis Healthcare.',
    hours: 'Mon–Sat, 9am–6pm',
    icon: '🏥'
  }
];

const SELF_HELP_STEPS = [
  { icon: '🌬️', title: 'Breathe', desc: 'Try the 4-7-8 breathing technique. Breathe in 4s, hold 7s, exhale 8s. Repeat 4 times.', link: '/breathing', linkLabel: 'Open Breathing Tool' },
  { icon: '🔵', title: 'Ground Yourself', desc: 'Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.', link: null, linkLabel: null },
  { icon: '📓', title: 'Write it Out', desc: 'Journal what you\'re feeling without judgment. Getting thoughts on paper reduces their intensity.', link: '/journal', linkLabel: 'Open Journal' },
  { icon: '🚶', title: 'Move Your Body', desc: 'A short 5-10 minute walk resets your nervous system and improves mood through endorphins.', link: null, linkLabel: null },
  { icon: '🤝', title: 'Reach Out', desc: 'Tell someone you trust what you\'re going through. You don\'t have to carry this alone.', link: null, linkLabel: null }
];

const Crisis = () => {
  return (
    <div className="main-content">
      <div className="crisis-container">

        {/* Emergency Banner */}
        <div className="crisis-emergency-banner">
          <div className="crisis-emergency-icon">🚨</div>
          <div>
            <h2>If you are in immediate danger</h2>
            <p>Please call <strong>112</strong> (Emergency) or go to your nearest hospital emergency department immediately.</p>
          </div>
        </div>

        {/* Header */}
        <div className="crisis-header">
          <h1>💙 Crisis Support & Resources</h1>
          <p className="crisis-subtitle">
            You are not alone. Reaching out is a sign of strength. Below are trusted mental health
            helplines and self-help techniques to help you through a difficult moment.
          </p>
        </div>

        {/* Hotlines Grid */}
        <section>
          <h2 className="section-title">📞 Mental Health Helplines (India)</h2>
          <div className="hotlines-grid">
            {HOTLINES.map((h, i) => (
              <div key={i} className="glass-card hotline-card">
                <div className="hotline-icon">{h.icon}</div>
                <div className="hotline-info">
                  <h3>{h.name}</h3>
                  <a href={`tel:${h.number}`} className="hotline-number">{h.number}</a>
                  <p>{h.description}</p>
                  <span className="hotline-hours">⏰ {h.hours}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Self-Help Steps */}
        <section>
          <h2 className="section-title">🛠️ Immediate Self-Help Techniques</h2>
          <div className="self-help-steps">
            {SELF_HELP_STEPS.map((step, i) => (
              <div key={i} className="glass-card self-help-card">
                <div className="self-help-number">{i + 1}</div>
                <div className="self-help-icon">{step.icon}</div>
                <div className="self-help-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  {step.link && (
                    <Link to={step.link} className="self-help-link">
                      {step.linkLabel} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reassurance Card */}
        <div className="glass-card crisis-reassurance-card">
          <div className="reassurance-icon">💜</div>
          <div>
            <h3>Remember</h3>
            <p>
              Mental health struggles are real medical conditions, not weaknesses. What you are
              feeling right now is temporary. Millions of people have walked through dark moments
              and found their way back. You deserve support, care, and healing.
            </p>
          </div>
        </div>

        {/* Back to dashboard */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/dashboard" className="btn-secondary">
            ← Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Crisis;
