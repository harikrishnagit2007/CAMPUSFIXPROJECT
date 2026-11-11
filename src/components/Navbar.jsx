import React from 'react';
import {
  Wrench,
  QrCode,
  LogOut,
  Search,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar = ({
  activeModule = 'issues',
  onChangeModule,
  onOpenQrScanner,
  showToast,
}) => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand Section */}
        <div
          className="brand-wrapper"
          onClick={() => onChangeModule && onChangeModule('issues')}
          role="button"
          tabIndex={0}
        >
          <div className="brand-icon">
            <Wrench size={22} />
          </div>
          <div className="brand-text">
            <h1>CampusFix</h1>
            <span>Smart Campus Operations</span>
          </div>
        </div>

        {/* Module Switcher (Campus Issues / Lost & Found) */}
        {onChangeModule && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              gap: '4px',
            }}
          >
            <button
              onClick={() => onChangeModule('issues')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: activeModule === 'issues' ? 'white' : 'transparent',
                color: activeModule === 'issues' ? 'var(--primary-600)' : 'var(--text-secondary)',
                boxShadow: activeModule === 'issues' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <LayoutDashboard size={15} />
              <span>Campus Issues</span>
            </button>
            <button
              onClick={() => onChangeModule('lost-found')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: activeModule === 'lost-found' ? 'white' : 'transparent',
                color: activeModule === 'lost-found' ? 'var(--primary-600)' : 'var(--text-secondary)',
                boxShadow: activeModule === 'lost-found' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Search size={15} />
              <span>Lost & Found</span>
            </button>
          </div>
        )}

        {/* Right-Side Actions */}
        <div className="nav-actions">
          {/* QR Code Scanner Action */}
          {onOpenQrScanner && (
            <button
              onClick={onOpenQrScanner}
              className="btn btn-secondary btn-sm"
              title="Scan QR Code"
              style={{ gap: '6px' }}
            >
              <QrCode size={16} />
              <span>Scan QR</span>
            </button>
          )}

          {/* Notification Dropdown */}
          <NotificationDropdown showToast={showToast} />

          {/* User Profile Badge */}
          <div className="user-badge">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="user-info">
              <span className="user-name">
                {user.name || user.email?.split('@')[0] || 'User'}
              </span>
              <span className="user-role-tag">
                {user.role || 'Member'}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Sign Out"
            style={{
              color: '#ef4444',
              borderColor: '#fee2e2',
              gap: '6px',
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
