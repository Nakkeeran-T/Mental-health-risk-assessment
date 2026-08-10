import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChatProvider, useChatContext } from '../context/ChatContext';
import './Chat.css';

// ── SVG Icons ────────────────────────────────────────────────────────
const SparklesIcon = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

const ShieldIcon = ({ className = '', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const SearchIcon = ({ className = '', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);


const SendIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/>
    <path d="M22 2 11 13"/>
  </svg>
);

const CopyIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

const CheckIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const ExportIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const PlusIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="M12 5v14"/>
  </svg>
);

const ReportIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const MessageSquareIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ArchiveIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="5" x="2" y="3" rx="1"/>
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>
    <path d="M10 12h4"/>
  </svg>
);

const TrashIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const AlertTriangleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const UserIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ActivityIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const DownloadIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const formatTime = (date) => {
  try {
    return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date);
  } catch (e) {
    return '';
  }
};

// ── Formatted Bot Response ─────────────────────────────────────────────
function formatInlineText(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

const FormattedBotContent = ({ content }) => {
  if (!content) return null;

  const blocks = content.split(/\n\n+/);

  return (
    <div className="formatted-bot-content">
      {blocks.map((block, idx) => {
        const lines = block.split('\n').filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => /^[\*\-•\d+\.]\s/.test(l.trim()));

        if (isList) {
          return (
            <ul key={idx} className="bot-message-list">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[\*\-•\d+\.]\s*/, '');
                return (
                  <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineText(cleanLine) }} />
                );
              })}
            </ul>
          );
        }

        return (
          <p key={idx} className="bot-message-paragraph">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                <span dangerouslySetInnerHTML={{ __html: formatInlineText(line) }} />
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div className="typing-row">
    <div className="message-avatar bot">
      <SparklesIcon size={16} />
    </div>
    <div className="typing-bubble">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  </div>
);

