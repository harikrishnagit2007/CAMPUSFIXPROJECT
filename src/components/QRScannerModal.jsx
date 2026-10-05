import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, QrCode, Camera, Building, Search, CheckCircle2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { locationsApi } from '../api/locations';

export const QRScannerModal = ({ isOpen, onClose, onSelectLocation, showToast }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanningMode, setIsScanningMode] = useState(true);
  const [scannedLocation, setScannedLocation] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  const html5QrCodeRef = useRef(null);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await locationsApi.getLocations();
      setLocations(data || []);
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to load campus location registry.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleDecodedText = useCallback((text) => {
    try {
      let locId = text;
      if (text.startsWith('{')) {
        const parsed = JSON.parse(text);
        locId = parsed.location_id || parsed.id || text;
      } else if (text.includes('location_id=')) {
        const urlParams = new URLSearchParams(text.split('?')[1]);
        locId = urlParams.get('location_id') || text;
      }

      const found = locations.find(l => l.id.toLowerCase() === locId.toLowerCase());
      if (found) {
        setScannedLocation(found);
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
        setCameraActive(false);
        if (showToast) showToast(`QR Scanned successfully: ${found.building} - ${found.room}`, 'success');
      } else {
        if (showToast) showToast(`Scanned QR code ID '${locId}' not recognized in campus registry.`, 'warning');
      }
    } catch {
      const found = locations.find(l => l.id.toLowerCase() === text.toLowerCase());
      if (found) {
        setScannedLocation(found);
        setCameraActive(false);
      }
    }
  }, [locations, showToast]);

  const stopCamera = useCallback(async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Stop camera error:', err);
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setTimeout(async () => {
      try {
        if (!document.getElementById('reader')) return;
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode('reader');
        }
        
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const cameraId = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'))?.id || devices[0].id;

          await html5QrCodeRef.current.start(
            cameraId,
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              handleDecodedText(decodedText);
            },
            () => {}
          );
          setCameraActive(true);
        } else {
          setCameraError('No camera detected on this device. Please use quick simulate below.');
        }
      } catch (err) {
        console.warn('Camera start error:', err);
        setCameraError('Camera access denied or unavailable. Please select from directory or tap quick simulate.');
        setCameraActive(false);
      }
    }, 300);
  }, [handleDecodedText]);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
      setScannedLocation(null);
      setCameraError('');
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, loadLocations, stopCamera]);

  useEffect(() => {
    if (isOpen && isScanningMode) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, isScanningMode, startCamera, stopCamera]);

  if (!isOpen) return null;

  const filteredLocations = locations.filter((loc) => {
    const q = searchQuery.toLowerCase();
    return (
      loc.building.toLowerCase().includes(q) ||
      loc.room.toLowerCase().includes(q) ||
      loc.department.toLowerCase().includes(q) ||
      loc.id.toLowerCase().includes(q) ||
      loc.type.toLowerCase().includes(q)
    );
  });

  const handleSimulateScan = (loc) => {
    setScannedLocation(loc);
    stopCamera();
  };

  const handleConfirmLocation = (loc) => {
    const chosen = loc || scannedLocation;
    if (chosen && onSelectLocation) {
      stopCamera();
      onSelectLocation(chosen);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '14px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Smart QR Campus Location Scanner
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Scan device camera or select classroom, lab, or hostel QR code for instant auto-prefill.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px',
            gap: '4px',
          }}
        >
          <button
            onClick={() => setIsScanningMode(true)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: isScanningMode ? '#ffffff' : 'transparent',
              color: isScanningMode ? 'var(--primary-600)' : 'var(--text-secondary)',
              boxShadow: isScanningMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Camera size={16} /> QR Camera Viewfinder
          </button>
          <button
            onClick={() => {
              stopCamera();
              setIsScanningMode(false);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: !isScanningMode ? '#ffffff' : 'transparent',
              color: !isScanningMode ? 'var(--primary-600)' : 'var(--text-secondary)',
              boxShadow: !isScanningMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Building size={16} /> Campus Location Directory ({locations.length})
          </button>
        </div>

        {/* View 1: Camera Scanner Viewfinder & Quick Targets */}
        {isScanningMode && (
          <div>
            <div
              style={{
                position: 'relative',
                background: '#0f172a',
                borderRadius: '16px',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid #334155',
                color: 'white',
                marginBottom: '16px',
                padding: '12px',
              }}
            >
              {/* Real Camera Reader Element */}
              <div id="reader" style={{ width: '100%', maxWidth: '320px', borderRadius: '12px', overflow: 'hidden' }} />

              {cameraError && (
                <div style={{ textAlign: 'center', padding: '16px 20px', color: '#cbd5e1', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 600 }}>
                    <Camera size={16} /> QR Camera Viewfinder
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', maxWidth: '380px', lineHeight: '1.4' }}>
                    Camera access is restricted in this window. Select any location below or tap 'Campus Location Directory' to test instant QR decoding!
                  </p>
                </div>
              )}

              {!cameraActive && !cameraError && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Camera size={36} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Initializing device camera...</p>
                </div>
              )}
            </div>

            {/* Quick simulated scan triggers */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.04em',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} color="var(--primary-600)" />
                Or Tap a Campus Location for Instant Scan:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {locations.slice(0, 4).map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSimulateScan(loc)}
                    style={{
                      background: scannedLocation?.id === loc.id ? 'var(--primary-50)' : '#f8fafc',
                      border: scannedLocation?.id === loc.id ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--primary-600)',
                          background: '#e0e7ff',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {loc.id}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{loc.type}</span>
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {loc.room}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {loc.building} ({loc.floor})
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scanned Location Confirmation Card */}
            {scannedLocation && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid #86efac',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                      QR Code Scanned Successfully
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                      {scannedLocation.building} – {scannedLocation.room}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                      ID: {scannedLocation.id} | Floor: {scannedLocation.floor} | Dept: {scannedLocation.department}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleConfirmLocation(scannedLocation)}
                  style={{
                    background: '#15803d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  Prefill & Report <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* View 2: Full Directory Search */}
        {!isScanningMode && (
          <div>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by building, room, lab, or Location ID..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {loc.qr_code_data_url ? (
                        <img src={loc.qr_code_data_url} alt="QR" style={{ width: '36px', height: '36px' }} />
                      ) : (
                        <QrCode size={22} color="var(--primary-600)" />
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--primary-600)',
                            background: '#e0e7ff',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {loc.id}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{loc.type}</span>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {loc.room}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {loc.building} • {loc.floor} • {loc.department}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConfirmLocation(loc)}
                    style={{
                      background: 'var(--primary-600)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Select Location
                  </button>
                </div>
              ))}

              {filteredLocations.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No campus locations found matching your search.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
