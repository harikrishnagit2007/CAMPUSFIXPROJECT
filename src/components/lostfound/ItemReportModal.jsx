import React, { useState } from 'react';
import { X, HelpCircle, Gift, MapPin, Calendar, Tag, ShieldCheck, Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { lostAndFoundApi } from '../../api/lostAndFound';

const CATEGORIES = [
  'Electronics',
  'ID Cards & Keys',
  'Wallets & Bags',
  'Books & Notebooks',
  'Personal Belongings',
  'Sports Equipment',
  'Clothing & Accessories',
  'Other Items',
];

const CAMPUS_BUILDINGS = [
  'Science Block B',
  'Technology Block C',
  'Central Library',
  'Mechanical Workshop Block',
  'Main Administrative Building',
  'Student Center & Canteen',
  'Sports Complex & Ground',
  'Indoor Auditorium',
  'Hostel Block 1',
  'Hostel Block 2',
];

export const ItemReportModal = ({ isOpen, onClose, initialType = 'LOST', onSuccess, showToast }) => {
  const { user } = useAuth();

  const [type, setType] = useState(initialType);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electronics',
    building: CAMPUS_BUILDINGS[0],
    location: '',
    dateOccurred: new Date().toISOString().split('T')[0],
    description: '',
    identifyingMarks: '',
    holdingLocation: '',
    image: null,
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Please select a valid image file (PNG, JPG, WEBP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('Image size should be less than 5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setImagePreview(dataUrl);
      setFormData((prev) => ({ ...prev, image: dataUrl }));
      if (showToast) showToast('Photo attached successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  // Sync initial type when opened
  React.useEffect(() => {
    if (isOpen) {
      setType(initialType);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter an item name/title.', 'warning');
      return;
    }
    if (!formData.location.trim()) {
      showToast('Please specify the campus location (e.g. Room, floor, bench).', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type,
        title: formData.title.trim(),
        category: formData.category,
        building: formData.building,
        location: `${formData.building} - ${formData.location.trim()}`,
        dateOccurred: formData.dateOccurred,
        description: formData.description.trim(),
        identifyingMarks: formData.identifyingMarks.trim(),
        holdingLocation: type === 'FOUND' ? (formData.holdingLocation.trim() || 'Campus Security Main Desk') : '',
        image: formData.image || '',
        reporterId: user ? String(user.id || user.uid) : 'anonymous',
        reporterName: user?.name || user?.username || 'Campus Student',
        reporterRole: user?.role || 'STUDENT',
        contactEmail: formData.contactEmail || user?.email || '',
        contactPhone: formData.contactPhone || user?.phone || '',
      };

      const result = await lostAndFoundApi.createItem(payload);
      showToast(`Successfully registered ${type === 'LOST' ? 'Lost Item' : 'Found Item'} report (#${result.itemCode})!`, 'success');

      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Could not register item report. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: type === 'LOST' ? '#fee2e2' : '#dcfce7',
                color: type === 'LOST' ? '#b91c1c' : '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {type === 'LOST' ? <HelpCircle size={20} /> : <Gift size={20} />}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>
                {type === 'LOST' ? 'Report a Lost Item' : 'Report a Found Item'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {type === 'LOST'
                  ? 'File details so campus members and security staff can help you locate it.'
                  : 'Log an item you discovered on campus so the rightful owner can claim it.'}
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Type Switcher */}
            <div style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Report Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setType('LOST')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: type === 'LOST' ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
                    background: type === 'LOST' ? '#fef2f2' : '#ffffff',
                    color: type === 'LOST' ? '#b91c1c' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <HelpCircle size={16} />
                  I Lost Something
                </button>
                <button
                  type="button"
                  onClick={() => setType('FOUND')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: type === 'FOUND' ? '2px solid #22c55e' : '1px solid var(--border-subtle)',
                    background: type === 'FOUND' ? '#f0fdf4' : '#ffffff',
                    color: type === 'FOUND' ? '#15803d' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <Gift size={16} />
                  I Found Something
                </button>
              </div>
            </div>

            {/* Title & Category */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">
                  Item Title / Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dell Inspiron Charger / Casio FX-991"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campus Building & Specific Location */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Campus Building / Area</label>
                <select
                  className="form-control"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                >
                  {CAMPUS_BUILDINGS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Specific Spot / Room <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Room 304, 2nd row bench, water cooler"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Date Occurred */}
            <div className="form-group">
              <label className="form-label">
                Date {type === 'LOST' ? 'Lost' : 'Found'}
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.dateOccurred}
                onChange={(e) => setFormData({ ...formData, dateOccurred: e.target.value })}
              />
            </div>

            {/* Identifying Marks & Secret Details */}
            <div className="form-group">
              <label className="form-label">
                Distinctive Marks & Identifiers
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  (Colors, stickers, serial #, scratches - used by Match Finder)
                </span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Circular blue sticker on top, silver clasp, initial 'H' written"
                value={formData.identifyingMarks}
                onChange={(e) => setFormData({ ...formData, identifyingMarks: e.target.value })}
              />
            </div>

            {/* Found Item Holding Location */}
            {type === 'FOUND' && (
              <div className="form-group" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ color: '#0f172a', fontWeight: 600 }}>
                  Current Holding Location / Safe Custody
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Handed over to Gate 1 Security / Kept at CSE HOD Office"
                  value={formData.holdingLocation}
                  onChange={(e) => setFormData({ ...formData, holdingLocation: e.target.value })}
                />
                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  Where the rightful owner can physically collect the item after claim verification.
                </span>
              </div>
            )}

            {/* Item Photograph Upload */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} style={{ color: 'var(--primary-color)' }} />
                  Item Photograph / Proof Photo (Optional)
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</span>
              </label>

              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#f8fafc', padding: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={imagePreview}
                    alt="Uploaded item preview"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Photo Attached</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ready to be stored with report</div>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#dc2626', borderColor: '#fca5a5' }}
                    title="Remove attached photo"
                  >
                    <Trash2 size={14} style={{ marginRight: '4px' }} />
                    Remove
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: '10px',
                    background: 'rgba(248, 250, 252, 0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      const fakeEvent = { target: { files: [file] } };
                      handleImageChange(fakeEvent);
                    }
                  }}
                >
                  <Upload size={22} style={{ color: 'var(--text-secondary)', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Click to browse or drag and drop photo
                  </span>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Helps other students recognize the item accurately
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Provide any additional context or circumstances..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Contact Details */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
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
              style={{
                background: type === 'LOST' ? '#dc2626' : '#16a34a',
                borderColor: type === 'LOST' ? '#b91c1c' : '#15803d',
              }}
            >
              {submitting ? 'Registering...' : `Submit ${type === 'LOST' ? 'Lost' : 'Found'} Report`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
