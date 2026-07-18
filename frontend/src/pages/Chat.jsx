import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChatProvider, useChatContext } from '../context/ChatContext';
import './Chat.css';

// ── Signal helpers ────────────────────────────────────────────────────

const getBarClass = (value, max) => {
  const pct = (value / max) * 100;
  if (pct < 35) return 'good';
  if (pct < 65) return 'warning';
  return 'danger';
};

const invertBarClass = (value, max) => {
  // For positive dimensions (sleep, appetite, social), invert: high = good
  const pct = (value / max) * 100;
  if (pct >= 65) return 'good';
  if (pct >= 35) return 'warning';
  return 'danger';
};

const formatTime = (date) => {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date);
};

// ── Sub-components ────────────────────────────────────────────────────

const SignalBar = ({ label, icon, value, max, invert = false }) => {
  const pct = value != null ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const cls = invert ? invertBarClass(value ?? 0, max) : getBarClass(value ?? 0, max);

  return (
    <div className="signal-row">
      <span className="signal-label">
        {icon} {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div className="signal-bar-wrapper">
          <div
            className={`signal-bar-fill ${cls}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="signal-value">{value ?? '–'}</span>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="typing-row">
    <div className="message-avatar bot">🤖</div>
    <div className="typing-bubble">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  </div>
);

const CrisisBanner = () => (
  <div className="crisis-banner">
    <span className="crisis-banner-icon">🆘</span>
    <div className="crisis-banner-text">
      <strong>If you're in crisis, please reach out immediately:</strong>
      iCall: <strong>9152987821</strong> &nbsp;|&nbsp;
      Vandrevala Foundation: <strong>1860-2662-345</strong> &nbsp;|&nbsp;
      AASRA: <strong>9820466627</strong>. You matter and help is available.{' '}
      <Link to="/crisis" style={{ color: 'inherit', textDecoration: 'underline' }}>
        See all crisis resources →
      </Link>
    </div>
  </div>
);

const SessionCompleteModal = ({ assessment, onNewChat }) => {
  const navigate = useNavigate();
  const riskLevel = assessment?.riskLevel ?? 'MODERATE';

  return (
    <div className="session-complete-overlay">
      <div className="session-complete-card">
        <span className="session-complete-icon">🧠</span>
        <h2 className="session-complete-title">Assessment Complete</h2>
        <p className="session-complete-subtitle">
          Your mental health evaluation has been recorded based on our conversation.
        </p>

        <div className="assessment-result-box">
          <div className="assessment-result-row">
            <span className="assessment-result-label">Overall Risk Level</span>
            <span className={`risk-badge-lg ${riskLevel}`}>
              {riskLevel === 'LOW' && '✅ '}
              {riskLevel === 'MODERATE' && '⚠️ '}
              {riskLevel === 'HIGH' && '🔶 '}
              {riskLevel === 'CRITICAL' && '🚨 '}
              {riskLevel}
            </span>
          </div>
          {assessment?.totalScore != null && (
            <div className="assessment-result-row">
              <span className="assessment-result-label">Total Score</span>
              <span className="assessment-result-value">{assessment.totalScore}</span>
            </div>
          )}
          {assessment?.createdAt && (
            <div className="assessment-result-row">
              <span className="assessment-result-label">Session Date</span>
              <span className="assessment-result-value">
                {new Date(assessment.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="session-complete-actions">
          <button
            className="btn-secondary"
            onClick={onNewChat}
          >
            New Chat
          </button>
          {assessment?.id && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/results/${assessment.id}`)}
            >
              View Full Report →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Chat UI ──────────────────────────────────────────────────────

const ChatUI = () => {
  const {
    messages,
    signals,
    isTyping,
    assessmentReady,
    crisisDetected,
    sessionComplete,
    completedAssessment,
    sendMessage,
    completeSession,
    resetSession,
  } = useChatContext();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const turnsCompleted = signals?.turnsCompleted ?? 0;
  const progressPct = Math.min(100, Math.round((turnsCompleted / 8) * 100));

  return (
    <div className="chat-page">
      {/* ── Sidebar ── */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-icon">🧠</div>
          <div>
            <div className="chat-sidebar-title">MindEase AI</div>
            <div className="chat-sidebar-subtitle">Mental Health Companion</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Session progress */}
        <div className="signals-panel">
          <div className="signals-panel-title">📊 Session Progress</div>
          <div className="signal-row">
            <span className="signal-label">💬 Conversation depth</span>
            <span className="signal-value">{turnsCompleted}/8</span>
          </div>
          <div className="signal-bar-wrapper" style={{ width: '100%', height: '6px', marginBottom: '0.5rem' }}>
            <div
              className="signal-bar-fill good"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}
            />
          </div>
          {assessmentReady && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-low)', marginTop: '0.25rem' }}>
              ✅ Enough data for assessment
            </div>
          )}
        </div>

        {/* Mental health signals */}
        {signals && (
          <div className="signals-panel">
            <div className="signals-panel-title">🔍 Mental Health Signals</div>
            <SignalBar
              label="Depression"
              icon="😔"
              value={signals.depressionScore}
              max={27}
            />
            <SignalBar
              label="Anxiety"
              icon="😰"
              value={signals.anxietyScore}
              max={21}
            />
            <SignalBar
              label="Stress"
              icon="😤"
              value={signals.stressLevel}
              max={10}
            />
            <SignalBar
              label="Sleep Quality"
              icon="😴"
              value={signals.sleepQuality}
              max={10}
              invert
            />
            <SignalBar
              label="Appetite"
              icon="🍽️"
              value={signals.appetiteLevel}
              max={10}
              invert
            />
            <SignalBar
              label="Social"
              icon="👥"
              value={signals.socialEngagement}
              max={10}
              invert
            />
            {signals.estimatedRiskLevel && (
              <div style={{ marginTop: '0.75rem' }}>
                <div
                  className={`risk-badge-lg ${signals.estimatedRiskLevel}`}
                >
                  Estimated: {signals.estimatedRiskLevel}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="sidebar-tip">
          💡 <strong>Privacy note:</strong> This conversation is private and used only to help
          evaluate your mental wellbeing. Be honest for the most accurate results.
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">
              🤖
              <div className="online-dot" />
            </div>
            <div>
              <div className="chat-header-name">MindEase AI</div>
              <div className="chat-header-status">
                {isTyping ? 'Thinking...' : 'Online — here to listen'}
              </div>
            </div>
          </div>
          <div className="chat-header-actions">
            {!sessionComplete && (
              <button
                className="end-session-btn"
                onClick={completeSession}
                disabled={!assessmentReady || isTyping}
                title={assessmentReady ? 'Generate your mental health assessment' : 'Continue chatting to gather more data'}
              >
                📋 End Session & Get Analysis
              </button>
            )}
            <button className="new-chat-btn" onClick={resetSession}>
              + New Chat
            </button>
          </div>
        </div>

        {/* Crisis banner */}
        {crisisDetected && <CrisisBanner />}

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.role}`}>
              <div className={`message-avatar ${msg.role}`}>
                {msg.role === 'bot' ? '🤖' : '👤'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className={`message-bubble ${msg.role} ${msg.isError ? 'error' : ''}`}>
                  {msg.content}
                </div>
                <div className="message-time">{formatTime(new Date(msg.timestamp))}</div>
              </div>
            </div>
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder={
                sessionComplete
                  ? 'Session complete. Start a new chat to continue.'
                  : 'Share how you\'re feeling… (Enter to send, Shift+Enter for new line)'
              }
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isTyping || sessionComplete}
              rows={1}
              id="chat-input"
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isTyping || sessionComplete}
              title="Send message"
              id="chat-send-btn"
            >
              ➤
            </button>
          </div>
          <div className="input-hint">
            🔒 Private & Confidential &nbsp;·&nbsp; Powered by Google Gemini AI
          </div>
        </div>
      </div>

      {/* Session complete modal */}
      {sessionComplete && completedAssessment && (
        <SessionCompleteModal
          assessment={completedAssessment}
          onNewChat={resetSession}
        />
      )}
    </div>
  );
};

// ── Page wrapper ──────────────────────────────────────────────────────

const Chat = () => (
  <ChatProvider>
    <ChatUI />
  </ChatProvider>
);

export default Chat;
