import React from 'react';
import { Wrench, LogOut, QrCode, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({
  activeModule = 'issues',
  onChangeModule,
  onOpenReportModal,
  onOpenQrScanner,
}) => {
  const { user, logout, isStudent } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <div
          className="brand-wrapper"
          style={{ cursor: onChangeModule ? 'pointer' : 'default' }}
          onClick={() => onChangeModule && onChangeModule('issues')}
        >
          <div className="brand-icon">
            <Wrench size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <h1>CampusFix</h1>
            <span>Smart Campus Management</span>
          </div>
        </div>

        {/* Module Switcher Pills */}
        {user && onChangeModule && (
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              gap: '4px',
            }}
          >
            <button
              onClick={() => onChangeModule('issues')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeModule === 'issues' ? '#ffffff' : 'transparent',
                color: activeModule === 'issues' ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: activeModule === 'issues' ? 700 : 500,
                fontSize: '0.82rem',
                boxShadow: activeModule === 'issues' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Wrench size={14} />
              <span>Campus Issues</span>
            </button>
            <button
              onClick={() => onChangeModule('lost-found')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeModule === 'lost-found' ? '#ffffff' : 'transparent',
                color: activeModule === 'lost-found' ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: activeModule === 'lost-found' ? 700 : 500,
                fontSize: '0.82rem',
                boxShadow: activeModule === 'lost-found' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Search size={14} />
              <span>Lost & Found</span>
            </button>
          </div>
        )}

        {/* User Info & Actions */}
        {user ? (
          <div className="nav-actions">
            {onOpenQrScanner && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={onOpenQrScanner}
                title="Scan Classroom / Location QR Code"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <QrCode size={15} />
                <span className="hide-mobile">Scan QR</span>
              </button>
            )}

            {isStudent && onOpenReportModal && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onOpenReportModal}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>+ Report Issue</span>
              </button>
            )}

            <div className="user-badge">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name || user.username}</span>
                <span className="user-role-tag">{user.role}</span>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={logout}
              title="Sign out of CampusFix"
              style={{ padding: '8px 12px' }}
            >
              <LogOut size={16} />
              <span className="hide-mobile">Sign Out</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
