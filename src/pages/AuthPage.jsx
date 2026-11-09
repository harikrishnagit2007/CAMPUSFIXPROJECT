import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage = ({ showToast }) => {
  const { login, register, signInWithGoogle, forgotPassword, resetPassword } = useAuth();
  

  
  // Selected Role Portal: 'STUDENT' | 'ADMIN' | 'STAFF'
  const [selectedPortal, setSelectedPortal] = useState('STUDENT');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot Password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'confirm'
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [simulatedResetToken, setSimulatedResetToken] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Helper to ensure role display always uses 'Student', 'Admin', 'Staff' (strictly singular, never 'Students')
  const getRoleLabel = (role) => {
    if (!role) return 'Student';
    const upper = String(role).toUpperCase();
    if (upper === 'STUDENT' || upper === 'STUDENTS') return 'Student';
    if (upper === 'ADMIN' || upper === 'ADMINS') return 'Admin';
    if (upper === 'STAFF') return 'Staff';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  // Demo credentials available on demand
  const demoCredentials = {
    STUDENT: { email: 'student@campusfix.edu', password: 'Student@123' },
    ADMIN: { email: 'admin@campusfix.edu', password: 'Admin@123' },
    STAFF: { email: 'staff@campusfix.edu', password: 'Staff@123' },
  };

  // Form states - clean empty fields by default to avoid accidental prefill
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'STUDENT',
    department: '',
    phone: '',
  });

  const handlePortalSwitch = (portal) => {
    setSelectedPortal(portal);
    setErrorMsg('');
    setRegisterData((prev) => ({
      ...prev,
      role: portal,
      department:
        portal === 'ADMIN'
          ? 'Campus Facilities & Operations'
          : portal === 'STAFF'
          ? 'Electrical & Facilities'
          : 'Computer Science & Engineering',
    }));
  };

  const handleFillDemoCredentials = () => {
    const creds = demoCredentials[selectedPortal];
    setLoginData({
      email: creds.email,
      password: creds.password,
    });
    if (showToast) {
      showToast(`Filled demo credentials for ${selectedPortal}`, 'info');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithGoogle(selectedPortal);
      if (showToast) {
        showToast(`Signed in to ${selectedPortal} Portal with Google!`, 'success');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Google Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginData.email || !loginData.password) {
      setErrorMsg('Please enter both email/username and password.');
      return;
    }

    console.log('[AuthPage] Initiating login form submission:', {
      portal: selectedPortal,
      email: loginData.email.trim(),
    });

    setLoading(true);
    try {
      const res = await login(loginData.email.trim(), loginData.password, selectedPortal);
      console.log('[AuthPage] Login succeeded:', res);
      if (showToast) {
        showToast(`Welcome back to ${selectedPortal} Dashboard!`, 'success');
      }
    } catch (err) {
      console.error('[AuthPage] Login submission caught error:', {
        status: err?.status,
        message: err?.message,
        data: err?.data,
      });
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      if (res && res.resetToken) {
        setSimulatedResetToken(res.resetToken);
        setResetTokenInput(res.resetToken);
      }
      setForgotStep('confirm');
      if (showToast) showToast('Password reset instructions sent!', 'success');
    } catch (err) {
      setForgotError(err.message || 'Failed to send password reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!resetTokenInput || !newPasswordInput || newPasswordInput.length < 6) {
      setForgotError('Please enter a valid reset token and a new password (min 6 characters).');
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail.trim(), resetTokenInput.trim(), newPasswordInput);
      if (showToast) showToast('Password successfully reset! Welcome back.', 'success');
      setShowForgotModal(false);
      setForgotStep('request');
      setForgotEmail('');
      setResetTokenInput('');
      setNewPasswordInput('');
    } catch (err) {
      setForgotError(err.message || 'Password reset failed. Check your token.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (registerData.password !== registerData.confirm_password) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (registerData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register({
        ...registerData,
        role: registerData.role || selectedPortal,
      });
      if (showToast) {
        showToast('Account registered successfully! Welcome to CampusFix.', 'success');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const portalConfig = {
    STUDENT: {
      title: 'Student & Faculty Portal',
      desc: 'Report campus issues, track live SLA countdowns, and verify repair resolutions.',
      icon: GraduationCap,
      color: '#4f46e5',
      badge: 'Student / Faculty Access',
    },
    ADMIN: {
      title: 'Administrator Command Center',
      desc: 'Assign maintenance technicians, monitor campus SLAs, inspect QR locations & view analytics.',
      icon: ShieldCheck,
      color: '#4338ca',
      badge: 'Admin Management Access',
    },
    STAFF: {
      title: 'Maintenance Staff Portal',
      desc: 'View assigned work orders, update repair milestones, upload resolution proofs & resolve tickets.',
      icon: UserCheck,
      color: '#7c3aed',
      badge: 'Technician & Staff Access',
    },
  };

  const currentConfig = portalConfig[selectedPortal];
  const PortalIcon = currentConfig.icon;

  return (
    <div
      className="auth-container"
      style={{
        padding: '24px 16px',
        overflowY: 'auto',
      }}
    >
      {/* Subtle overlay for contrast and legibility over the full-screen background image */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.6) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Main Content Card */}
      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
            CampusFix
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
            Smart Campus Maintenance Portal
          </p>
        </div>

        {/* Portal Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.08)', padding: '5px', borderRadius: '12px' }}>
          {['STUDENT', 'ADMIN', 'STAFF'].map((p) => (
            <button
              key={p}
              onClick={() => handlePortalSwitch(p)}
              style={{
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                background: selectedPortal === p ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Auth Form Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '20px',
            padding: '28px 24px',
            color: '#0f172a',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: '16px', color: '#0f172a', fontSize: '1.1rem' }}>{isLoginMode ? 'Sign In' : 'Register'}</div>
          
          {errorMsg && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.8rem' }}>{errorMsg}</div>}

          {isLoginMode ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Email</label>
                  {selectedPortal !== 'STUDENT' && (
                    <button type="button" onClick={handleFillDemoCredentials} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                      Demo Fill
                    </button>
                  )}
                </div>
                <input type="text" className="form-control" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Password</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotError(''); setForgotStep('request'); setForgotEmail(loginData.email); }}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input type="password" className="form-control" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Sign In</button>
              
              <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0', color: '#cbd5e1', fontSize: '0.8rem' }}>
                <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                <span style={{ margin: '0 10px' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.28)',
                  color: 'white',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              {/* Simplified Registration Fields */}
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-control" value={registerData.name} onChange={(e) => setRegisterData({...registerData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control" value={registerData.password} onChange={(e) => setRegisterData({...registerData, password: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Register</button>
            </form>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            color: '#1e293b',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {forgotStep === 'request' ? 'Reset Password' : 'Enter New Password'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            {forgotError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {forgotError}
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotSubmit}>
                <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '16px' }}>
                  Enter your registered email address and we'll send you a password reset token.
                </p>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. student@campusfix.edu"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForgotModal(false)}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  <strong>Reset email dispatched!</strong><br />
                  {simulatedResetToken && (
                    <span>Simulated token auto-filled: <code>{simulatedResetToken}</code></span>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Reset Token</label>
                  <input
                    type="text"
                    className="form-control"
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    placeholder="Enter token (e.g. CFX-RST-...)"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>New Password (min 6 chars)</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setForgotStep('request')}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    {forgotLoading ? 'Resetting...' : 'Update Password & Login'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
