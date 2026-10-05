import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { AuthPage } from './pages/AuthPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { ComplaintModal } from './components/ComplaintModal';
import { QRScannerModal } from './components/QRScannerModal';
import { GeminiChatBot } from './components/GeminiChatBot';

function AppContent() {
  const { user, loading, isStudent, isAdmin, isStaff } = useAuth();

  // Toast System
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Global Report Modal trigger for student
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGlobalQrScannerOpen, setIsGlobalQrScannerOpen] = useState(false);
  const [globalPrefilledLocation, setGlobalPrefilledLocation] = useState(null);

  const handleSelectQrLocation = (loc) => {
    setGlobalPrefilledLocation(loc);
    setIsReportModalOpen(true);
    showToast(`QR Code decoded: ${loc.building} - ${loc.room}`, 'info');
  };

  React.useEffect(() => {
    const handleOpenReportEvent = (e) => {
      if (e.detail && e.detail.location) {
        setGlobalPrefilledLocation(e.detail.location);
      } else {
        setGlobalPrefilledLocation(null);
      }
      setIsReportModalOpen(true);
    };
    window.addEventListener('campusfix-open-report', handleOpenReportEvent);
    return () => {
      window.removeEventListener('campusfix-open-report', handleOpenReportEvent);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading CampusFix Portal...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenReportModal={() => {
          setGlobalPrefilledLocation(null);
          setIsReportModalOpen(true);
        }}
        onOpenQrScanner={() => setIsGlobalQrScannerOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {!user ? (
          <AuthPage showToast={showToast} />
        ) : isAdmin ? (
          <AdminDashboard showToast={showToast} />
        ) : isStaff ? (
          <StaffDashboard showToast={showToast} />
        ) : (
          <StudentDashboard
            showToast={showToast}
            onOpenReportModal={() => {
              setGlobalPrefilledLocation(null);
              setIsReportModalOpen(true);
            }}
            isReportModalOpen={isReportModalOpen}
            onCloseReportModal={() => {
              setIsReportModalOpen(false);
              setGlobalPrefilledLocation(null);
            }}
          />
        )}
      </main>

      {/* Global Student Complaint Creation Modal */}
      {user && isStudent && (
        <ComplaintModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setGlobalPrefilledLocation(null);
          }}
          complaint={null}
          initialLocation={globalPrefilledLocation}
          onSuccess={() => {
            window.dispatchEvent(new CustomEvent('complaintCreated'));
            setGlobalPrefilledLocation(null);
          }}
          showToast={showToast}
        />
      )}

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={isGlobalQrScannerOpen}
        onClose={() => setIsGlobalQrScannerOpen(false)}
        onSelectLocation={handleSelectQrLocation}
        showToast={showToast}
      />

      {/* Global Toast Alerts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Global Gemini Chatbot Assistant */}
      {user && <GeminiChatBot showToast={showToast} />}


      {/* Footer */}
      <footer style={{ background: 'white', borderTop: '1px solid var(--border-subtle)', padding: '20px 0', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <div className="container">
          <p>
            <strong>CampusFix</strong> • Smart Campus Maintenance & Facility Intelligence Portal
          </p>
          <p style={{ marginTop: '4px', fontSize: '0.76rem' }}>
            Production Full-Stack Architecture • QR Smart Locations • AI Vision Diagnostics • Emergency Escalation
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
