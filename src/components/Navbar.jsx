import React from 'react';
import { Wrench, LogOut, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onOpenReportModal, onOpenQrScanner }) => {
  const { user, logout, isStudent } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Wrench size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <h1>CampusFix</h1>
            <span>Smart Maintenance Portal</span>
          </div>
        </div>

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
