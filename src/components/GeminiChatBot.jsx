import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chat';
import { auth, db, handleFirestoreError } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Cpu,
  Trash2,
  Zap,
  Info,
  ChevronDown,
} from 'lucide-react';

export const GeminiChatBot = ({ showToast }) => {
  const { user } = useAuth();
  const fbCurrentUser = auth.currentUser;
  const isFbAuthed = Boolean(fbCurrentUser);
  const chatUserId = fbCurrentUser ? fbCurrentUser.uid : user ? String(user.uid || user.id || 'anonymous') : 'anonymous';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Available task modes matching user requirements:
  // "Use gemini-3.1-pro-preview for particularly complex tasks, gemini-3.5-flash for general tasks, and gemini-3.1-flash-lite for tasks that should happen fast."
  const [taskType, setTaskType] = useState('general'); // 'fast' | 'general' | 'complex'
  const [customSystemInstruction, setCustomSystemInstruction] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const threadEndRef = useRef(null);

  // Auto-scroll to the latest message
  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Subscribe to Firestore conversation history when Firebase Auth is active, or use local storage
  useEffect(() => {
    if (!user) return;

    if (isFbAuthed && fbCurrentUser) {
      const messagesRef = collection(db, 'chat_threads', fbCurrentUser.uid, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedMsgs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(loadedMsgs);
        },
        (error) => {
          try {
            handleFirestoreError(error, 'get', `chat_threads/${fbCurrentUser.uid}/messages`);
          } catch (err) {
            console.warn('Firestore chat thread notice:', err);
          }
        }
      );

      return () => unsubscribe();
    } else {
      // Local storage fallback for demo credentials session
      try {
        const stored = localStorage.getItem(`campusfix_chat_${chatUserId}`);
        if (stored) {
          setMessages(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Local chat storage error:', err);
      }
    }
  }, [user, isFbAuthed, fbCurrentUser, chatUserId]);

  if (!user) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || loading) return;

    const userText = inputMsg.trim();
    setInputMsg('');
    setLoading(true);

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: chatUserId,
      role: 'user',
      content: userText,
      modelUsed: taskType === 'complex' ? 'gemini-3.1-pro-preview' : taskType === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash',
      timestamp: new Date().toISOString(),
    };

    if (isFbAuthed && fbCurrentUser) {
      const messagesRef = collection(db, 'chat_threads', fbCurrentUser.uid, 'messages');
      try {
        await addDoc(messagesRef, {
          userId: fbCurrentUser.uid,
          role: 'user',
          content: userText,
          modelUsed: newMsg.modelUsed,
          timestamp: newMsg.timestamp,
        });
      } catch (error) {
        try {
          handleFirestoreError(error, 'write', `chat_threads/${fbCurrentUser.uid}/messages`);
        } catch (err) {
          console.warn('Firestore chat sync error:', err);
        }
      }
    } else {
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        localStorage.setItem(`campusfix_chat_${chatUserId}`, JSON.stringify(updated.slice(-30)));
        return updated;
      });
    }

    // 2. Format history payload for Gemini multi-turn conversation
    const currentHistory = [...messages, { role: 'user', content: userText }]
      .map((m) => ({
        role: m.role,
        content: m.content || '',
      }))
      .filter((m) => m.content.trim() !== '');

    // Keep only last 12 messages to respect token usage and payload constraints
    const historyPayload = currentHistory.slice(-12);

    try {
      // 3. Request Gemini reply from server
      const response = await chatApi.sendMessage(
        historyPayload,
        taskType,
        customSystemInstruction
      );

      const modelReply = {
        id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: chatUserId,
        role: 'model',
        content: response.reply,
        modelUsed: response.modelUsed,
        timestamp: new Date().toISOString(),
      };

      if (isFbAuthed && fbCurrentUser) {
        const messagesRef = collection(db, 'chat_threads', fbCurrentUser.uid, 'messages');
        await addDoc(messagesRef, {
          userId: fbCurrentUser.uid,
          role: 'model',
          content: response.reply,
          modelUsed: response.modelUsed,
          timestamp: modelReply.timestamp,
        });
      } else {
        setMessages((prev) => {
          const updated = [...prev, modelReply];
          localStorage.setItem(`campusfix_chat_${chatUserId}`, JSON.stringify(updated.slice(-30)));
          return updated;
        });
      }
    } catch (error) {
      if (showToast) {
        showToast(error.message || 'Gemini chatbot failed to reply.', 'error');
      }

      // Add a fallback offline notice directly into state so the user isn't stuck
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-fallback',
          userId: chatUserId,
          role: 'model',
          content: '⚠️ Unable to process chat request right now. Using offline maintenance rules. Please make sure your server-side API is online.',
          modelUsed: 'offline-fallback',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear current conversation history
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history? This cannot be undone.')) {
      return;
    }

    if (isFbAuthed && fbCurrentUser) {
      try {
        const messagesRef = collection(db, 'chat_threads', fbCurrentUser.uid, 'messages');
        const snapshot = await getDocs(messagesRef);
        const batch = writeBatch(db);

        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        if (showToast) showToast('Chat history cleared.', 'success');
      } catch (error) {
        try {
          handleFirestoreError(error, 'delete', `chat_threads/${fbCurrentUser.uid}/messages`);
        } catch (err) {
          if (showToast) showToast('Failed to clear history from Firestore.', 'error');
        }
      }
    } else {
      localStorage.removeItem(`campusfix_chat_${chatUserId}`);
      setMessages([]);
      if (showToast) showToast('Chat history cleared.', 'success');
    }
  };

  const getModelLabel = () => {
    if (taskType === 'complex') return 'gemini-3.1-pro-preview';
    if (taskType === 'fast') return 'gemini-3.1-flash-lite';
    return 'gemini-3.5-flash';
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: isOpen ? '#e2e8f0' : '#4f46e5',
          color: isOpen ? '#1e293b' : '#ffffff',
          boxShadow: '0 8px 30px rgba(79, 70, 229, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        title="AI Maintenance Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            height: '560px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            zIndex: 998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #4f46e5, #3730a3)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                  CampusFix Gemini
                </h3>
                <span style={{ fontSize: '0.72rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cpu size={10} /> {getModelLabel()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  opacity: 0.8,
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="Clear Chat History"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  opacity: 0.8,
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="AI Settings"
              >
                <Info size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  opacity: 0.8,
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Configuration Drawer */}
          {showConfig && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                padding: '12px 16px',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                AI Model & Assistant Personality Settings
              </div>

              {/* Task / Model Type selector */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  Select AI Capability
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setTaskType('fast')}
                    style={{
                      padding: '4px 2px',
                      fontSize: '0.74rem',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: taskType === 'fast' ? '#4f46e5' : '#cbd5e1',
                      backgroundColor: taskType === 'fast' ? '#eff6ff' : '#ffffff',
                      color: taskType === 'fast' ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Fast
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('general')}
                    style={{
                      padding: '4px 2px',
                      fontSize: '0.74rem',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: taskType === 'general' ? '#4f46e5' : '#cbd5e1',
                      backgroundColor: taskType === 'general' ? '#eff6ff' : '#ffffff',
                      color: taskType === 'general' ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    🤖 General
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('complex')}
                    style={{
                      padding: '4px 2px',
                      fontSize: '0.74rem',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: taskType === 'complex' ? '#4f46e5' : '#cbd5e1',
                      backgroundColor: taskType === 'complex' ? '#eff6ff' : '#ffffff',
                      color: taskType === 'complex' ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    🧠 Complex
                  </button>
                </div>
              </div>

              {/* System instructions */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  Custom Role / System Instructions
                </label>
                <textarea
                  style={{
                    width: '100%',
                    height: '50px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    padding: '6px',
                    fontSize: '0.78rem',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                  placeholder="e.g. Answer with extreme mechanical detail and code citations..."
                  value={customSystemInstruction}
                  onChange={(e) => setCustomSystemInstruction(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Scrollable Chat Thread */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  color: '#64748b',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <Sparkles size={24} color="#6366f1" />
                </div>
                <h4 style={{ margin: '0 0 4px', color: '#334155', fontWeight: 600 }}>
                  Meet CampusFix AI Assistant
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: '1.4' }}>
                  Ask questions about campus buildings, diagnose facilities problems, or request advice on repairing student infrastructure.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        borderTopRightRadius: isUser ? '2px' : '12px',
                        borderTopLeftRadius: isUser ? '12px' : '2px',
                        backgroundColor: isUser ? '#4f46e5' : '#ffffff',
                        color: isUser ? '#ffffff' : '#1e293b',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        fontSize: '0.84rem',
                        lineHeight: '1.45',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.content}
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: '#64748b',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isUser ? 'You' : m.modelUsed || 'AI'}
                    </span>
                  </div>
                );
              })
            )}

            {/* Local Loading State */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    borderTopLeftRadius: '2px',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'bounce 0.8s infinite',
                      }}
                    />
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'bounce 0.8s infinite 0.2s',
                      }}
                    />
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'bounce 0.8s infinite 0.4s',
                      }}
                    />
                  </div>
                  <span>AI reasoning...</span>
                </div>
                <style>{`
                  @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                  }
                `}</style>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Chat Form Input */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '12px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '8px',
              backgroundColor: '#ffffff',
            }}
          >
            <input
              type="text"
              className="form-control"
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
              }}
              placeholder={`Ask ${getModelLabel()}...`}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !inputMsg.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
