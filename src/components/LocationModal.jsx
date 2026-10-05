import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { locationsApi } from '../api/locations';

const LOCATION_TYPES = [
  'Classroom',
  'Laboratory',
  'Office',
  'Hostel',
  'Library',
  'Cafeteria',
  'Restroom',
  'Workshop',
  'Auditorium',
];

export const LocationModal = ({ isOpen, onClose, location, onSuccess, showToast }) => {
  const isEdit = Boolean(location);

  const [formData, setFormData] = useState({
    id: '',
    building: '',
    floor: '1st Floor',
    room: '',
    department: '',
    type: 'Classroom',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location) {
      setFormData({
        id: location.id || '',
        building: location.building || '',
        floor: location.floor || '1st Floor',
        room: location.room || '',
        department: location.department || '',
        type: location.type || 'Classroom',
        notes: location.notes || '',
      });
    } else {
      setFormData({
        id: '',
        building: '',
        floor: '1st Floor',
        room: '',
        department: 'General Campus',
        type: 'Classroom',
        notes: '',
      });
    }
    setErrors({});
  }, [location, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.building.trim()) errs.building = 'Building name is required.';
    if (!formData.room.trim()) errs.room = 'Room name or number is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await locationsApi.updateLocation(location.id, formData);
        if (showToast) showToast('Campus location updated.', 'success');
      } else {
        await locationsApi.createLocation(formData);
        if (showToast) showToast('Campus location & QR code generated successfully.', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Failed to save location.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1150 }}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isEdit ? 'Edit Campus Location' : 'Register New Campus Location & QR'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Assign a unique location ID and generate a scannable QR code.
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

        <form onSubmit={handleSubmit}>
          {/* Custom ID (Optional) */}
          <div className="form-group">
            <label className="form-label">Location ID (Optional - auto-generated if blank)</label>
            <input
              type="text"
              name="id"
              className="form-control"
              placeholder="e.g. LOC-CSE-204"
              value={formData.id}
              onChange={handleChange}
              disabled={isEdit}
              style={{ textTransform: 'uppercase' }}
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
              Unique identifier printed on the physical QR badge.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Building */}
            <div className="form-group">
              <label className="form-label">Building / Block <span className="required">*</span></label>
              <input
                type="text"
                name="building"
                className="form-control"
                placeholder="e.g. Technology Block C"
                value={formData.building}
                onChange={handleChange}
              />
              {errors.building && <div className="form-error">{errors.building}</div>}
            </div>

            {/* Floor */}
            <div className="form-group">
              <label className="form-label">Floor</label>
              <input
                type="text"
                name="floor"
                className="form-control"
                placeholder="e.g. 3rd Floor, Ground Floor"
                value={formData.floor}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            {/* Room / Lab */}
            <div className="form-group">
              <label className="form-label">Room / Lab Name <span className="required">*</span></label>
              <input
                type="text"
                name="room"
                className="form-control"
                placeholder="e.g. Lab 304, Lecture Hall 101"
                value={formData.room}
                onChange={handleChange}
              />
              {errors.room && <div className="form-error">{errors.room}</div>}
            </div>

            {/* Location Type */}
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                name="type"
                className="form-select"
                value={formData.type}
                onChange={handleChange}
              >
                {LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department */}
          <div className="form-group">
            <label className="form-label">Department / Wing</label>
            <input
              type="text"
              name="department"
              className="form-control"
              placeholder="e.g. Computer Science & Engineering"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Location Notes / Landmarks</label>
            <input
              type="text"
              name="notes"
              className="form-control"
              placeholder="e.g. Near West Staircase, 45 student computers"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving Location...' : isEdit ? 'Save Changes' : 'Generate Location & QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
