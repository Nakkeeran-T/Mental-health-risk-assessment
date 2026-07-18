import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/api';

const ChatContext = createContext(null);

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
};

export const ChatProvider = ({ children }) => {
  const [sessionId] = useState(() => uuidv4());
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

  // Build history in Gemini format from messages
  const buildHistory = useCallback((msgs) => {
    return msgs
      .filter((m) => m.role !== 'system')
      .slice(0, -1) // exclude the very last message (current user turn)
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
      };

      setMessages((prev) => [...prev, botMsg]);
      setSignals(data.signals);
      setAssessmentReady(data.assessmentReady);

      if (data.crisisDetected) {
        setCrisisDetected(true);
      }
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
  }, [isTyping, sessionComplete, messages, buildHistory, sessionId]);

  const completeSession = useCallback(async () => {
    if (!signals) return;
    setIsTyping(true);
    try {
      const userMessages = messages.filter((m) => m.role === 'user');
      const summary = userMessages
        .slice(-3)
        .map((m) => m.content)
        .join(' | ');

      const response = await api.post('/chat/complete', {
        signals,
        conversationSummary: summary,
      });

      setCompletedAssessment(response.data.data);
      setSessionComplete(true);
    } catch (err) {
      console.error('Session complete error:', err);
      setError('Failed to generate your assessment. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }, [signals, messages]);

  const resetSession = useCallback(() => {
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
  }, []);

  return (
    <ChatContext.Provider
      value={{
        sessionId,
        messages,
        signals,
        isTyping,
        assessmentReady,
        crisisDetected,
        sessionComplete,
        completedAssessment,
        error,
        sendMessage,
        completeSession,
        resetSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
