import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

/**
 * SlaCountdownBadge
 * Displays real-time ticking countdowns, approaching warnings, and breached alerts for complaint SLAs.
 */
export const SlaCountdownBadge = ({
  complaint,
  deadline,
  status,
  priority,
  resolvedAt,
  createdAt,
  compact = false,
  showIcon = true,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Tick every 5 seconds to keep live countdown accurate without excessive renders
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const compStatus = status || complaint?.status || 'Submitted';
  const compPriority = priority || complaint?.priority || 'Medium';
  const compCreatedAt = createdAt || complaint?.created_at || new Date().toISOString();
  const compResolvedAt = resolvedAt || complaint?.resolved_at || null;

  // Derive target minutes from priority if not provided
  const getTargetMinutes = (prio) => {
    switch (prio) {
      case 'Critical':
        return 15;
      case 'High':
        return 60;
      case 'Medium':
        return 240;
      case 'Low':
        return 1440;
      default:
        return 240;
    }
  };

  const targetMinutes = complaint?.sla_target_minutes || getTargetMinutes(compPriority);
  const createdTime = new Date(compCreatedAt).getTime();
  const deadlineTime = deadline
    ? new Date(deadline).getTime()
    : complaint?.sla_deadline
    ? new Date(complaint.sla_deadline).getTime()
    : createdTime + targetMinutes * 60 * 1000;

  // Format duration helper
  const formatDuration = (totalMinutes) => {
    const absMin = Math.abs(totalMinutes);
    if (absMin < 1) return '< 1m';
    if (absMin < 60) return `${absMin}m`;
    const hours = Math.floor(absMin / 60);
    const mins = absMin % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // 1. Resolved State
  if (compStatus === 'Resolved') {
    const resTime = compResolvedAt ? new Date(compResolvedAt).getTime() : now;
    const isMet = resTime <= deadlineTime;
    const elapsedMinutes = Math.max(1, Math.round((resTime - createdTime) / 60000));

    if (isMet) {
      return (
        <span
          className="sla-badge sla-met"
          title={`SLA Target: ${formatDuration(targetMinutes)} • Resolved in ${formatDuration(elapsedMinutes)} (Met Deadline)`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: compact ? '0.72rem' : '0.78rem',
            fontWeight: 700,
            padding: compact ? '2px 7px' : '4px 9px',
            borderRadius: '6px',
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            whiteSpace: 'nowrap',
          }}
        >
          {showIcon && <CheckCircle2 size={compact ? 12 : 13} />}
          <span>SLA Met ({formatDuration(elapsedMinutes)})</span>
        </span>
      );
    } else {
      const overdueMinutes = Math.round((resTime - deadlineTime) / 60000);
      return (
        <span
          className="sla-badge sla-breached-resolved"
          title={`SLA Target: ${formatDuration(targetMinutes)} • Resolved ${formatDuration(overdueMinutes)} past deadline`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: compact ? '0.72rem' : '0.78rem',
            fontWeight: 700,
            padding: compact ? '2px 7px' : '4px 9px',
            borderRadius: '6px',
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            whiteSpace: 'nowrap',
          }}
        >
          {showIcon && <AlertCircle size={compact ? 12 : 13} />}
          <span>SLA Breached (+{formatDuration(overdueMinutes)})</span>
        </span>
      );
    }
  }

  // 2. Rejected / Cancelled state
  if (['Rejected', 'Cancelled'].includes(compStatus)) {
    return null;
  }

  // 3. Active / In-Flight State
  const remainingMs = deadlineTime - now;
  const remainingMinutes = Math.round(remainingMs / 60000);
  const isBreached = remainingMs <= 0;
  const isApproaching = !isBreached && (remainingMinutes <= 30 || remainingMinutes <= targetMinutes * 0.25);

  if (isBreached) {
    const overdueMinutes = Math.abs(remainingMinutes);
    return (
      <span
        className="sla-badge sla-breached-active animate-pulse"
        title={`SLA Deadline Breached! Target was ${formatDuration(targetMinutes)}. Overdue by ${formatDuration(overdueMinutes)}.`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: compact ? '0.72rem' : '0.78rem',
          fontWeight: 800,
          padding: compact ? '2px 7px' : '4px 9px',
          borderRadius: '6px',
          background: '#fee2e2',
          color: '#b91c1c',
          border: '1px solid #f87171',
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.35)',
          whiteSpace: 'nowrap',
        }}
      >
        {showIcon && <ShieldAlert size={compact ? 12 : 14} className="text-red-600 animate-bounce" />}
        <span>BREACHED (-{formatDuration(overdueMinutes)})</span>
      </span>
    );
  }

  if (isApproaching) {
    return (
      <span
        className="sla-badge sla-approaching"
        title={`Warning: SLA Deadline approaching! Only ${formatDuration(remainingMinutes)} remaining out of ${formatDuration(targetMinutes)}.`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: compact ? '0.72rem' : '0.78rem',
          fontWeight: 800,
          padding: compact ? '2px 7px' : '4px 9px',
          borderRadius: '6px',
          background: '#fffbeb',
          color: '#b45309',
          border: '1px solid #fde68a',
          boxShadow: '0 0 6px rgba(245, 158, 11, 0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        {showIcon && <AlertTriangle size={compact ? 12 : 13} />}
        <span>Expiring ({formatDuration(remainingMinutes)})</span>
      </span>
    );
  }

  // On Track
  return (
    <span
      className="sla-badge sla-on-track"
      title={`SLA On Track: ${formatDuration(remainingMinutes)} remaining out of ${formatDuration(targetMinutes)} target.`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: compact ? '0.72rem' : '0.78rem',
        fontWeight: 600,
        padding: compact ? '2px 7px' : '4px 9px',
        borderRadius: '6px',
        background: '#eff6ff',
        color: '#1d4ed8',
        border: '1px solid #bfdbfe',
        whiteSpace: 'nowrap',
      }}
    >
      {showIcon && <Clock size={compact ? 12 : 13} />}
      <span>SLA: {formatDuration(remainingMinutes)} left</span>
    </span>
  );
};
