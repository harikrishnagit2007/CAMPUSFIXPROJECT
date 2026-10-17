import React, { useState } from 'react';
import { X, ShieldCheck, Gift, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { lostAndFoundApi } from '../../api/lostAndFound';

export const ClaimModal = ({ isOpen, onClose, item, onSuccess, showToast }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    ownershipProof: '',
    claimantPhone: user?.phone || '',
    claimantEmail: user?.email || '',
    studentRegNo: '',
  });

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ownershipProof.trim()) {
      showToast('Please provide verifiable proof of ownership.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        itemId: item.id,
        itemTitle: item.title,
        claimantId: user ? String(user.id || user.uid) : 'anonymous',
        claimantName: user?.name || user?.username || 'Student Claimant',
        claimantEmail: formData.claimantEmail || user?.email || '',
        claimantPhone: formData.claimantPhone || user?.phone || '',
        ownershipProof: `${formData.studentRegNo ? `[Reg No: ${formData.studentRegNo}] ` : ''}${formData.ownershipProof.trim()}`,
      };

      const claim = await lostAndFoundApi.submitClaim(payload);
      showToast(`Claim Request #${claim.claimCode} submitted! Campus staff will verify your ownership.`, 'success');

      if (onSuccess) onSuccess(claim);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to submit claim request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>
                File Item Claim Request
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Verify ownership to claim this found campus item.
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Found Item Snapshot */}
        <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                Item Found #{item.itemCode}
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {item.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <MapPin size={13} />
                <span>Found at: {item.location}</span>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              {item.category}
            </span>
          </div>

          {item.holdingLocation && (
            <div style={{ marginTop: '8px', padding: '8px 10px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.78rem', color: '#065f46' }}>
              <strong>Safe Custody:</strong> {item.holdingLocation}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <div className="form-group">
              <label className="form-label">
                Student Register Number / College Roll Number
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 210801045 or Staff ID"
                value={formData.studentRegNo}
                onChange={(e) => setFormData({ ...formData, studentRegNo: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Verifiable Proof of Ownership <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-control"
                rows={4}
                required
                placeholder="Describe specific details only the true owner would know: serial number, internal contents, sticker placements, device wallpaper, purchase bill reference, scratches, etc."
                value={formData.ownershipProof}
                onChange={(e) => setFormData({ ...formData, ownershipProof: e.target.value })}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Campus security and administrative staff review this information before authorizing physical item handover.
              </span>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Your Email</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  value={formData.claimantEmail}
                  onChange={(e) => setFormData({ ...formData, claimantEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Your Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  required
                  value={formData.claimantPhone}
                  onChange={(e) => setFormData({ ...formData, claimantPhone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 12px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.4 }}>
                Submitting fraudulent claims for campus property is a violation of the student code of conduct.
              </p>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ background: '#4f46e5', borderColor: '#4338ca' }}
            >
              {submitting ? 'Submitting Claim...' : 'Submit Claim Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
