import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Wrench,
  Shield,
  Edit3,
  Trash2,
  Flame,
  AlertOctagon,
  Copy,
  Sparkles,
  QrCode,
  Clock,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SlaCountdownBadge } from './SlaCountdownBadge';
import { VisualTimeline } from './VisualTimeline';
import { useAuth } from '../context/AuthContext';
import { complaintsApi } from '../api/complaints';
import { QRBadgeModal } from './QRBadgeModal';
import { locationsApi } from '../api/locations';

export const ComplaintDetailModal = ({
  isOpen,
  onClose,
  complaint,
  onEdit,
  onDelete,
  onAssignStaff,
  onUpdateStatus,
  onRefresh,
  staffList = [],
  showToast,
}) => {
  const { isAdmin, isStudent, isStaff, user } = useAuth();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Emergency escalation state
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [showEscalationForm, setShowEscalationForm] = useState(false);

  // Duplicate linking state
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkNote, setLinkNote] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Location QR view
  const [viewLocationQr, setViewLocationQr] = useState(null);

  useEffect(() => {
    if (complaint && isOpen) {
      setSelectedStaffId(complaint.assigned_staff || '');
      setSelectedStatus(complaint.status || 'Submitted');
      setShowEscalationForm(false);
      loadPotentialDuplicates();
    }
  }, [complaint, isOpen]);

  const loadPotentialDuplicates = async () => {
    if (!complaint) return;
    setLoadingDuplicates(true);
    try {
      const res = await complaintsApi.checkDuplicate({
        category: complaint.category,
        location: complaint.location,
        title: complaint.complaint_title,
        description: complaint.description,
        exclude_id: complaint.id,
      });
      setPotentialDuplicates(res.duplicates || []);
    } catch {
      // ignore
    } finally {
      setLoadingDuplicates(false);
    }
  };

  if (!isOpen || !complaint) return null;

  const handleStaffChange = (e) => {
    const sId = e.target.value;
    setSelectedStaffId(sId);
    if (onAssignStaff) {
      onAssignStaff(complaint.id, sId);
    }
  };

  const handleStatusChange = (e) => {
    const st = e.target.value;
    setSelectedStatus(st);
    if (onUpdateStatus) {
      onUpdateStatus(complaint.id, st);
    }
  };

  const handleTriggerEmergency = async () => {
    setIsEscalating(true);
    try {
      await complaintsApi.escalateEmergency(complaint.id, {
        reason: escalationReason || 'Safety Hazard: Immediate dispatch requested by inspector.',
        target_department: complaint.category,
      });
      if (showToast) showToast('Emergency protocol activated! High priority dispatch alert logged.', 'success');
      setShowEscalationForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to trigger emergency protocol.', 'error');
    } finally {
      setIsEscalating(false);
    }
  };

  const handleLinkDuplicate = async () => {
    if (!linkTargetId) return;
    setIsLinking(true);
    try {
      await complaintsApi.linkDuplicate(complaint.id, {
        duplicate_of_id: Number(linkTargetId),
        note: linkNote || `Linked as duplicate of #${linkTargetId}`,
      });
      if (showToast) showToast(`Linked complaint to #${linkTargetId}`, 'success');
      setLinkTargetId('');
      setLinkNote('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to link duplicate complaint.', 'error');
    } finally {
      setIsLinking(false);
    }
  };

  const handleOpenLocationQR = async () => {
    if (!complaint.location_id) return;
    try {
      const loc = await locationsApi.getLocation(complaint.location_id);
      setViewLocationQr(loc);
    } catch {
      if (showToast) showToast('Could not load QR code for this location ID.', 'error');
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
        <div
          className="modal-content"
          style={{ maxWidth: '750px', maxHeight: '92vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Emergency Escalation Alert Banner */}
          {(complaint.is_emergency || complaint.priority === 'Critical') && (
            <div
              style={{
                background: 'linear-gradient(90deg, #991b1b, #dc2626)',
                color: 'white',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Flame size={22} color="#fef08a" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.04em' }}>
                    EMERGENCY SAFETY PROTOCOL ACTIVE
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#fee2e2' }}>
                    {complaint.emergency_notes || 'Priority 1 Hazard: Dispatched for rapid containment and response.'}
                  </div>
                </div>
              </div>

              {complaint.escalated_at && (
                <div style={{ textAlign: 'right', fontSize: '0.74rem', color: '#fef08a' }}>
                  <div>Escalated: {new Date(complaint.escalated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>By: {complaint.escalated_by || 'Safety System'}</div>
                </div>
              )}
            </div>
          )}

          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--primary-600)',
                    background: 'var(--primary-50)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  #{complaint.formatted_id || complaint.id}
                </span>

                {complaint.location_id && (
                  <button
                    onClick={handleOpenLocationQR}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#4338ca',
                      background: '#e0e7ff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #c7d2fe',
                      cursor: 'pointer',
                    }}
                  >
                    <QrCode size={12} /> {complaint.location_id}
                  </button>
                )}

                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                <SlaCountdownBadge complaint={complaint} />

                {complaint.merged_into_id && (
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#92400e',
                      background: '#fef3c7',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Duplicate of #{complaint.merged_into_id}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {complaint.complaint_title}
              </h2>
            </div>

            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Visual Progress Timeline */}
          <div
            style={{
              background: '#f8fafc',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '22px',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                marginBottom: '10px',
              }}
            >
              Complaint Resolution Progress
            </div>
            <VisualTimeline currentStatus={complaint.status} resolvedAt={complaint.resolved_at} />
          </div>

          {/* Meta details grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Location
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{complaint.location}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Reported On
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {new Date(complaint.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wrench size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Category
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{complaint.category}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  SLA Target & Deadline
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {complaint.sla_deadline ? new Date(complaint.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Standard SLA'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '22px' }}>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Description
            </div>
            <div
              style={{
                background: '#ffffff',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                lineHeight: 1.6,
                fontSize: '0.92rem',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-line',
              }}
            >
              {complaint.description}
            </div>
          </div>

          {/* AI Suggested Classification (if available) */}
          {complaint.ai_analysis && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                border: '1px solid #c4b5fd',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: '#6d28d9', marginBottom: '8px' }}>
                <Sparkles size={16} /> AI Suggested Classification
                <span style={{ fontSize: '0.72rem', background: '#ddd6fe', padding: '1px 6px', borderRadius: '4px', marginLeft: 'auto' }}>
                  {Math.round(complaint.ai_analysis.confidence * 100)}% Confidence
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', marginBottom: '6px', flexWrap: 'wrap' }}>
                <div><strong>Category:</strong> {complaint.ai_analysis.category}</div>
                <div><strong>Severity:</strong> {complaint.ai_analysis.severity}</div>
                <div><strong>Department:</strong> {complaint.ai_analysis.department}</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4c1d95' }}>
                {complaint.ai_analysis.reason}
              </div>
            </div>
          )}

          {/* Image Attachment (if exists) */}
          {complaint.image && (
            <div style={{ marginBottom: '22px' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                Attached Photo
              </div>
              <img
                src={complaint.image}
                alt="Attachment"
                style={{
                  maxWidth: '100%',
                  maxHeight: '260px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          {/* Submitter & Assigned Staff Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginBottom: '22px',
            }}
          >
            {/* Submitter Card */}
            <div
              style={{
                padding: '14px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                <User size={14} /> Submitting Student
              </div>
              {complaint.student_details ? (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{complaint.student_details.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {complaint.student_details.department || 'Department Student'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginTop: '4px',
                    }}
                  >
                    <Mail size={12} /> {complaint.student_details.email}
                  </div>
                  {complaint.student_details.phone && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginTop: '2px',
                      }}
                    >
                      <Phone size={12} /> {complaint.student_details.phone}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Student Profile Not Loaded</div>
              )}
            </div>

            {/* Assigned Staff Card */}
            <div
              style={{
                padding: '14px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                <Shield size={14} /> Assigned Technician
              </div>
              {complaint.assigned_staff_details ? (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{complaint.assigned_staff_details.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 500 }}>
                    {complaint.assigned_staff_details.specialization}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginTop: '4px',
                    }}
                  >
                    <Mail size={12} /> {complaint.assigned_staff_details.email}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginTop: '2px',
                    }}
                  >
                    <Phone size={12} /> {complaint.assigned_staff_details.phone}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
                  No maintenance technician assigned yet.
                </div>
              )}
            </div>
          </div>

          {/* Emergency Escalation Trigger (Staff / Admin / Student) */}
          {!complaint.is_emergency && complaint.status !== 'Resolved' && (
            <div
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#9f1239', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertOctagon size={16} /> Escalate to Emergency Response
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#be123c', marginTop: '2px' }}>
                    If this issue poses an immediate life-safety, fire, or severe flood hazard, trigger priority dispatch.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEscalationForm(!showEscalationForm)}
                  style={{
                    background: '#e11d48',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {showEscalationForm ? 'Cancel' : 'Trigger Emergency'}
                </button>
              </div>

              {showEscalationForm && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #fecdd3', paddingTop: '10px' }}>
                  <input
                    type="text"
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Specify danger (e.g. active sparking wire, flooding near electrical breaker)..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #fda4af',
                      fontSize: '0.85rem',
                      marginBottom: '10px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleTriggerEmergency}
                    disabled={isEscalating}
                    style={{
                      background: '#be123c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '7px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isEscalating ? 'Activating Emergency Dispatch...' : 'Confirm Emergency Escalation'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin Controls & Duplicate Linking */}
          {isAdmin && (
            <div
              style={{
                background: '#eef2ff',
                padding: '16px 18px',
                borderRadius: '12px',
                border: '1px solid #c7d2fe',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '12px' }}>
                Administrative Controls & Assignment
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>
                    Assign Staff Member
                  </label>
                  <select
                    className="form-select"
                    style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                    value={complaint.assigned_staff || ''}
                    onChange={handleStaffChange}
                  >
                    <option value="">-- Unassigned --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.specialization} - {s.availability})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>
                    Update Status
                  </label>
                  <select
                    className="form-select"
                    style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                    value={complaint.status}
                    onChange={handleStatusChange}
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Duplicate Complaints Review & Merge/Link (User Spec) */}
              <div style={{ borderTop: '1px solid #c7d2fe', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-800)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Copy size={14} /> Review & Link Duplicate Complaints
                </div>

                {potentialDuplicates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    {potentialDuplicates.map((dup) => (
                      <div
                        key={dup.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e0e7ff',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary-600)' }}>
                              #{dup.formatted_id || `CMP-${1000 + dup.id}`}
                            </span>
                            <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              {dup.similarity_label || `${dup.similarity}%`} Similarity
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Status: {dup.status}</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                            {dup.complaint_title}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setLinkTargetId(String(dup.id));
                            setLinkNote(`Linked as duplicate of ${dup.formatted_id || `#${dup.id}`}`);
                          }}
                          style={{
                            background: linkTargetId === String(dup.id) ? '#4338ca' : '#e0e7ff',
                            color: linkTargetId === String(dup.id) ? 'white' : '#4338ca',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          {linkTargetId === String(dup.id) ? 'Selected' : 'Link As Duplicate'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
                    No high-confidence duplicate issues found for this record.
                  </div>
                )}

                {linkTargetId && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={linkNote}
                      onChange={(e) => setLinkNote(e.target.value)}
                      placeholder="Note for linkage (e.g. Master ticket is CMP-1001)..."
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe',
                        fontSize: '0.8rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleLinkDuplicate}
                      disabled={isLinking}
                      style={{
                        background: 'var(--primary-600)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isLinking ? 'Linking...' : 'Confirm Link'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Staff Quick Action */}
          {isStaff && (
            <div
              style={{
                background: '#f5f3ff',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid #ddd6fe',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6d28d9', marginBottom: '8px' }}>
                Technician Quick Actions
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onUpdateStatus(complaint.id, 'In Progress')}
                  disabled={complaint.status === 'In Progress'}
                >
                  Mark In Progress
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onUpdateStatus(complaint.id, 'Resolved')}
                  disabled={complaint.status === 'Resolved'}
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px',
            }}
          >
            <div>
              {isStudent && (
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {complaint.status === 'Submitted'
                    ? '✓ Editable before maintenance assignment.'
                    : `Ticket status is '${complaint.status}'.`}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {(isAdmin || (isStudent && complaint.status === 'Submitted')) && (
                <>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onClose();
                      onEdit(complaint);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      onClose();
                      onDelete(complaint);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={14} />
                    <span>{isStudent ? 'Cancel Issue' : 'Delete'}</span>
                  </button>
                </>
              )}
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location QR Code Poster Sub-modal */}
      <QRBadgeModal
        isOpen={Boolean(viewLocationQr)}
        onClose={() => setViewLocationQr(null)}
        location={viewLocationQr}
        showToast={showToast}
      />
    </>
  );
};
