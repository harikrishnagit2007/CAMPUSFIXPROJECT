import React, { useRef } from 'react';
import { X, Printer, Download, Copy, Check, Wrench } from 'lucide-react';

export const QRBadgeModal = ({ isOpen, onClose, location, showToast }) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef(null);

  if (!isOpen || !location) return null;

  const deepLink = `${window.location.origin}/?location_id=${location.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLink);
    setCopied(true);
    if (showToast) showToast('Deep link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPNG = () => {
    if (!location.qr_code_data_url) return;
    const link = document.createElement('a');
    link.href = location.qr_code_data_url;
    link.download = `CampusFix_${location.id}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast(`Downloaded QR code for ${location.id}`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '480px', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Location QR Poster
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Print or place on doorframe for smart reporting
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Printable Card */}
        <div
          ref={printRef}
          style={{
            background: '#ffffff',
            border: '2px solid #e0e7ff',
            borderRadius: '16px',
            padding: '24px 20px',
            boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.12)',
            marginBottom: '20px',
            position: 'relative',
          }}
        >
          {/* Top Brand Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={16} />
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              CampusFix Smart Portal
            </div>
          </div>

          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--primary-600)',
              marginBottom: '6px',
            }}
          >
            Official Maintenance Access Point
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {location.room}
          </h2>
          <div style={{ fontSize: '0.88rem', color: '#475569', marginTop: '4px' }}>
            {location.building} • {location.floor}
          </div>

          <div
            style={{
              display: 'inline-block',
              background: '#f1f5f9',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#334155',
              marginTop: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            ID: {location.id}
          </div>

          {/* QR Image */}
          <div
            style={{
              margin: '18px auto',
              width: '220px',
              height: '220px',
              padding: '12px',
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            {location.qr_code_data_url ? (
              <img
                src={location.qr_code_data_url}
                alt={`QR Code for ${location.id}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ padding: '60px 0', color: 'var(--text-muted)' }}>Generating QR...</div>
            )}
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
            Scan with smartphone camera or CampusFix App to instantly report facility, electrical, plumbing, or classroom issues.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={handleDownloadPNG}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              background: '#f1f5f9',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <Download size={15} /> Save PNG
          </button>

          <button
            onClick={handleCopyLink}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              background: '#f1f5f9',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>

          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              background: 'var(--primary-600)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <Printer size={15} /> Print Poster
          </button>
        </div>
      </div>
    </div>
  );
};
