import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Info, Flame, CheckCircle, Clock, Mail, Send } from 'lucide-react';
import { notificationsApi } from '../api/notifications';

export const NotificationDropdown = ({ onSelectComplaint, showToast }) => {
  const [notifications, setNotifications] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('system'); // 'system' | 'email'
  const [isOpen, setIsOpen] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else if (data && Array.isArray(data.results)) {
        setNotifications(data.results);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    }

    try {
      const emails = await notificationsApi.getEmailLogs();
      if (Array.isArray(emails)) {
        setEmailLogs(emails);
      } else if (emails && Array.isArray(emails.emails)) {
        setEmailLogs(emails.emails);
      } else if (emails && Array.isArray(emails.results)) {
        setEmailLogs(emails.results);
      } else {
        setEmailLogs([]);
      }
    } catch {
      setEmailLogs([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifList = Array.isArray(notifications) ? notifications : [];
  const emailList = Array.isArray(emailLogs) ? emailLogs : [];
  const unreadCount = notifList.filter((n) => !n?.read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => (Array.isArray(prev) ? prev.map((n) => ({ ...n, read: true })) : []));
      if (showToast) showToast('All notifications marked as read', 'info');
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif) return;
    if (!notif.read) {
      try {
        await notificationsApi.markAsRead(notif.id);
        setNotifications((prev) =>
          Array.isArray(prev) ? prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)) : []
        );
      } catch {
        // ignore
      }
    }
    if (notif.complaint_id && onSelectComplaint) {
      onSelectComplaint(notif.complaint_id);
      setIsOpen(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'emergency':
        return <Flame size={16} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'success':
        return <CheckCircle size={16} color="#10b981" />;
      default:
        return <Info size={16} color="#6366f1" />;
    }
  };

  const handleTriggerTestEmail = async () => {
    setSendingTest(true);
    try {
      await notificationsApi.sendTestEmail();
      if (showToast) showToast('Test resolution email dispatched to student!', 'success');
      fetchNotifications();
    } catch {
      if (showToast) showToast('Failed to send test email', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        title="Notifications & Automated Email Alerts"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 800,
              borderRadius: '9999px',
              padding: '1px 5px',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxHeight: '460px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
              <button
                onClick={() => setActiveTab('system')}
                style={{
                  border: 'none',
                  background: activeTab === 'system' ? '#ffffff' : 'transparent',
                  color: activeTab === 'system' ? '#4f46e5' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                In-App Alerts ({notifList.length})
              </button>
              <button
                onClick={() => setActiveTab('email')}
                style={{
                  border: 'none',
                  background: activeTab === 'email' ? '#ffffff' : 'transparent',
                  color: activeTab === 'email' ? '#4f46e5' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Mail size={12} /> Emails ({emailList.length})
              </button>
            </div>

            {activeTab === 'system' && unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Mark all read
              </button>
            )}

            {activeTab === 'email' && (
              <button
                type="button"
                onClick={handleTriggerTestEmail}
                disabled={sendingTest}
                style={{
                  background: '#10b981',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Send size={11} /> {sendingTest ? 'Sending...' : 'Test Alert'}
              </button>
            )}
          </div>

          {/* List Content */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {activeTab === 'system' ? (
              notifList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                  No in-app notifications right now.
                </div>
              ) : (
                notifList.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      gap: '10px',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: n.read ? '#ffffff' : '#f0fdf4',
                      cursor: n.complaint_id ? 'pointer' : 'default',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ marginTop: '2px', flexShrink: 0 }}>{getIcon(n.type)}</div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: n.read ? 600 : 700,
                          fontSize: '0.8rem',
                          color: n.read ? '#334155' : '#0f172a',
                        }}
                      >
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} />
                        <span>{n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              emailList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                  No automated resolution email logs yet. Click 'Test Alert' above to trigger an email dispatch.
                </div>
              ) : (
                emailList.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                        {e.complaint_id || 'System'} Resolved Alert
                      </div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: e.status === 'SENT' ? '#dcfce7' : '#e0e7ff',
                          color: e.status === 'SENT' ? '#15803d' : '#4338ca',
                        }}
                      >
                        {e.status || 'SENT'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
                      To: <strong>{e.recipient_name || 'Student'}</strong> ({e.recipient_email || 'student@campusfix.edu'})
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '3px', fontStyle: 'italic' }}>
                      "{e.subject || 'Automated Update'}"
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} />
                      <span>{e.sent_at ? new Date(e.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
