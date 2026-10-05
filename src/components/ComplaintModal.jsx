import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertTriangle,
  Zap,
  Upload,
  CheckCircle2,
  QrCode,
  Sparkles,
  Bot,
  Check,
} from 'lucide-react';
import { complaintsApi } from '../api/complaints';
import { QRScannerModal } from './QRScannerModal';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const CATEGORIES = [
  'Electrical',
  'Furniture',
  'Classroom',
  'Wi-Fi/Network',
  'Plumbing',
  'Cleaning',
  'Projector',
  'Fan/AC',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const ComplaintModal = ({
  isOpen,
  onClose,
  complaint,
  initialLocation,
  onSuccess,
  showToast,
}) => {
  const isEdit = Boolean(complaint);

  const [formData, setFormData] = useState({
    complaint_title: '',
    description: '',
    category: 'Electrical',
    location: '',
    location_id: '',
    priority: 'Medium',
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // QR pre-fill and picker state
  const [isQrPickerOpen, setIsQrPickerOpen] = useState(false);
  const [qrPrefilled, setQrPrefilled] = useState(false);

  // AI Image Analysis state
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [appliedAi, setAppliedAi] = useState(false);

  // Smart feature states
  const [hazardAlert, setHazardAlert] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (complaint) {
      setFormData({
        complaint_title: complaint.complaint_title || '',
        description: complaint.description || '',
        category: complaint.category || 'Electrical',
        location: complaint.location || '',
        location_id: complaint.location_id || '',
        priority: complaint.priority || 'Medium',
      });
      if (complaint.image) {
        setImagePreview(complaint.image);
      }
      if (complaint.ai_analysis) {
        setAiAnalysis(complaint.ai_analysis);
      }
      setQrPrefilled(Boolean(complaint.location_id));
    } else {
      let defaultLoc = '';
      let defaultLocId = '';
      let isPrefill = false;

      if (initialLocation) {
        defaultLoc = `${initialLocation.building}, ${initialLocation.floor}, ${initialLocation.room}`;
        defaultLocId = initialLocation.id || '';
        isPrefill = true;
      }

      setFormData({
        complaint_title: '',
        description: '',
        category: 'Electrical',
        location: defaultLoc,
        location_id: defaultLocId,
        priority: 'Medium',
      });
      setQrPrefilled(isPrefill);
      setImagePreview(null);
      setImageBase64(null);
      setAiAnalysis(null);
      setAppliedAi(false);
      setHazardAlert(null);
      setDuplicateWarning(null);
    }
    setErrors({});
  }, [complaint, initialLocation, isOpen]);

  // Real-time Priority Safety Check & Advanced AI Duplicate Detection
  useEffect(() => {
    if (!isOpen || isEdit) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      // 1. Safety Hazard Heuristic Detection
      const text = `${formData.complaint_title} ${formData.description}`.toLowerCase();
      const hazardWords = [
        'spark',
        'fire',
        'electric shock',
        'exposed wire',
        'dangerous',
        'emergency',
        'smoke',
        'gas leak',
        'blast',
        'short circuit',
        'hazard',
        'falling ceiling',
      ];
      const matched = hazardWords.filter((w) => text.includes(w));

      if (matched.length > 0) {
        setHazardAlert({
          words: matched,
          suggested: 'Critical',
          message: `Safety Emergency Detected ("${matched.join(', ')}"). Suggesting Critical Priority with direct emergency escalation.`,
        });
        if (formData.priority !== 'Critical') {
          setFormData((prev) => ({ ...prev, priority: 'Critical' }));
        }
      } else {
        setHazardAlert(null);
      }

      // 2. Advanced AI Duplicate Check
      if ((formData.location && formData.location.trim().length > 3) || formData.complaint_title.length > 3) {
        try {
          const res = await complaintsApi.checkDuplicate({
            category: formData.category,
            location: formData.location,
            title: formData.complaint_title,
            description: formData.description,
          });
          if (res.found_duplicates && res.duplicates && res.duplicates.length > 0) {
            setDuplicateWarning(res.duplicates[0]);
          } else {
            setDuplicateWarning(null);
          }
        } catch {
          // ignore background check errors
        }
      }
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData.complaint_title, formData.description, formData.location, formData.category, isOpen, isEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setAiAnalysis(null);
      setAppliedAi(false);
      setIsAnalyzingImage(true);

      // Convert to base64 and automatically dispatch to AI vision service
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        setImageBase64(base64);

        try {
          const result = await complaintsApi.analyzeImage(base64);
          if (result) {
            setAiAnalysis(result);
            if (showToast) {
              showToast(`AI Vision: Suggested ${result.category} (${result.severity} Priority)`, 'info');
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsAnalyzingImage(false);
        }
      };
      reader.onerror = () => {
        setIsAnalyzingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI-Powered Image Analysis (Manual Re-run option)
  const handleAnalyzeImage = async () => {
    const payload = imageBase64 || imagePreview;
    if (!payload) return;
    setIsAnalyzingImage(true);
    try {
      const result = await complaintsApi.analyzeImage(payload);
      if (result) {
        setAiAnalysis(result);
        if (showToast) showToast('AI Image Analysis completed successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('AI vision inspection service currently busy.', 'error');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Apply AI suggestions to form
  const handleApplyAiSuggestions = () => {
    if (!aiAnalysis) return;
    setFormData((prev) => ({
      ...prev,
      category: aiAnalysis.category || prev.category,
      priority: aiAnalysis.severity || prev.priority,
      description: prev.description
        ? `${prev.description}\n[AI Vision Note: ${aiAnalysis.reason}]`
        : aiAnalysis.reason,
    }));
    setAppliedAi(true);
    if (showToast) showToast('AI suggested category and severity applied!', 'info');
  };

  const handleSelectQrLocation = (loc) => {
    setFormData((prev) => ({
      ...prev,
      location: `${loc.building}, ${loc.floor}, ${loc.room}`,
      location_id: loc.id,
    }));
    setQrPrefilled(true);
    if (showToast) showToast(`Location prefilled from QR: ${loc.id}`, 'success');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.complaint_title.trim() || formData.complaint_title.trim().length < 2) {
      newErrors.complaint_title = 'Please enter a title (at least 2 characters).';
    }
    if (!formData.description.trim() || formData.description.trim().length < 3) {
      newErrors.description = 'Please explain the issue (at least 3 characters).';
    }
    if (!formData.location.trim() || formData.location.trim().length < 2) {
      newErrors.location = 'Please specify the building or room.';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required.';
    }
    if (!formData.priority) {
      newErrors.priority = 'Priority is required.';
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErr = Object.values(newErrors)[0];
      if (showToast) showToast(`Validation: ${firstErr}`, 'warning');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        complaint_title: formData.complaint_title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        location_id: formData.location_id || null,
        priority: formData.priority,
        image: imageBase64 || imagePreview || null,
        ai_analysis: aiAnalysis || null,
      };

      let ticketId = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;

      if (isEdit) {
        await complaintsApi.updateComplaint(complaint.id, payload);
        if (showToast) showToast('Complaint updated successfully.', 'success');
      } else {
        const res = await complaintsApi.createComplaint(payload);
        if (res) {
          ticketId = res.complaint_id || res.id || ticketId;
        }

        // Direct write to Firestore for maximum reliability across all deployments
        try {
          await addDoc(collection(db, 'complaints'), {
            complaint_id: ticketId,
            title: payload.complaint_title,
            category: payload.category,
            location: payload.location,
            description: payload.description,
            priority: payload.priority,
            status: 'Submitted',
            image: payload.image || '',
            userId: auth.currentUser?.uid || 'anonymous',
            userEmail: auth.currentUser?.email || 'student@campusfix.edu',
            createdAt: new Date().toISOString(),
            source: 'Report Issue Form',
          });
        } catch (fsErr) {
          console.warn('Firestore report write notice:', fsErr);
        }

        if (showToast) showToast(`Ticket ${ticketId} submitted & logged in database!`, 'success');
      }

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Submit complaint error:', err);
      if (showToast) showToast(err.message || 'Failed to submit complaint. Please check inputs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
        <div
          className="modal-content"
          style={{ maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '14px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isEdit ? 'Edit Maintenance Complaint' : 'Report a Campus Issue'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isEdit
                  ? `Updating ticket #${complaint.formatted_id || complaint.id}`
                  : 'Submit a maintenance request with smart QR location and AI image diagnostics.'}
              </p>
            </div>
            <button
              onClick={onClose}
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

          {/* Safety Hazard Banner */}
          {hazardAlert && (
            <div className="alert-hazard" style={{ marginBottom: '16px' }}>
              <Zap size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Safety Emergency Detected!</strong>
                <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>{hazardAlert.message}</div>
              </div>
            </div>
          )}

          {/* Advanced AI Duplicate Detection Banner (Exact User Spec) */}
          {duplicateWarning && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', marginBottom: '8px' }}>
                <AlertTriangle size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Potential duplicate detected.</span>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #fef3c7',
                  fontSize: '0.84rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#92400e', textTransform: 'uppercase', fontWeight: 600 }}>
                    Existing complaint:
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {duplicateWarning.formatted_id || `CMP-${1000 + duplicateWarning.id}`}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#92400e', textTransform: 'uppercase', fontWeight: 600 }}>
                    Similarity:
                  </div>
                  <div style={{ fontWeight: 800, color: '#d97706' }}>
                    {duplicateWarning.similarity_label || `${duplicateWarning.similarity}%`}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#92400e', textTransform: 'uppercase', fontWeight: 600 }}>
                    Location:
                  </div>
                  <div style={{ fontWeight: 600, color: '#334155' }}>
                    {duplicateWarning.location}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#92400e', textTransform: 'uppercase', fontWeight: 600 }}>
                    Status:
                  </div>
                  <div style={{ fontWeight: 700, color: '#7e22ce' }}>
                    {duplicateWarning.status}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#78350f', marginTop: '8px' }}>
                A technician may already be inspecting this area. You may still proceed if your issue is separate.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Complaint Title */}
            <div className="form-group">
              <label className="form-label">
                Complaint Title <span className="required">*</span>
              </label>
              <input
                type="text"
                name="complaint_title"
                className="form-control"
                placeholder="e.g. Water leak in Central Library, Broken bench row 4"
                value={formData.complaint_title}
                onChange={handleChange}
              />
              {errors.complaint_title && <div className="form-error">{errors.complaint_title}</div>}
            </div>

            {/* Location with QR prefill badge & Quick Scanner */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Location / Room <span className="required">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsQrPickerOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    color: 'var(--primary-600)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <QrCode size={13} />
                  Scan / Select QR Code
                </button>
              </div>

              {/* QR Auto-fill Confirmation Badge */}
              {qrPrefilled && formData.location_id && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    marginBottom: '8px',
                    fontSize: '0.8rem',
                    color: '#166534',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} color="#22c55e" />
                    <span>Auto-filled from QR code: <strong>{formData.location_id}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQrPrefilled(false);
                      setFormData((prev) => ({ ...prev, location_id: '' }));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#15803d',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Clear QR link
                  </button>
                </div>
              )}

              <input
                type="text"
                name="location"
                className="form-control"
                placeholder="e.g. Technology Block C, 3rd Floor, Lab 304"
                value={formData.location}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                You can freely edit or type any specific campus room, desk number, or landmark.
              </span>
              {errors.location && <div className="form-error">{errors.location}</div>}
            </div>

            {/* Category and Priority Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">
                  Category <span className="required">*</span>
                </label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <div className="form-error">{errors.category}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Priority <span className="required">*</span>
                </label>
                <select
                  name="priority"
                  className="form-select"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  {PRIORITIES.map((prio) => (
                    <option key={prio} value={prio}>
                      {prio}
                    </option>
                  ))}
                </select>
                {errors.priority && <div className="form-error">{errors.priority}</div>}
              </div>
            </div>

            {/* Detailed Description */}
            <div className="form-group">
              <label className="form-label">
                Detailed Description <span className="required">*</span>
              </label>
              <textarea
                name="description"
                className="form-control"
                placeholder="Provide specific details about the issue to help maintenance staff prepare the correct equipment..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>

            {/* Issue Attachment Image & Automated AI Vision Diagnostics */}
            <div className="form-group" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--primary-600)" />
                  Issue Photo & Automated AI Vision Analysis
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzingImage}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: isAnalyzingImage ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <Bot size={14} />
                    {isAnalyzingImage ? 'Analyzing...' : 'Re-analyze with AI'}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#ffffff',
                    border: '1px dashed #94a3b8',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={16} />
                  <span>{imagePreview ? 'Change Photo' : 'Upload Issue Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </label>

                {imagePreview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '56px',
                        height: '56px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageBase64(null);
                        setAiAnalysis(null);
                        setAppliedAi(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Real-time Analysis Progress Banner */}
              {isAnalyzingImage && (
                <div
                  style={{
                    marginTop: '12px',
                    background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                    border: '1px dashed #8b5cf6',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#5b21b6',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #ddd6fe',
                      borderTopColor: '#7c3aed',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                      AI Vision Inspector Analyzing Damage & Hazards...
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6d28d9', marginTop: '2px' }}>
                      Processing image with AI vision service to recommend issue category, severity, and maintenance department.
                    </div>
                  </div>
                </div>
              )}

              {/* AI Suggested Classification (User Spec) */}
              {aiAnalysis && (
                <div
                  style={{
                    marginTop: '14px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #c7d2fe',
                    padding: '14px 16px',
                    boxShadow: '0 2px 10px rgba(99, 102, 241, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                      <Sparkles size={16} />
                      AI Suggested Classification
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#047857',
                        background: '#d1fae5',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {Math.round(aiAnalysis.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '8px',
                      fontSize: '0.8rem',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Suggested Category</span>
                      <strong style={{ color: '#1e293b' }}>{aiAnalysis.category}</strong>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Severity / Priority</span>
                      <strong style={{ color: aiAnalysis.severity === 'Critical' ? '#dc2626' : aiAnalysis.severity === 'High' ? '#ea580c' : '#4338ca' }}>
                        {aiAnalysis.severity}
                      </strong>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Recommended Dept</span>
                      <strong style={{ color: '#1e293b' }}>{aiAnalysis.department}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45, marginBottom: '12px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>Diagnostic Reason: </span>
                    {aiAnalysis.reason}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Click to apply recommendations to form fields:
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyAiSuggestions}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: appliedAi ? '#15803d' : 'var(--primary-600)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '7px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
                      }}
                    >
                      {appliedAi ? <Check size={14} /> : <Sparkles size={14} />}
                      {appliedAi ? 'Suggestions Applied' : 'Apply AI Suggestions'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '22px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: '150px' }}
              >
                {loading ? 'Submitting...' : isEdit ? 'Save Changes' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sub-modal: Campus QR Scanner */}
      <QRScannerModal
        isOpen={isQrPickerOpen}
        onClose={() => setIsQrPickerOpen(false)}
        onSelectLocation={handleSelectQrLocation}
        showToast={showToast}
      />
    </>
  );
};
