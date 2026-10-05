import React from 'react';
import { AlertOctagon, Flame, ChevronRight, PhoneCall } from 'lucide-react';

export const EmergencyBanner = ({ emergencies = [], onSelectComplaint }) => {
  if (!emergencies || emergencies.length === 0) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #b91c1c 100%)',
        color: 'white',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.45)',
        border: '1px solid #f87171',
        animation: 'pulseGlow 2.5s infinite ease-in-out',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Flame size={24} color="#fef08a" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#fef08a',
                color: '#854d0e',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.05em',
              }}
            >
              Active Hazard Alert
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              {emergencies.length} Critical Safety Incident{emergencies.length > 1 ? 's' : ''} Under Emergency Escalation
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#fee2e2', marginTop: '3px' }}>
            Immediate facilities response dispatched for critical electrical, flood, or structural hazards.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <a
          href="tel:5550199"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            textDecoration: 'none',
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <PhoneCall size={14} /> Hotline (555-0199)
        </a>

        {onSelectComplaint && emergencies[0] && (
          <button
            onClick={() => onSelectComplaint(emergencies[0])}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'white',
              color: '#991b1b',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            }}
          >
            View Hazard #{emergencies[0].formatted_id || emergencies[0].id}
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 4px 16px rgba(220, 38, 38, 0.35); }
          50% { box-shadow: 0 8px 30px rgba(220, 38, 38, 0.65); }
        }
      `}</style>
    </div>
  );
};
