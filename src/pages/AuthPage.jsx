import React, { useState } from 'react';
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
  const { login, register, signInWithGoogle } = useAuth();
  
  // Selected Role Portal: 'STUDENT' | 'ADMIN' | 'STAFF'
  const [selectedPortal, setSelectedPortal] = useState('STUDENT');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Default demo credentials mapping for convenience
  const defaultCredentials = {
    STUDENT: { email: 'student@campusfix.edu', password: 'Student@123' },
    ADMIN: { email: 'admin@campusfix.edu', password: 'Admin@123' },
    STAFF: { email: 'staff@campusfix.edu', password: 'Staff@123' },
  };

  // Form states
  const [loginData, setLoginData] = useState({
    email: defaultCredentials.STUDENT.email,
    password: defaultCredentials.STUDENT.password,
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    phone: '+91 98401 23456',
  });

  const handlePortalSwitch = (portal) => {
    setSelectedPortal(portal);
    setErrorMsg('');
    setLoginData({
      email: defaultCredentials[portal].email,
      password: defaultCredentials[portal].password,
    });
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

    setLoading(true);
    try {
      await login(loginData.email.trim(), loginData.password);
      if (showToast) {
        showToast(`Welcome back to ${selectedPortal} Dashboard!`, 'success');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
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
        role: selectedPortal,
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
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 16px', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4f46e5, #3730a3)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(79, 70, 229, 0.35)',
              marginBottom: '14px',
            }}
          >
            <Wrench size={30} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            CampusFix Portal
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Smart Campus Maintenance & Facility Intelligence System
          </p>
        </div>

        {/* Dedicated 3-Role Portal Selector */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            background: '#e2e8f0',
            padding: '5px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => handlePortalSwitch('STUDENT')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '10px 6px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              transition: 'all 0.18s ease',
              background: selectedPortal === 'STUDENT' ? 'white' : 'transparent',
              color: selectedPortal === 'STUDENT' ? '#4f46e5' : '#475569',
              boxShadow: selectedPortal === 'STUDENT' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <GraduationCap size={18} />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('ADMIN')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '10px 6px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              transition: 'all 0.18s ease',
              background: selectedPortal === 'ADMIN' ? 'white' : 'transparent',
              color: selectedPortal === 'ADMIN' ? '#4338ca' : '#475569',
              boxShadow: selectedPortal === 'ADMIN' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <ShieldCheck size={18} />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('STAFF')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '10px 6px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              transition: 'all 0.18s ease',
              background: selectedPortal === 'STAFF' ? 'white' : 'transparent',
              color: selectedPortal === 'STAFF' ? '#7c3aed' : '#475569',
              boxShadow: selectedPortal === 'STAFF' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <UserCheck size={18} />
            <span>Staff</span>
          </button>
        </div>

        {/* Auth Main Card */}
        <div
          className="glass-panel"
          style={{
            padding: '28px 30px',
            borderRadius: '16px',
            background: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Active Portal Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: currentConfig.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PortalIcon size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {currentConfig.title}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                {currentConfig.desc}
              </div>
            </div>
          </div>

          {/* Mode Tabs (Sign In / Register) */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
            <button
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: isLoginMode ? 'white' : 'transparent',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.86rem',
                color: isLoginMode ? 'var(--primary-600)' : 'var(--text-secondary)',
                boxShadow: isLoginMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                setIsLoginMode(true);
                setErrorMsg('');
              }}
            >
              Sign In to {selectedPortal}
            </button>
            <button
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: !isLoginMode ? 'white' : 'transparent',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.86rem',
                color: !isLoginMode ? 'var(--primary-600)' : 'var(--text-secondary)',
                boxShadow: !isLoginMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                setIsLoginMode(false);
                setErrorMsg('');
              }}
            >
              New {selectedPortal} Registration
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.85rem',
                marginBottom: '18px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {isLoginMode ? (
            <>
              {/* Login Form */}
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label className="form-label">{selectedPortal} Email / Username</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={defaultCredentials[selectedPortal].email}
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{loading ? 'Authenticating...' : `Sign In as ${selectedPortal}`}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Google Sign-In with Selected Portal Role */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                <span style={{ margin: '0 10px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  or continue with
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  padding: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'white',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.19-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google ({selectedPortal})</span>
              </button>
            </>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Harikrishna"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Campus Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder={`${selectedPortal.toLowerCase()}@campusfix.edu`}
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Account Role</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedPortal}
                    readOnly
                    style={{ background: '#f8fafc', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Computer Science"
                    value={registerData.department}
                    onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Mobile Number (India)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98401 23456"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Confirm Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={registerData.confirm_password}
                    onChange={(e) => setRegisterData({ ...registerData, confirm_password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: '10px', padding: '12px', fontWeight: 700 }}
              >
                {loading ? 'Creating Account...' : `Register ${selectedPortal} Account`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
