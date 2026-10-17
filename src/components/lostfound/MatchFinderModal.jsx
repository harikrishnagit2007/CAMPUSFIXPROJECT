import React, { useState, useEffect } from 'react';
import { X, Sparkles, MapPin, Calendar, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { lostAndFoundApi } from '../../api/lostAndFound';
import { LostFoundStatusBadge } from './LostFoundStatusBadge';

export const MatchFinderModal = ({ isOpen, onClose, item, onClaimMatch, showToast }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && item) {
      setLoading(true);
      lostAndFoundApi
        .findMatches(item)
        .then((res) => {
          setMatches(res || []);
        })
        .catch((err) => {
          console.error(err);
          setMatches([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isTargetLost = item.type === 'LOST';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%)',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>
                Possible Match Radar
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Comparing {item.title} against campus {isTargetLost ? 'FOUND' : 'LOST'} item catalog.
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Target Item Reference Banner */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LostFoundStatusBadge type={item.type} />
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{item.title}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.category})</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              📍 {item.location} • 📅 {item.dateOccurred}
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', background: '#e2e8f0', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
            Target Item
          </span>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Correlating campus locations, keywords, and time windows...
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#94a3b8' }}>
                <Sparkles size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '6px' }}>No Strong Matches Found Yet</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                Our automated matching engine continuously correlates newly registered {isTargetLost ? 'found' : 'lost'} items across campus buildings. You will be notified when a probable match appears!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Found {matches.length} Probable {matches.length === 1 ? 'Match' : 'Matches'}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Sorted by algorithm confidence score
                </span>
              </div>

              {matches.map(({ candidate, matchConfidence, reasons }) => (
                <div
                  key={candidate.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    background: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LostFoundStatusBadge type={candidate.type} />
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          {candidate.title}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          #{candidate.itemCode}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                        {candidate.description}
                      </p>
                    </div>

                    {/* Confidence Score Pill */}
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: '10px',
                        background: matchConfidence >= 75 ? '#dcfce7' : matchConfidence >= 50 ? '#fef3c7' : '#f1f5f9',
                        color: matchConfidence >= 75 ? '#15803d' : matchConfidence >= 50 ? '#b45309' : '#475569',
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{matchConfidence}%</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Match</div>
                    </div>
                  </div>

                  {/* Location & Holding Details */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '10px 0', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div>📍 <strong>Location:</strong> {candidate.location}</div>
                    <div>📅 <strong>Date:</strong> {candidate.dateOccurred}</div>
                    {candidate.holdingLocation && (
                      <div>🏢 <strong>Custody:</strong> {candidate.holdingLocation}</div>
                    )}
                  </div>

                  {/* Matching Reasons Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Criteria Matched:</span>
                    {reasons.map((r, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.7rem',
                          background: '#e0e7ff',
                          color: '#4338ca',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        ✓ {r}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {isTargetLost && candidate.type === 'FOUND' && candidate.status === 'OPEN' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          onClose();
                          if (onClaimMatch) onClaimMatch(candidate);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                      >
                        <ShieldCheck size={14} />
                        Claim This Found Item
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
