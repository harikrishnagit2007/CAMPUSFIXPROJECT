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
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Background HTML5 Video */}
      <video
        src="https://videotourl.com/videos/1793713749379-671ad0a0-c664-44e3-aed7-741103a67a90.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />
      {/* Overlay removed as requested */}


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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.1)', padding: '5px', borderRadius: '12px' }}>
          {['STUDENT', 'ADMIN', 'STAFF'].map((p) => (
            <button
              key={p}
              onClick={() => handlePortalSwitch(p)}
              style={{
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                background: selectedPortal === p ? 'white' : 'transparent',
                color: selectedPortal === p ? '#4f46e5' : 'white',
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
        <div style={{ background: 'transparent', padding: '24px', borderRadius: '16px', color: 'white' }}>
          <div style={{ fontWeight: 800, marginBottom: '16px', color: 'white' }}>{isLoginMode ? 'Sign In' : 'Register'}</div>
          
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
                <label>Password</label>
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
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Continue with Google
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
    </div>
  );
};
