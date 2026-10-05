import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, AlertTriangle, Info, Flame, CheckCircle, Clock } from 'lucide-react';
import { notificationsApi } from '../api/notifications';

export const NotificationDropdown = ({ onSelectComplaint, showToast }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data || []);
    } catch {
      // ignore
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      if (showToast) showToast('All notifications marked as read', 'info');
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await notificationsApi.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
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
        title="Notifications"
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
            width: '340px',
            maxHeight: '420px',
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
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
              Notifications {unreadCount > 0 && `(${unreadCount} new)`}
            </div>
            {unreadCount > 0 && (
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
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
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
                  onMouseEnter={(e) => {
                    if (n.complaint_id) e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = n.read ? '#ffffff' : '#f0fdf4';
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
                      <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {!n.read && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        marginTop: '6px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
