import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/api';

const ChatContext = createContext(null);

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
};

export const ChatProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: uuidv4(),
      role: 'bot',
      content: "Hello! I'm MindEase, your compassionate AI mental health companion. 💙\n\nThis is a safe, private space to talk about how you're feeling. Everything you share helps me understand your wellbeing better.\n\nHow are you feeling today?",
      timestamp: new Date(),
    },
  ]);
  const [signals, setSignals] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [assessmentReady, setAssessmentReady] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [completedAssessment, setCompletedAssessment] = useState(null);
  const [error, setError] = useState(null);
  const [earlyEndWarning, setEarlyEndWarning] = useState(false);

  // Fetch session list from backend
  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/chat/sessions');
      if (response.data?.data) {
        setSessions(response.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch chat sessions:', err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Load a specific session's history
  const loadSession = useCallback(async (targetSessionId) => {
    setIsTyping(true);
    setError(null);
    try {
      const response = await api.get(`/chat/sessions/${targetSessionId}`);
      const historyMsgs = response.data.data;
      if (historyMsgs && historyMsgs.length > 0) {
        const formatted = historyMsgs.map((m) => {
          let parsedSignals = null;
          if (m.signalsJson) {
            try { parsedSignals = JSON.parse(m.signalsJson); } catch (e) { console.error("Failed to parse signals", e); }
          }
          return {
            id: m.id,
            role: m.sender.toLowerCase(),
            content: m.content,
            timestamp: new Date(m.timestamp),
            signals: parsedSignals,
          };
        });

        setMessages(formatted);
        setSessionId(targetSessionId);

        const lastBotWithSignals = formatted.slice().reverse().find(m => m.signals);
        if (lastBotWithSignals?.signals) {
          setSignals(lastBotWithSignals.signals);
        }
      }
    } catch (err) {
      console.error('Error loading session messages:', err);
      setError('Failed to load conversation history.');
    } finally {
      setIsTyping(false);
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (targetSessionId) => {
    try {
      await api.delete(`/chat/sessions/${targetSessionId}`);
      fetchSessions();
      if (targetSessionId === sessionId) {
        const newId = uuidv4();
        setSessionId(newId);
        setMessages([
          {
            id: uuidv4(),
            role: 'bot',
            content: "Started a new conversation. How are you feeling today?",
            timestamp: new Date(),
          },
        ]);
        setSignals(null);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  }, [sessionId, fetchSessions]);

  // Archive / Unarchive a session
  const archiveSession = useCallback(async (targetSessionId) => {
    try {
      await api.put(`/chat/sessions/${targetSessionId}/archive`);
      fetchSessions();
    } catch (err) {
      console.error('Error archiving session:', err);
    }
  }, [fetchSessions]);

  // Export transcript text for sharing
  const exportSession = useCallback(async (targetSessionId) => {
    try {
      const response = await api.get(`/chat/sessions/${targetSessionId}/export`);
      return response.data?.data || '';
    } catch (err) {
      console.error('Error exporting session:', err);
      return '';
    }
  }, []);

  // Build history in Gemini format from messages
  const buildHistory = useCallback((msgs) => {
    return msgs
      .filter((m) => m.role !== 'system')
      .slice(0, -1)
      .map((m) => ({
        role: m.role === 'bot' ? 'model' : 'user',
        content: m.content,
      }));
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isTyping || sessionComplete) return;

    const userMsg = {
      id: uuidv4(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setError(null);

    try {
      const currentMessages = [...messages, userMsg];
      const history = buildHistory(currentMessages);

      const response = await api.post('/chat/message', {
        message: text.trim(),
        history,
        sessionId,
      });

      const data = response.data.data;

      const botMsg = {
        id: uuidv4(),
        role: 'bot',
        content: data.botMessage,
        timestamp: new Date(),
        signals: data.signals,
      };

      setMessages((prev) => [...prev, botMsg]);
      setSignals(data.signals);
      setAssessmentReady(data.assessmentReady);

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      if (data.crisisDetected) {
        setCrisisDetected(true);
      }

      fetchSessions();

    } catch (err) {
      console.error('Chat error:', err);
      setError('Something went wrong. Please try again.');
      const errMsg = {
        id: uuidv4(),
        role: 'bot',
        content: "I'm sorry, I had trouble connecting. Please try sending your message again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, sessionComplete, messages, buildHistory, sessionId, fetchSessions]);

  // Build minimal fallback signals from conversation text when Gemini hasn't returned
  // structured signals yet (e.g. user ended session very early or API key missing).
  const buildFallbackSignals = useCallback((msgs) => {
    const text = msgs
      .filter((m) => m.role === 'user')
      .map((m) => m.content.toLowerCase())
      .join(' ');

    let dep = 2, anx = 2, stress = 5, sleep = 7, appetite = 7, social = 7;
    if (/sad|hopeless|depress|crying|empty|numb/.test(text)) dep += 5;
    if (/anxious|panic|worry|nervous|scared/.test(text)) anx += 5;
    if (/stress|overwhelm|pressure|burnout/.test(text)) stress += 2;
    if (/can'?t sleep|insomnia|tired|exhausted|no energy/.test(text)) sleep -= 3;
    if (/not eating|no appetite|skip meal/.test(text)) appetite -= 3;
    if (/alone|isolated|lonely|withdrawn|no friends/.test(text)) social -= 3;

    let risk = 'LOW';
    if (dep > 15 || anx > 12) risk = 'HIGH';
    else if (dep > 8 || anx > 7) risk = 'MODERATE';

    return {
      depressionScore: Math.min(27, dep),
      anxietyScore: Math.min(21, anx),
      stressLevel: Math.min(10, stress),
      sleepQuality: Math.max(0, sleep),
      appetiteLevel: Math.max(0, appetite),
      socialEngagement: Math.max(0, social),
      estimatedRiskLevel: risk,
    };
  }, []);

  const completeSession = useCallback(async () => {
    const userMessages = messages.filter((m) => m.role === 'user');

    // Need at least 1 user message to generate any assessment
    if (userMessages.length === 0) {
      setError('Please share how you are feeling before ending the session.');
      return;
    }

    // If signals aren’t ready yet, warn the user but continue with fallback
    const effectiveSignals = signals || buildFallbackSignals(messages);
    if (!signals) {
      setEarlyEndWarning(true);
      setTimeout(() => setEarlyEndWarning(false), 6000);
    }

    setIsTyping(true);
    setError(null);
    try {
      const summary = userMessages
        .slice(-5)
        .map((m) => m.content)
        .join(' | ');

      const response = await api.post('/chat/complete', {
        signals: effectiveSignals,
        conversationSummary: summary || 'Short chat session.',
      });

      setCompletedAssessment(response.data.data);
      setSessionComplete(true);
    } catch (err) {
      console.error('Session complete error:', err);
      setError('Failed to generate your assessment. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }, [signals, messages, buildFallbackSignals]);

  const resetSession = useCallback(async () => {
    const newId = uuidv4();
    setSessionId(newId);
    setMessages([
      {
        id: uuidv4(),
        role: 'bot',
        content: "Hello again! 💙 I'm here whenever you're ready to talk. How are you feeling today?",
        timestamp: new Date(),
      },
    ]);
    setSignals(null);
    setAssessmentReady(false);
    setCrisisDetected(false);
    setSessionComplete(false);
    setCompletedAssessment(null);
    setError(null);
    setEarlyEndWarning(false);
    fetchSessions();
  }, [fetchSessions]);

  return (
    <ChatContext.Provider
      value={{
        sessionId,
        sessions,
        messages,
        signals,
        isTyping,
        assessmentReady,
        crisisDetected,
        sessionComplete,
        completedAssessment,
        error,
        earlyEndWarning,
        sendMessage,
        completeSession,
        resetSession,
        loadSession,
        deleteSession,
        archiveSession,
        exportSession,
        fetchSessions,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