const CrisisBanner = () => (
  <div className="crisis-banner">
    <div className="crisis-banner-icon-badge">
      <AlertTriangleIcon size={20} />
    </div>
    <div className="crisis-banner-text">
      <div className="crisis-banner-header">Emergency & Crisis Resources Available 24/7</div>
      <div className="crisis-banner-body">
        If you or someone you know is in immediate distress:
        <strong>iCall: 9152987821</strong> &nbsp;|&nbsp;
        <strong>Vandrevala Foundation: 1860-2662-345</strong> &nbsp;|&nbsp;
        <strong>AASRA: 9820466627</strong>.
      </div>
      <Link to="/crisis" className="crisis-banner-link">
        Access Complete Crisis Resource Directory →
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
    element.download = `MindEase-Session-Transcript-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="session-complete-overlay">
      <div className="session-complete-card share-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <ExportIcon size={18} />
            </div>
            <div>
              <h2 className="session-complete-title">Session Transcript</h2>
              <div className="modal-subtitle">Export or copy conversation history for your records</div>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <textarea
          readOnly
          value={transcript}
          rows={10}
          className="chat-textarea transcript-textarea"
        />

        <div className="session-complete-actions">
          <button className="btn-secondary" onClick={handleDownload}>
            <DownloadIcon size={15} /> Download .TXT
          </button>
          <button className="btn-primary" onClick={handleCopy}>
            {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Transcript'}
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
        <div className="assessment-complete-icon-ring">
          <SparklesIcon size={32} />
        </div>
        <h2 className="session-complete-title">Evaluation Complete</h2>
        <p className="session-complete-subtitle">
          Your mental health evaluation has been analyzed and recorded securely.
        </p>

        <div className="assessment-result-box">
          <div className="assessment-result-row">
            <span className="assessment-result-label">Overall Risk Level</span>
            <span className={`risk-badge-lg ${riskLevel}`}>
              <span className="risk-indicator-dot" />
              {riskLevel}
            </span>
          </div>
          {assessment?.totalScore != null && (
            <div className="assessment-result-row">
              <span className="assessment-result-label">Clinical Severity Score</span>
              <span className="assessment-result-value">{assessment.totalScore} / 27</span>
            </div>
          )}
          {assessment?.createdAt && (
            <div className="assessment-result-row">
              <span className="assessment-result-label">Completed Timestamp</span>
              <span className="assessment-result-value">
                {new Date(assessment.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          )}
        </div>

        <div className="session-complete-actions">
          <button className="btn-secondary" onClick={onNewChat}>
            <PlusIcon size={15} /> Start New Chat
          </button>
          {assessment?.id && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/results/${assessment.id}`)}
            >
              <ReportIcon size={15} /> View Clinical Report →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SuggestionCards = ({ onSelect }) => {
  const suggestions = [
    {
      title: "Work & Daily Overwhelm",
      desc: "I've been feeling stressed and overwhelmed with my daily tasks.",
      prompt: "I've been feeling overwhelmed with my responsibilities and stress lately. Can you help me unpack what I'm feeling?",
    },
    {
      title: "Anxiety & Grounding",
      desc: "I need help calming down from anxious thoughts.",
      prompt: "I'm experiencing anxiety right now. Could you guide me through a quick grounding exercise to help me center myself?",
    },
    {
      title: "Restlessness & Sleep",
      desc: "Racing thoughts are keeping me awake at night.",
      prompt: "I'm having trouble unwinding and sleeping because my mind keeps racing with worries.",
    },
    {
      title: "Emotional Wellness Check",
      desc: "I want to track and evaluate my current mood.",
      prompt: "I'd like to do a mental health check-in to reflect on how I've been feeling mentally and emotionally.",
    },
  ];

  return (
    <div className="welcome-hero-container">
      <div className="welcome-hero-badge">
        <SparklesIcon size={15} />
        <span>Aegis Clinical AI Support Model v2.4</span>
      </div>
      <h1 className="welcome-hero-title">How can I support your wellbeing today?</h1>
      <p className="welcome-hero-subtitle">
        Share your thoughts freely. MindEase offers an empathetic, confidential space for emotional reflection, distress management, and mental health assessment.
      </p>

      <div className="suggestion-cards-grid">
        {suggestions.map((item, index) => (
          <button
            key={index}
            className="suggestion-card"
            onClick={() => onSelect(item.prompt)}
          >
            <div className="suggestion-card-header">
              <span className="suggestion-card-title">{item.title}</span>
              <span className="suggestion-card-arrow">↗</span>
            </div>
            <div className="suggestion-card-desc">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const MessageItem = ({ msg }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`message-row ${msg.role}`}>
      <div className={`message-avatar ${msg.role}`}>
        {msg.role === 'bot' ? (
          <SparklesIcon size={16} />
        ) : (
          <UserIcon size={15} />
        )}
      </div>
      <div className="message-content">
        <div className={`message-bubble ${msg.role} ${msg.isError ? 'error' : ''}`}>
          {msg.role === 'bot' ? (
            <FormattedBotContent content={msg.content} />
          ) : (
            msg.content
          )}
        </div>
        <div className="message-footer">
          <span className="message-time">{formatTime(new Date(msg.timestamp))}</span>
          {msg.role === 'bot' && !msg.isError && (
            <button
              className="message-action-btn"
              onClick={handleCopy}
              title={copied ? "Copied to clipboard" : "Copy message"}
            >
              {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              <span>{copied ? "Copied" : "Copy"}</span>
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
    signals,
    isTyping,
    crisisDetected,
    sessionComplete,
    completedAssessment,
    earlyEndWarning,
    error,
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSend = useCallback((textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;
    sendMessage(messageText);
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

  const activeCount = sessions.filter((s) => s.status !== 'ARCHIVED').length;
  const archivedCount = sessions.filter((s) => s.status === 'ARCHIVED').length;

  const filteredSessions = sessions.filter((s) => {
    const matchesTab = activeTab === 'ARCHIVED' ? s.status === 'ARCHIVED' : s.status !== 'ARCHIVED';
    const matchesSearch = !searchQuery.trim() || (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const isFirstGreetingOnly = messages.length <= 1 && messages[0]?.role === 'bot';

  return (
    <div className="chat-page">
      {/* ── Sidebar ── */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-icon">
            <SparklesIcon size={22} />
          </div>
          <div>
            <div className="chat-sidebar-title">MindEase AI</div>
            <div className="chat-sidebar-subtitle">Clinical Companion</div>
          </div>
        </div>

        <button className="new-chat-btn-sidebar" onClick={resetSession}>
          <PlusIcon size={16} /> New Session
        </button>


        <div className="sidebar-divider" />

        {/* Chat History Panel */}
        <div className="history-panel">
          <div className="history-panel-header">
            <span className="history-panel-title">Conversation History</span>
          </div>

          <div className="history-search-wrapper">
            <SearchIcon size={13} className="search-input-icon" />
            <input
              type="text"
              className="history-search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <div className="history-tab-header">
            <button
              className={`history-tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setActiveTab('ACTIVE')}
            >
              <MessageSquareIcon size={13} /> Active ({activeCount})
            </button>
            <button
              className={`history-tab-btn ${activeTab === 'ARCHIVED' ? 'active' : ''}`}
              onClick={() => setActiveTab('ARCHIVED')}
            >
              <ArchiveIcon size={13} /> Archived ({archivedCount})
            </button>
          </div>


          <div className="chat-history-list">
            {filteredSessions.length === 0 ? (
              <div className="history-empty-state">
                No {activeTab.toLowerCase()} sessions.
              </div>
            ) : (
              filteredSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className={`history-item ${s.sessionId === sessionId ? 'active' : ''}`}
                  onClick={() => loadSession(s.sessionId)}
                >
                  <span className="history-icon">
                    <MessageSquareIcon size={14} />
                  </span>
                  <div className="history-text">
                    <div className="history-title">{s.title || 'Therapy Session'}</div>
                    <div className="history-meta">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    </div>
                  </div>

                  {/* 3-dots Context Menu */}
                  <div className="menu-wrapper" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`dots-btn ${openMenuSessionId === s.sessionId ? 'active' : ''}`}
                      title="Options"
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
                          <ExportIcon size={13} /> Export Transcript
                        </button>
                        <button
                          className="menu-item"
                          onClick={() => {
                            setOpenMenuSessionId(null);
                            archiveSession(s.sessionId);
                          }}
                        >
                          <ArchiveIcon size={13} />
                          {s.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                        </button>
                        <div className="menu-divider" />
                        <button
                          className="menu-item delete"
                          onClick={() => {
                            setOpenMenuSessionId(null);
                            if (window.confirm('Delete this conversation history permanently?')) {
                              deleteSession(s.sessionId);
                            }
                          }}
                        >
                          <TrashIcon size={13} /> Delete Session
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
          <ShieldIcon size={14} className="sidebar-tip-icon" />
          <div>
            <strong>End-to-End Privacy:</strong> All conversation data is encrypted and confidential.
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">
              <SparklesIcon size={18} />
              <div className="online-dot" />
            </div>
            <div>
              <div className="chat-header-name">
                MindEase AI Companion
                <span className="security-badge">
                  <ShieldIcon size={11} /> Encrypted
                </span>
              </div>
              <div className="chat-header-status">
                {isTyping ? 'Analyzing response…' : 'Active — Therapeutic & Assessment Support'}
              </div>
            </div>
          </div>

          <div className="chat-header-actions">
            <button className="header-action-btn" onClick={handleOpenShare} title="Export or share transcript">
              <ExportIcon size={14} /> Export
            </button>
            {!sessionComplete && (
              <button
                className="end-session-btn"
                onClick={completeSession}
                disabled={isTyping}
                title={userMessageCount === 0
                  ? 'Share how you feel to enable evaluation'
                  : 'Generate clinical assessment report'}
              >
                <ReportIcon size={14} />
                <span>Complete Evaluation</span>
                {userMessageCount > 0 && userMessageCount < 8 && (
                  <span className="turns-badge">({userMessageCount}/8 turns)</span>
                )}
              </button>
            )}
            <button className="header-action-btn primary" onClick={resetSession}>
              <PlusIcon size={14} /> New Chat
            </button>
          </div>
        </div>

        {/* Early-end warning toast */}
        {earlyEndWarning && (
          <div className="warning-toast">
            <AlertTriangleIcon size={16} />
            <span>Assessment generated from early conversation. For maximum clinical accuracy, engage in a longer dialogue.</span>
          </div>
        )}

        {/* Context error banner */}
        {error && (
          <div className="error-toast">
            <AlertTriangleIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Crisis banner */}
        {crisisDetected && <CrisisBanner />}

        {/* Messages Container */}
        <div className="chat-messages">
          {isFirstGreetingOnly && (
            <SuggestionCards onSelect={(promptText) => handleSend(promptText)} />
          )}

          {messages.map((msg) => (
            <MessageItem key={msg.id} msg={msg} />
          ))}

          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder={
                sessionComplete
                  ? 'Session evaluation complete. Start a new chat to continue.'
                  : 'Describe how you\'re feeling or what\'s on your mind… (Enter to send, Shift+Enter for new line)'
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
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping || sessionComplete}
              title="Send message"
              id="chat-send-btn"
            >
              <SendIcon size={17} />
            </button>
          </div>
          <div className="input-hint">
            <ShieldIcon size={12} /> Confidential & Encrypted Session &nbsp;·&nbsp; Powered by Aegis Clinical AI Model
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

      {/* Session Complete Modal */}
      {sessionComplete && completedAssessment && (
        <SessionCompleteModal
          assessment={completedAssessment}
          onNewChat={resetSession}
        />
      )}
    </div>
  );
};

// ── Page Wrapper ──────────────────────────────────────────────────────

const Chat = () => (
  <ChatProvider>
    <ChatUI />
  </ChatProvider>
);

export default Chat;
