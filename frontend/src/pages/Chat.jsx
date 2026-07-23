import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChatProvider, useChatContext } from '../context/ChatContext';
import './Chat.css';



const formatTime = (date) => {
  try {
    return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date);
  } catch (e) {
    return '';
  }
};

// ── Sub-components ────────────────────────────────────────────────────



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

const ShareModal = ({ transcript, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `MindEase-Chat-Transcript-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="session-complete-overlay">
      <div className="session-complete-card" style={{ maxWidth: '560px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="session-complete-title" style={{ margin: 0 }}>🔗 Share / Export Transcript</h2>
          <button className="new-chat-btn" onClick={onClose} style={{ padding: '0.2rem 0.6rem' }}>✕</button>
        </div>
        <p className="session-complete-subtitle" style={{ marginBottom: '1rem' }}>
          Formatted conversation transcript ready to copy or download.
        </p>

        <textarea
          readOnly
          value={transcript}
          rows={10}
          className="chat-textarea"
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.3)',
            padding: '0.8rem',
            borderRadius: '12px',
            border: '1px solid var(--border-glass)',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            marginBottom: '1.2rem',
            color: 'var(--text-primary)',
          }}
        />

        <div className="session-complete-actions">
          <button className="btn-secondary" onClick={handleDownload}>
            💾 Download .TXT
          </button>
          <button className="btn-primary" onClick={handleCopy}>
            {copied ? '✅ Copied to Clipboard!' : '📋 Copy Transcript'}
          </button>
        </div>
      </div>
    </div>
  );
};

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
          <button className="btn-secondary" onClick={onNewChat}>
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
    sessionId,
    sessions,
    messages,
    isTyping,
    crisisDetected,
    sessionComplete,
    completedAssessment,
    sendMessage,
    completeSession,
    resetSession,
    loadSession,
    deleteSession,
    archiveSession,
    exportSession,
  } = useChatContext();

  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [shareTranscript, setShareTranscript] = useState(null);
  const [openMenuSessionId, setOpenMenuSessionId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Close 3-dots menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuSessionId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleOpenShare = async () => {
    const text = await exportSession(sessionId);
    setShareTranscript(text);
  };

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'ARCHIVED') return s.status === 'ARCHIVED';
    return s.status !== 'ARCHIVED';
  });



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

        <button className="new-chat-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={resetSession}>
          + New Chat
        </button>

        <div className="sidebar-divider" />

        {/* Saved Chat History Tabs */}
        <div className="signals-panel">
          <div className="history-tab-header">
            <button
              className={`history-tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setActiveTab('ACTIVE')}
            >
              💬 Active
            </button>
            <button
              className={`history-tab-btn ${activeTab === 'ARCHIVED' ? 'active' : ''}`}
              onClick={() => setActiveTab('ARCHIVED')}
            >
              📦 Archived
            </button>
          </div>

          <div className="history-list">
            {filteredSessions.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.4rem 0' }}>
                No {activeTab.toLowerCase()} chats.
              </div>
            ) : (
              filteredSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className={`history-item ${s.sessionId === sessionId ? 'active' : ''}`}
                  onClick={() => loadSession(s.sessionId)}
                >
                  <span className="history-icon">🗨️</span>
                  <div className="history-text">
                    <div className="history-title">{s.title || 'Therapy Session'}</div>
                    <div className="history-meta">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ''}
                    </div>
                  </div>

                  {/* ChatGPT-style 3-dots Menu */}
                  <div className="menu-wrapper" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`dots-btn ${openMenuSessionId === s.sessionId ? 'active' : ''}`}
                      title="Chat options"
                      onClick={() => setOpenMenuSessionId(openMenuSessionId === s.sessionId ? null : s.sessionId)}
                    >
                      •••
                    </button>
                    {openMenuSessionId === s.sessionId && (
                      <div className="session-menu-dropdown">
                        <button
                          className="menu-item"
                          onClick={async () => {
                            setOpenMenuSessionId(null);
                            const text = await exportSession(s.sessionId);
                            setShareTranscript(text);
                          }}
                        >
                          🔗 Share Transcript
                        </button>
                        <button
                          className="menu-item"
                          onClick={() => {
                            setOpenMenuSessionId(null);
                            archiveSession(s.sessionId);
                          }}
                        >
                          {s.status === 'ARCHIVED' ? '📤 Unarchive' : '📦 Archive'}
                        </button>
                        <div className="menu-divider" />
                        <button
                          className="menu-item delete"
                          onClick={() => {
                            setOpenMenuSessionId(null);
                            if (window.confirm('Are you sure you want to delete this chat history?')) {
                              deleteSession(s.sessionId);
                            }
                          }}
                        >
                          🗑️ Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>



        <div className="sidebar-tip">
          🔒 <strong>Privacy note:</strong> Click the <strong>•••</strong> menu on any chat to Archive, Share, or Delete.
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
            <button className="new-chat-btn" onClick={handleOpenShare} title="Share or export transcript">
              🔗 Share / Export
            </button>
            {!sessionComplete && (
              <button
                className="end-session-btn"
                onClick={completeSession}
                disabled={isTyping}
                title="Generate your mental health assessment"
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

      {/* Share Modal */}
      {shareTranscript && (
        <ShareModal
          transcript={shareTranscript}
          onClose={() => setShareTranscript(null)}
        />
      )}

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
