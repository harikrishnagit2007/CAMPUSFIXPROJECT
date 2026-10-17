import React from 'react';
import { HelpCircle, CheckCircle, Clock, XCircle, Search, Gift } from 'lucide-react';

export const LostFoundStatusBadge = ({ type, status, isClaim = false }) => {
  // If rendering Item Type (LOST / FOUND)
  if (type) {
    if (type.toUpperCase() === 'LOST') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fca5a5',
          }}
        >
          <HelpCircle size={12} strokeWidth={2.5} />
          LOST
        </span>
      );
    }
    if (type.toUpperCase() === 'FOUND') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: '#dcfce7',
            color: '#15803d',
            border: '1px solid #86efac',
          }}
        >
          <Gift size={12} strokeWidth={2.5} />
          FOUND
        </span>
      );
    }
  }

  // If rendering Claim Status
  if (isClaim) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return (
          <span style={badgeStyle('#fef3c7', '#b45309', '#fde68a')}>
            <Clock size={12} />
            Claim Pending
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span style={badgeStyle('#e0e7ff', '#4338ca', '#c7d2fe')}>
            <Search size={12} />
            Under Verification
          </span>
        );
      case 'APPROVED':
        return (
          <span style={badgeStyle('#dcfce7', '#15803d', '#86efac')}>
            <CheckCircle size={12} />
            Claim Approved
          </span>
        );
      case 'HANDED_OVER':
      case 'RETURNED':
        return (
          <span style={badgeStyle('#f0fdf4', '#166534', '#bbf7d0')}>
            <CheckCircle size={12} />
            Handed Over
          </span>
        );
      case 'REJECTED':
        return (
          <span style={badgeStyle('#fee2e2', '#b91c1c', '#fca5a5')}>
            <XCircle size={12} />
            Rejected
          </span>
        );
      default:
        return <span style={badgeStyle('#f1f5f9', '#475569', '#cbd5e1')}>{status || 'Pending'}</span>;
    }
  }

  // Default Item Status (OPEN, CLAIM_PENDING, RETURNED, CLOSED)
  switch (status?.toUpperCase()) {
    case 'OPEN':
      return (
        <span style={badgeStyle('#eff6ff', '#1d4ed8', '#bfdbfe')}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
          Active
        </span>
      );
    case 'CLAIM_PENDING':
      return (
        <span style={badgeStyle('#fef3c7', '#b45309', '#fde68a')}>
          <Clock size={12} />
          Claim in Progress
        </span>
      );
    case 'RETURNED':
      return (
        <span style={badgeStyle('#dcfce7', '#15803d', '#86efac')}>
          <CheckCircle size={12} />
          Returned to Owner
        </span>
      );
    case 'CLOSED':
      return (
        <span style={badgeStyle('#f1f5f9', '#64748b', '#cbd5e1')}>
          Closed
        </span>
      );
    default:
      return <span style={badgeStyle('#f1f5f9', '#475569', '#cbd5e1')}>{status || 'Open'}</span>;
  }
};

const badgeStyle = (bg, color, border) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 8px',
  borderRadius: '9999px',
  fontSize: '0.72rem',
  fontWeight: 600,
  background: bg,
  color: color,
  border: `1px solid ${border}`,
});
