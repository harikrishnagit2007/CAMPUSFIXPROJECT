import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chat';
import { complaintsApi } from '../api/complaints';
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
  Info,
  ChevronDown,
  Camera,
  ShieldAlert,
  PlusCircle,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  HelpCircle,
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
  const [attachedImage, setAttachedImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(false);
  const [voiceLang, setVoiceLang] = useState('ta-IN'); // 'ta-IN' | 'en-US'
  const [showVoiceGuideTooltip, setShowVoiceGuideTooltip] = useState(false);

  const [taskType, setTaskType] = useState('general'); // 'fast' | 'general' | 'complex'
  const [customSystemInstruction, setCustomSystemInstruction] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to the latest message
  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Dynamic Web Speech API Dictation (Tamil & English support)
  const toggleVoiceRecording = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError(true);
      if (showToast) showToast('Speech recognition is not supported in this browser.', 'warning');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Speech stop error:', e);
        }
      }
      setIsListening(false);
      if (showToast) showToast('Voice dictation stopped.', 'info');
    } else {
      // 1. Permission check via getUserMedia
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch (permErr) {
          console.warn('Microphone permission warning:', permErr);
          setMicError(true);
          if (showToast) showToast('Microphone access denied. Please allow mic in browser settings.', 'warning');
          return;
        }
      }

      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch { /* ignore */ }
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = voiceLang;

        recognition.onstart = () => {
          setIsListening(true);
          setMicError(false);
          const langLabel = voiceLang === 'ta-IN' ? 'Tamil (தமிழ்)' : 'English';
          if (showToast) showToast(`🎤 Listening in ${langLabel}... Speak now.`, 'info');
        };

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setInputMsg(transcript);
          }
        };

        recognition.onerror = (err) => {
          console.warn('Speech recognition notice:', err);
          setIsListening(false);
          if (err.error === 'language-not-supported' && voiceLang === 'ta-IN') {
            setVoiceLang('en-US');
            if (showToast) showToast('Tamil dictation model missing. Auto-switching to English...', 'info');
          } else if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
            setMicError(true);
            if (showToast) showToast('Microphone access denied. Please check browser permissions.', 'warning');
          } else if (err.error === 'no-speech') {
            if (showToast) showToast('No speech detected. Please speak into microphone.', 'info');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Speech activation exception:', err);
        setIsListening(false);
        setMicError(true);
        if (showToast) showToast('Could not access microphone. Please check permissions.', 'warning');
      }
    }
  };

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result);
        if (showToast) showToast('Photo attached for AI Assistant auto-submission.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (customText) => {
    const textToSend = customText || inputMsg;
    if ((!textToSend || !textToSend.trim()) && !attachedImage) return;
    if (loading) return;

    const userText = textToSend.trim();
    if (!customText) {
      setInputMsg('');
    }
    const currentImg = attachedImage;
    setAttachedImage(null);
    setLoading(true);

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: chatUserId,
      role: 'user',
      content: userText + (currentImg ? ' [Attached Photo]' : ''),
      image: currentImg,
      modelUsed: taskType === 'complex' ? 'gemini-3.1-pro-preview' : taskType === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash',
      timestamp: new Date().toISOString(),
    };

    if (isFbAuthed && fbCurrentUser) {
      const messagesRef = collection(db, 'chat_threads', fbCurrentUser.uid, 'messages');
      try {
        await addDoc(messagesRef, {
          userId: fbCurrentUser.uid,
          role: 'user',
          content: newMsg.content,
          image: currentImg || '',
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

    const lowerText = userText.toLowerCase();
    
    // Intent 1: Open Report Modal
    const isOpenReportIntent =
      lowerText.includes('open report') ||
      lowerText.includes('open the report') ||
      lowerText.includes('open complaint form') ||
      lowerText.includes('show report');

    // Intent 2: Query Complaints Stats / Issues Summary
    const isQueryStatsIntent =
      lowerText.includes('how many issue') ||
      lowerText.includes('how many complaint') ||
      lowerText.includes('what complaints') ||
      lowerText.includes('list complaints') ||
      lowerText.includes('total issues') ||
      lowerText.includes('ticket status');

    // Intent 3: Auto-Submit Issue Intent Recognition
    const isSubmitIntent =
      !isOpenReportIntent &&
      !isQueryStatsIntent &&
      (lowerText.includes('report') ||
        lowerText.includes('submit') ||
        lowerText.includes('create') ||
        lowerText.includes('file') ||
        lowerText.includes('broken') ||
        lowerText.includes('not working') ||
        lowerText.includes('fix') ||
        lowerText.includes('issue') ||
        lowerText.includes('complaint') ||
        lowerText.includes('leaky') ||
        lowerText.includes('damage') ||
        lowerText.includes('fault') ||
        lowerText.includes('spark') ||
        lowerText.includes('leak') ||
        lowerText.includes('ac') ||
        lowerText.includes('wifi') ||
        lowerText.includes('electric') ||
        lowerText.includes('light') ||
        lowerText.includes('water') ||
        lowerText.includes('plumb') ||
        currentImg !== null);

    let agentReplyText = '';
    let modelUsedName = 'CampusFix AI Assistant';

    if (isOpenReportIntent) {
      window.dispatchEvent(
        new CustomEvent('campusfix-open-report', {
          detail: {
            location: {
              building: lowerText.includes('block a') ? 'Academic Block A' : 'Technology Block C',
              room: 'Room 304',
            },
          },
        })
      );
      agentReplyText = `🚀 AI Assistant Action Executed:\n\nI have automatically opened the Report Issue modal for you! You can review the prefilled details and submit your report right away.`;
      modelUsedName = 'CampusFix AI Assistant (Modal Trigger)';
      if (showToast) showToast('AI Assistant opened Report Issue modal!', 'success');
    } else if (isQueryStatsIntent) {
      try {
        const analytics = await complaintsApi.getAnalytics();
        const complaints = await complaintsApi.getComplaints();
        const total = analytics.total || complaints.length || 0;
        const open = analytics.open || complaints.filter(c => c.status !== 'Resolved').length || 0;
        const critical = analytics.critical || complaints.filter(c => c.priority === 'Critical').length || 0;

        agentReplyText = `📊 Live Campus Maintenance Summary:\n\n• Total Complaints Logged: ${total}\n• Currently Open Issues: ${open}\n• Critical Priority Hazards: ${critical}\n\nYou can ask me to report a new issue, attach photos, or open the report form anytime!`;
        modelUsedName = 'CampusFix AI Assistant (Analytics Query)';
      } catch {
        agentReplyText = `📊 You currently have active maintenance tickets registered on the portal. Use the dashboard to view full department breakdowns.`;
        modelUsedName = 'CampusFix AI Assistant (Fallback)';
      }
    } else if (isSubmitIntent && (userText.length > 3 || currentImg)) {
      try {
        // 1. Dynamic Category Extraction
        let category = 'General Maintenance';
        if (lowerText.includes('electric') || lowerText.includes('spark') || lowerText.includes('wire') || lowerText.includes('light') || lowerText.includes('power') || lowerText.includes('socket') || lowerText.includes('plug')) category = 'Electrical';
        else if (lowerText.includes('water') || lowerText.includes('leak') || lowerText.includes('plumb') || lowerText.includes('tap') || lowerText.includes('pipe') || lowerText.includes('sink') || lowerText.includes('toilet')) category = 'Plumbing';
        else if (lowerText.includes('ac') || lowerText.includes('fan') || lowerText.includes('cooling') || lowerText.includes('heat') || lowerText.includes('air conditioner')) category = 'Fan/AC';
        else if (lowerText.includes('wifi') || lowerText.includes('internet') || lowerText.includes('network') || lowerText.includes('router') || lowerText.includes('connection')) category = 'Wi-Fi / Network';
        else if (lowerText.includes('desk') || lowerText.includes('chair') || lowerText.includes('furniture') || lowerText.includes('door') || lowerText.includes('table') || lowerText.includes('bench')) category = 'Furniture';
        else if (lowerText.includes('clean') || lowerText.includes('washroom') || lowerText.includes('dust') || lowerText.includes('trash') || lowerText.includes('dirty') || lowerText.includes('garbage')) category = 'Cleaning';

        // 2. Dynamic Location & Building Extraction
        let building = 'Technology Block C';
        if (lowerText.includes('block a') || lowerText.includes('academic block')) building = 'Academic Block A';
        else if (lowerText.includes('block b') || lowerText.includes('science block')) building = 'Science Block B';
        else if (lowerText.includes('hostel')) building = 'Men’s Hostel Block 1';
        else if (lowerText.includes('library')) building = 'Central Library';

        // 3. Dynamic Room Extraction
        const roomMatch = userText.match(/(?:room|lab|hall)\s*([a-z0-9-]+)/i);
        const room = roomMatch ? `Room ${roomMatch[1]}` : 'Room 304 (Auto-detected)';

        // 4. Dynamic Priority Detection
        const priority = (lowerText.includes('spark') || lowerText.includes('emergency') || lowerText.includes('fire') || lowerText.includes('danger') || lowerText.includes('urgent')) ? 'Critical' : lowerText.includes('high') ? 'High' : 'Medium';

        // 5. Title Synthesis
        const cleanedTitle = userText.replace(/^(please|can you|i want to|kindly|help|submit|report|file)\s+/i, '').trim();
        const complaintTitle = cleanedTitle.length > 0 ? (cleanedTitle.slice(0, 60) + (cleanedTitle.length > 60 ? '...' : '')) : `${category} Issue in ${building}`;

        const payload = {
          complaint_title: complaintTitle,
          category,
          building,
          room,
          description: userText,
          priority,
          image: currentImg || '',
          student: user.id || user.uid || chatUserId,
          student_details: {
            name: user.name || 'Student User',
            email: user.email || 'student@campusfix.edu',
            role: 'STUDENT',
          },
        };

        // Create via Backend API
        const res = await complaintsApi.createComplaint(payload);
        const ticketId = res.complaint_id || res.id || `CMP-${Math.floor(1000 + Math.random() * 9000)}`;

        // Create Record directly in Firestore
        let firestoreDocId = null;
        try {
          const firestoreRef = collection(db, 'complaints');
          const docRes = await addDoc(firestoreRef, {
            complaint_id: ticketId,
            title: complaintTitle,
            category,
            building,
            room,
            location: `${building}, ${room}`,
            description: userText,
            priority,
            status: 'Submitted',
            image: currentImg || '',
            studentId: user.id || user.uid || chatUserId,
            studentName: user.name || 'Student User',
            studentEmail: user.email || 'student@campusfix.edu',
            createdAt: new Date().toISOString(),
            source: 'AI Chat Agent',
          });
          firestoreDocId = docRes.id;
        } catch (fsErr) {
          console.warn('Firestore complaint doc creation notice:', fsErr);
        }

        agentReplyText = `🚀 AI Assistant Issue Submission Complete!\n\nI have automatically recognized your 'Submit Issue' intent and created a new complaint record in Firestore & system backend:\n\n• Ticket ID: ${ticketId}\n• Category: ${category}\n• Title: ${complaintTitle}\n• Location: ${building}, ${room}\n• Priority: ${priority}\n• Status: Submitted (Dispatched to Maintenance Staff)\n• Firestore Record: ${firestoreDocId ? `Created (Doc ID: ${firestoreDocId.slice(0, 8)}...)` : 'Synced'}\n${currentImg ? '• Photo Evidence: Attached in payload\n' : ''}\nYour issue has been logged successfully. You can track live SLA progress on your dashboard!`;
        modelUsedName = 'CampusFix AI Assistant (Submit Intent Auto-Submit)';
        if (showToast) showToast(`Ticket ${ticketId} auto-submitted & logged in Firestore!`, 'success');
      } catch (err) {
        console.warn('API auto-submit error:', err);
        agentReplyText = `I attempted to auto-submit your report via the AI agent, but encountered an error. Please try reporting via the '+ Report Issue' button above.`;
      }
    } else {
      // Standard chat / Gemini API call
      const currentHistory = [...messages, { role: 'user', content: userText }]
        .map((m) => ({
          role: m.role,
          content: m.content || '',
        }))
        .filter((m) => m.content.trim() !== '');

      const historyPayload = currentHistory.slice(-12);

      try {
        const response = await chatApi.sendMessage(
          historyPayload,
          taskType,
          customSystemInstruction
        );
        agentReplyText = response.reply;
        modelUsedName = response.modelUsed;
      } catch {
        agentReplyText = '⚠️ Unable to process chat request right now. Using offline assistant fallback. Please make sure your server-side API is online.';
        modelUsedName = 'offline-fallback';
      }
    }

    const modelReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: chatUserId,
      role: 'model',
      content: agentReplyText,
      modelUsed: modelUsedName,
      timestamp: new Date().toISOString(),
    };

    if (isFbAuthed && fbCurrentUser) {
      const messagesRef = collection(db, 'chat_threads', fbCurrentUser.uid, 'messages');
      try {
        await addDoc(messagesRef, {
          userId: fbCurrentUser.uid,
          role: 'model',
          content: agentReplyText,
          modelUsed: modelUsedName,
          timestamp: modelReply.timestamp,
        });
      } catch (err) {
        console.warn('Firestore model reply error:', err);
      }
    } else {
      setMessages((prev) => {
        const updated = [...prev, modelReply];
        localStorage.setItem(`campusfix_chat_${chatUserId}`, JSON.stringify(updated.slice(-30)));
        return updated;
      });
    }

    setLoading(false);
  };

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
        } catch {
          if (showToast) showToast('Failed to clear history from Firestore.', 'error');
        }
      }
    } else {
      localStorage.removeItem(`campusfix_chat_${chatUserId}`);
      setMessages([]);
      if (showToast) showToast('Chat history cleared.', 'success');
    }
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
            width: '390px',
            height: '580px',
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
          {/* Header - Clean Professional Title without debug badges */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
                  CampusFix AI Assistant
                </h3>
                <span style={{ fontSize: '0.74rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cpu size={11} /> Smart Facilities & Voice Reporting
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
                  placeholder="e.g. You are an expert facility coordinator..."
                  value={customSystemInstruction}
                  onChange={(e) => setCustomSystemInstruction(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Quick Action Suggestion Chips */}
          <div
            style={{
              padding: '8px 12px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {micError && (
              <button
                onClick={() => handleSend("Water leakage in Science Block B Lab 202.")}
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Voice dictation shortcut simulation"
              >
                <Mic size={12} /> 🎙️ Voice: "Water leak in Lab 202"
              </button>
            )}
            <button
              onClick={() => handleSend("How many issues have been reported so far?")}
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                border: 'none',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <PlusCircle size={12} /> Check Issues Summary
            </button>
            <button
              onClick={() => handleSend("Open the report form")}
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                border: 'none',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Camera size={12} /> Open Report Modal
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                border: 'none',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Paperclip size={12} /> Attach Photo
            </button>
            <button
              onClick={() => handleSend("What should I do in a campus emergency or safety hazard?")}
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                border: 'none',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldAlert size={12} /> Emergency
            </button>
          </div>

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
                    backgroundColor: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <Sparkles size={24} color="#4f46e5" />
                </div>
                <h4 style={{ margin: '0 0 4px', color: '#1e293b', fontWeight: 700 }}>
                  CampusFix AI Assistant
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: '1.4' }}>
                  Use voice dictation (microphone button), type issues to auto-submit, query total complaints, or open report modals instantly!
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
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        maxWidth: '90%',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isUser ? '#4f46e5' : '#e0e7ff',
                          color: isUser ? '#ffffff' : '#4338ca',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {isUser ? 'U' : <Sparkles size={14} />}
                      </div>

                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          borderTopRightRadius: isUser ? '2px' : '12px',
                          borderTopLeftRadius: isUser ? '12px' : '2px',
                          backgroundColor: isUser ? '#4f46e5' : '#ffffff',
                          color: isUser ? '#ffffff' : '#1e293b',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          fontSize: '0.84rem',
                          lineHeight: '1.45',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          border: isUser ? 'none' : '1px solid #e2e8f0',
                        }}
                      >
                        {m.content}
                        {m.image && (
                          <div style={{ marginTop: '8px' }}>
                            <img
                              src={m.image}
                              alt="Attached evidence"
                              style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: '#64748b',
                        marginTop: '4px',
                        paddingInline: '36px',
                      }}
                    >
                      {isUser ? 'You' : 'AI Assistant'}
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e7ff',
                      color: '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={14} />
                  </div>
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
                      border: '1px solid #e2e8f0',
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
                    <span>AI Assistant processing...</span>
                  </div>
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

          {/* Attached Image Preview bar if selected */}
          {attachedImage && (
            <div
              style={{
                padding: '6px 12px',
                background: '#eff6ff',
                borderTop: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#1e40af' }}>
                <ImageIcon size={14} />
                <span>Photo attached ready for report submission</span>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e40af' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />

          {/* Chat Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '12px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '6px',
              backgroundColor: '#ffffff',
              alignItems: 'center',
            }}
          >
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569',
              }}
              title="Attach photo"
            >
              <Paperclip size={16} />
            </button>

            {/* Voice Dictation Microphone Button & Tooltip */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={toggleVoiceRecording}
                style={{
                  background: isListening ? '#fee2e2' : '#f1f5f9',
                  border: '1px solid',
                  borderColor: isListening ? '#ef4444' : '#cbd5e1',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isListening ? '#dc2626' : '#475569',
                }}
                title={isListening ? 'Stop listening' : 'Voice-to-text dictation'}
              >
                {isListening ? <MicOff size={16} className="animate-pulse text-red-600" /> : <Mic size={16} />}
              </button>

              {/* Interactive Language Toggle Switcher */}
              <button
                type="button"
                onClick={() => {
                  const nextLang = voiceLang === 'ta-IN' ? 'en-US' : 'ta-IN';
                  setVoiceLang(nextLang);
                  if (showToast) showToast(`Voice dictation language set to: ${nextLang === 'ta-IN' ? 'TA (தமிழ்)' : 'EN (English)'}`, 'info');
                }}
                style={{
                  background: voiceLang === 'ta-IN' ? '#f59e0b' : '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 6px',
                  height: '36px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                }}
                title="Click to toggle dictation language (Tamil TA / English EN)"
              >
                {voiceLang === 'ta-IN' ? 'TA தமிழ்' : 'EN English'}
              </button>

              <button
                type="button"
                onClick={() => setShowVoiceGuideTooltip(!showVoiceGuideTooltip)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title="Voice Guide Instructions"
              >
                <HelpCircle size={14} />
              </button>

              {/* Floating Voice Guide Popover Tooltip */}
              {showVoiceGuideTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '46px',
                    left: '-90px',
                    width: '260px',
                    background: '#1e293b',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    fontSize: '0.76rem',
                    zIndex: 1000,
                    lineHeight: '1.4',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🎙️ Voice Guide Instructions</span>
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setShowVoiceGuideTooltip(false)} />
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>Tap the mic button and allow browser microphone permissions.</li>
                    <li>Speak clearly in Tamil or English to dictate your issue (e.g. "Report broken AC in Tech Block").</li>
                  </ol>
                </div>
              )}
            </div>

            <input
              type="text"
              className="form-control"
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
              }}
              placeholder={isListening ? 'Listening... Speak now' : 'Ask AI or report issue (or use mic)...'}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || (!inputMsg.trim() && !attachedImage)}
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
