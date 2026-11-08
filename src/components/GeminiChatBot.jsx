import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chat';
import { complaintsApi } from '../api/complaints';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Cpu,
  Trash2,
  ChevronDown,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const GeminiChatBot = ({ showToast }) => {
  const { user } = useAuth();
  const chatUserId = user ? String(user.id || user.uid || user.email || user.username || 'user') : 'user';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceLang, setVoiceLang] = useState('ta-IN'); // Default to Tamil / Indian regional for clarity
  const [voices, setVoices] = useState([]);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(false);

  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const activeAudioRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Auto-scroll to the latest message
  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Clean up audio & speech on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.pause();
        } catch {}
        activeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, []);

  // High-fidelity acoustic chime for microphone activation/deactivation
  const playChime = (type = 'start') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'start') {
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {
      /* ignore audio context error */
    }
  };

  // Dynamic Web Speech API Dictation (Voice-to-Text)
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (showToast) showToast('Speech recognition is not supported in this browser.', 'warning');
      return;
    }

    if (isListening) {
      playChime('stop');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Speech stop error:', e);
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      let accumulatedFinal = inputMsg ? inputMsg.trim() + ' ' : '';

      recognition.onstart = () => {
        setIsListening(true);
        playChime('start');
        if (showToast) {
          showToast(
            voiceLang === 'ta-IN'
              ? '🎤 கேட்கிறது... தெளிவாகப் பேசுங்கள் (தமிழ்)'
              : '🎤 Listening clearly... Speak now',
            'info'
          );
        }
      };

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            accumulatedFinal += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const combined = (accumulatedFinal + interim).trim();
        if (combined) {
          setInputMsg(combined);
          setInterimTranscript(interim || combined);
        }
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition notice:', err.error);
        setIsListening(false);
        setInterimTranscript('');
        recognitionRef.current = null;
        if (err.error === 'not-allowed') {
          if (showToast) showToast('Microphone access blocked. Please enable mic permissions in browser settings.', 'error');
        } else if (err.error === 'no-speech') {
          if (showToast) showToast('No speech was detected. Please tap mic and speak again.', 'info');
        } else if (err.error === 'network') {
          if (showToast) showToast('Speech recognition network error. Please try again.', 'warning');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech activation exception:', err);
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
      if (showToast) showToast('Could not access microphone speech recognition.', 'warning');
    }
  };

  // Initialize and load SpeechSynthesis voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);
        }
      } catch (err) {
        console.warn('Voice load error:', err);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const findBestVoice = (forTamil = false) => {
    const available = (voices && voices.length > 0)
      ? voices
      : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
    
    if (!available || available.length === 0) return null;

    if (forTamil) {
      const tamilVoice = available.find(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
      if (tamilVoice) return tamilVoice;
      const indianVoice = available.find(v => v.lang.includes('IN') || v.name.toLowerCase().includes('india'));
      if (indianVoice) return indianVoice;
    }

    // 1. Specifically match 'Google UK English Female'
    const googleUk = available.find(v => v.name.toLowerCase().includes('google uk english female'));
    if (googleUk) return googleUk;

    // 2. en-GB UK Female / Natural profiles (Sonia, Libby, Hazel, Serena, etc.)
    const ukFemale = available.find(v => 
      (v.lang.startsWith('en-GB') || v.lang === 'en_GB' || v.name.toLowerCase().includes('united kingdom') || v.name.toLowerCase().includes('british') || v.name.toLowerCase().includes('uk')) && 
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('sonia') || v.name.toLowerCase().includes('libby') || v.name.toLowerCase().includes('hazel') || v.name.toLowerCase().includes('serena'))
    );
    if (ukFemale) return ukFemale;

    // 3. Indian English female voices
    const indianFemale = available.find(v => 
      v.lang.includes('IN') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('priya') || v.name.toLowerCase().includes('neerja'))
    );
    if (indianFemale) return indianFemale;

    // 4. Any Google English female voice
    const googleFemale = available.find(v => 
      v.name.toLowerCase().includes('google') && 
      (v.name.toLowerCase().includes('female') || v.lang.startsWith('en'))
    );
    if (googleFemale) return googleFemale;

    // 5. Well-known friendly female voice profiles
    const namedFemale = available.find(v => {
      const n = v.name.toLowerCase();
      return (v.lang.startsWith('en') || v.lang.startsWith('ta')) && 
        (n.includes('female') || n.includes('samantha') || n.includes('victoria') || n.includes('zira') || n.includes('karen') || n.includes('jenny') || n.includes('aria') || n.includes('fiona'));
    });
    if (namedFemale) return namedFemale;

    // 6. Any British English voice
    const anyUk = available.find(v => v.lang.startsWith('en-GB') || v.name.toLowerCase().includes('united kingdom') || v.name.toLowerCase().includes('british'));
    if (anyUk) return anyUk;

    // 7. Any English voice
    const anyEn = available.find(v => v.lang.startsWith('en'));
    if (anyEn) return anyEn;

    return available[0] || null;
  };

  const stopSpeaking = () => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      activeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Speech cancel error:', e);
      }
      window._activeSpeechUtterance = null;
    }
    setCurrentlySpeakingId(null);
  };

  const speakWithWebSpeech = (cleanText, msgId, isTamil) => {
    if (!('speechSynthesis' in window)) {
      setCurrentlySpeakingId(null);
      if (showToast) showToast('Text-to-speech is not supported in this browser.', 'warning');
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedVoice = findBestVoice(isTamil);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || (isTamil ? 'ta-IN' : 'en-IN');
    } else {
      utterance.lang = isTamil ? 'ta-IN' : 'en-IN';
    }

    // Explicitly set 100% volume and natural cadence
    utterance.volume = 1.0;
    utterance.pitch = isTamil ? 1.02 : 1.12;
    utterance.rate = 1.0;

    // Pin utterance to window so Chrome garbage collector does not kill audio prematurely
    window._activeSpeechUtterance = utterance;

    utterance.onstart = () => {
      setCurrentlySpeakingId(msgId);
    };

    utterance.onend = () => {
      window._activeSpeechUtterance = null;
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      window._activeSpeechUtterance = null;
      setCurrentlySpeakingId(null);
    };

    try {
      window.speechSynthesis.speak(utterance);
      const voiceLabel = selectedVoice ? selectedVoice.name : (isTamil ? 'Tamil Voice' : 'Google UK English Female');
      if (showToast) showToast(`🔊 Voice: ${voiceLabel}`, 'info');
    } catch (err) {
      console.warn('Speech speak exception:', err);
      setCurrentlySpeakingId(null);
    }
  };

  const speakText = async (text, msgId = 'active') => {
    if (currentlySpeakingId === msgId) {
      stopSpeaking();
      return;
    }

    // Clear previous audio
    stopSpeaking();

    // Clean text by stripping markdown formatting, URLs, and image tokens
    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/\[Attached Photo\]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/•/g, ', ')
      .trim();

    if (!cleanText) return;

    setCurrentlySpeakingId(msgId);
    const isTamil = /[\u0B80-\u0BFF]/.test(cleanText) || voiceLang.startsWith('ta');

    // 1. Primary: Gemini 3.8 Flash Lite TTS Studio Audio (24kHz WAV)
    try {
      const ttsRes = await chatApi.synthesizeSpeech(
        cleanText.slice(0, 600),
        isTamil ? 'ta-IN' : 'en-IN',
        'Kore'
      );
      if (ttsRes && ttsRes.audioUrl) {
        const audio = new Audio(ttsRes.audioUrl);
        audio.volume = 1.0;
        activeAudioRef.current = audio;

        audio.onended = () => {
          activeAudioRef.current = null;
          setCurrentlySpeakingId(null);
        };
        audio.onerror = () => {
          activeAudioRef.current = null;
          speakWithWebSpeech(cleanText, msgId, isTamil);
        };

        await audio.play();
        if (showToast) {
          showToast(isTamil ? '🔊 தெளிவான குரலில் ஒலிக்கிறது (Gemini HD Audio)' : '🔊 Playing clear HD voice (Gemini TTS)', 'info');
        }
        return;
      }
    } catch (err) {
      console.warn('Gemini TTS playback fallback:', err);
    }

    // 2. Secondary: Browser Web Speech API
    speakWithWebSpeech(cleanText, msgId, isTamil);
  };

  // Load conversation history from local storage
  useEffect(() => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(`campusfix_chat_${chatUserId}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn('Local chat storage error:', err);
      setMessages([]);
    }
  }, [user, chatUserId]);

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
      modelUsed: 'User Input',
      timestamp: new Date().toISOString(),
    };

    // Use a temporary array to include the new message in the API call immediately
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`campusfix_chat_${chatUserId}`, JSON.stringify(updatedMessages.slice(-30)));

    const lowerText = userText.toLowerCase();
    
    // Intent Recognition
    const isOpenReportIntent = lowerText.includes('open report') || lowerText.includes('open complaint form');
    const isQueryStatsIntent = lowerText.includes('how many issue') || lowerText.includes('list complaints') || lowerText.includes('total issues');
    const isSubmitIntent = (lowerText.includes('report') || lowerText.includes('broken') || lowerText.includes('fix')) && userText.length > 5;

    let agentReplyText = '';
    let modelUsedName = 'CampusFix AI Assistant';

    try {
      if (isOpenReportIntent) {
        window.dispatchEvent(new CustomEvent('campusfix-open-report', { detail: { location: { building: 'Technology Block C', room: 'Room 304' } } }));
        agentReplyText = `🚀 I've opened the report form for you! You can now file your issue directly.`;
        modelUsedName = 'Action: Open Modal';
      } else if (isQueryStatsIntent) {
        const stats = await complaintsApi.getAnalytics();
        agentReplyText = `📊 **Campus Maintenance Overview**:\n• Total Tickets: ${stats.total}\n• Open Issues: ${stats.open}\n• Critical: ${stats.critical}\n\nWould you like me to help you report a new issue?`;
        modelUsedName = 'Action: Stats Query';
      } else if (isSubmitIntent && currentImg) {
        // Multi-modal auto-submit
        const studentEmail = (user.email || '').toLowerCase();
        const studentId = user.uid || user.id || 'usr_student';
        const res = await complaintsApi.createComplaint({
          complaint_title: userText.slice(0, 50),
          category: 'General',
          building: 'Technology Block C',
          room: 'Room 304',
          description: userText,
          priority: 'Medium',
          image: currentImg,
          student: studentId,
          student_id: studentId,
          studentId: studentId,
          student_email: studentEmail,
          student_name: user.name || 'Campus Student',
          student_details: {
            name: user.name || 'Campus Student',
            email: studentEmail,
            department: user.department || 'Student Facilities',
          },
        });
        agentReplyText = `✅ **Ticket Created**: ${res.complaint_id || res.id}\nI've automatically analyzed your photo and logged this issue in the system. Our maintenance team has been notified!`;
        modelUsedName = 'Action: Auto-Submit';
      } else {
        // General Chat with full history context - Increased to 30 messages for better continuity
        const historyPayload = updatedMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content
        })).slice(-30);

        const systemPrompt = "You are CampusFix AI, an intelligent, friendly facilities maintenance assistant. " +
          "Help students, faculty, and administrators report campus maintenance issues (electrical, plumbing, HVAC, projectors, furniture), track active tickets with live SLAs, and inspect facility issues. " +
          "Always maintain conversation context from the message history thread and answer each question with a direct, unique, and tailored response. " +
          "If an image is attached, describe what you observe and categorize the maintenance severity.";

        const response = await chatApi.sendMessage(
          historyPayload,
          'general',
          systemPrompt,
          currentImg
        );
        agentReplyText = response.reply;
        modelUsedName = response.modelUsed;
      }
    } catch (err) {
      console.error('Chat processing error:', err);
      agentReplyText = "I encountered an error processing your request. Please try again or use the manual report button.";
    }

    const modelReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: chatUserId,
      role: 'model',
      content: agentReplyText,
      modelUsed: modelUsedName,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const updated = [...prev, modelReply];
      localStorage.setItem(`campusfix_chat_${chatUserId}`, JSON.stringify(updated.slice(-30)));
      return updated;
    });

    setLoading(false);

    if (isAutoSpeakEnabled && agentReplyText) {
      setTimeout(() => {
        speakText(agentReplyText, modelReply.id);
      }, 300);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history? This cannot be undone.')) {
      return;
    }

    localStorage.removeItem(`campusfix_chat_${chatUserId}`);
    setMessages([]);
    if (showToast) showToast('Chat history cleared.', 'success');
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
                onClick={() => {
                  const nextState = !isAutoSpeakEnabled;
                  setIsAutoSpeakEnabled(nextState);
                  if (nextState) {
                    playChime('start');
                    const welcomePrompt = voiceLang === 'ta-IN'
                      ? 'வணக்கம்! வாய்ஸ் ஆன் செய்யப்பட்டது. உங்கள் குரல் எனக்கு மிகத் தெளிவாகக் கேட்கிறது! உங்களுக்கு என்ன உதவி வேண்டும்?'
                      : 'Voice activated! I can hear you loud and crystal clear. How can I help you today?';
                    speakText(welcomePrompt, 'voice-toggle-welcome');
                    if (showToast) showToast(voiceLang === 'ta-IN' ? '🔊 வாய்ஸ் ஆன் செய்யப்பட்டது (தெளிவான குரல்)' : '🔊 Auto-Voice: ON (Clear HD Voice)', 'success');
                  } else {
                    stopSpeaking();
                    playChime('stop');
                    if (showToast) showToast('Auto-Voice turned off', 'info');
                  }
                }}
                style={{
                  background: isAutoSpeakEnabled ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255,255,255,0.15)',
                  border: isAutoSpeakEnabled ? '1px solid #86efac' : 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                }}
                title={isAutoSpeakEnabled ? "Auto-speak active (Clear Voice)" : "Enable auto-speak for AI replies"}
              >
                {isAutoSpeakEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span>{isAutoSpeakEnabled ? 'Auto-Voice: ON' : 'Auto-Voice: OFF'}</span>
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                }}
                title="Clear Chat History"
              >
                <Trash2 size={14} /> Clear
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: '36px', width: '100%' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: '#64748b',
                          marginTop: '4px',
                        }}
                      >
                        {isUser ? 'You' : 'AI Assistant'}
                      </span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => speakText(m.content, m.id)}
                          style={{
                            background: currentlySpeakingId === m.id ? 'rgba(239, 68, 68, 0.12)' : 'none',
                            border: currentlySpeakingId === m.id ? '1px solid #fca5a5' : 'none',
                            borderRadius: '6px',
                            padding: currentlySpeakingId === m.id ? '2px 8px' : '2px 4px',
                            color: currentlySpeakingId === m.id ? '#dc2626' : '#4f46e5',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            marginTop: '4px',
                            transition: 'all 0.2s ease',
                          }}
                          title={currentlySpeakingId === m.id ? "Click to stop speaking" : "Speak response (HD Clear Voice)"}
                        >
                          {currentlySpeakingId === m.id ? (
                            <>
                              <VolumeX size={13} className="text-red-600 animate-pulse" />
                              <span style={{ color: '#dc2626' }}>Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={13} />
                              <span>🔊 Speak Voice</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
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

          {/* Real-time Listening Feedback Banner */}
          {isListening && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#fee2e2',
                borderTop: '1px solid #fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: '#b91c1c',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#dc2626',
                    display: 'inline-block',
                    flexShrink: 0,
                    animation: 'pulse 1s infinite',
                  }}
                />
                <span style={{ fontWeight: 700, flexShrink: 0 }}>
                  {voiceLang === 'ta-IN' ? '🎤 கேட்கிறது (தமிழ்)... பேசுங்கள்:' : '🎤 Listening (English IN)... Speak:'}
                </span>
                {interimTranscript && (
                  <span
                    style={{
                      fontStyle: 'italic',
                      color: '#7f1d1d',
                      maxWidth: '160px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    "{interimTranscript}"
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={toggleVoiceRecording}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                Stop / முடிந்தது
              </button>
            </div>
          )}

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

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => toggleVoiceRecording()}
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
                  transition: 'all 0.2s ease',
                }}
                title={isListening ? 'Stop listening' : 'Click to speak (Voice-to-text)'}
              >
                {isListening ? <MicOff size={16} className="animate-pulse text-red-600" /> : <Mic size={16} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextLang = voiceLang === 'ta-IN' ? 'en-IN' : 'ta-IN';
                  setVoiceLang(nextLang);
                  if (showToast) {
                    showToast(nextLang === 'ta-IN' ? '🇮🇳 மொழி: தமிழ் (Tamil voice & mic active)' : '🌐 Language: English IN active', 'info');
                  }
                }}
                style={{
                  background: voiceLang === 'ta-IN' ? '#e0e7ff' : '#f3e8ff',
                  border: '1px solid',
                  borderColor: voiceLang === 'ta-IN' ? '#c7d2fe' : '#e9d5ff',
                  borderRadius: '6px',
                  padding: '4px 6px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: voiceLang === 'ta-IN' ? '#4338ca' : '#7e22ce',
                  cursor: 'pointer',
                }}
                title="Switch voice language (தமிழ் / English)"
              >
                {voiceLang === 'ta-IN' ? 'தமிழ்' : 'ENG'}
              </button>
            </div>

            <input
              type="text"
              className="form-control"
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '8px 10px',
                borderRadius: '8px',
                border: isListening ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                backgroundColor: isListening ? '#fff5f5' : '#ffffff',
                transition: 'all 0.2s ease',
              }}
              placeholder={isListening ? (voiceLang === 'ta-IN' ? '🎤 கேட்கிறது... தமிழில் பேசுங்கள்...' : '🎤 Listening... Speak now...') : (voiceLang === 'ta-IN' ? 'கேளுங்கள் அல்லது பேசுங்கள்...' : 'Ask AI or report issue...')}
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
