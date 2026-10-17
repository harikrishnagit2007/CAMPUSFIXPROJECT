import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  HelpCircle,
  MapPin,
  Calendar,
  Tag,
  FileText,
  RotateCcw,
  CheckCircle,
  Clock,
  Sparkles,
  X,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { lostFoundService } from '../services/api';

const CATEGORIES = [
  'Electronics',
  'ID Cards & Keys',
  'Wallets & Bags',
  'Books & Notebooks',
  'Personal Belongings',
  'Clothing & Accessories',
  'Sports Equipment',
  'Other Items',
];

export const LostFoundModule = ({ showToast }) => {
  const { user } = useAuth();

  // Reports state
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Form toggle state (inline form panel in .glass-panel)
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields for submitting new lost items
  const [formData, setFormData] = useState({
    itemName: '',
    category: CATEGORIES[0],
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState({});

  // Load existing reports using the centralized api service
  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await lostFoundService.fetchLostFoundItems({ type: 'LOST' });
      setReports(data || []);
    } catch (err) {
      console.warn('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.itemName.trim()) {
      errors.itemName = 'Item name is required.';
    }
    if (!formData.location.trim()) {
      errors.location = 'Please specify the campus location where the item was lost.';
    }
    if (!formData.date) {
      errors.date = 'Date lost is required.';
    }
    if (!formData.description.trim()) {
      errors.description = 'Please provide identifying characteristics or a description.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit new lost item report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      if (showToast) showToast('Please complete all required fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: 'LOST',
        itemName: formData.itemName.trim(),
        title: formData.itemName.trim(),
        category: formData.category,
        location: formData.location.trim(),
        date: formData.date,
        dateOccurred: formData.date,
        description: formData.description.trim(),
        identifyingMarks: formData.description.trim(),
        reporterId: user ? String(user.id || user.uid) : 'anonymous',
        reporterName: user?.name || user?.username || 'Campus Student',
        reporterRole: user?.role || 'STUDENT',
        contactEmail: user?.email || '',
        contactPhone: user?.phone || '',
      };

      const created = await lostFoundService.createLostFoundItem(payload);
      if (showToast) {
        showToast(`Lost item report (#${created.itemCode || created.id}) submitted successfully!`, 'success');
      }

      // Reset form fields
      setFormData({
        itemName: '',
        category: CATEGORIES[0],
        description: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
      });
      setFormErrors({});
      setIsFormVisible(false);

      // Refresh reports list
      await fetchReports();
    } catch (err) {
      console.error('Error submitting report:', err);
      if (showToast) showToast('Failed to submit report. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered reports for search
  const filteredReports = reports.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (item.itemName || item.title || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const loc = (item.location || item.building || '').toLowerCase();
      const desc = (item.description || item.identifyingMarks || '').toLowerCase();
      const code = (item.itemCode || '').toLowerCase();

      return name.includes(q) || cat.includes(q) || loc.includes(q) || desc.includes(q) || code.includes(q);
    }
    return true;
  });

  const totalCount = reports.length;
  const activeCount = reports.filter((r) => r.status === 'OPEN').length;
  const returnedCount = reports.filter((r) => r.status === 'RETURNED').length;

  return (
    <div className="container" style={{ paddingTop: '28px', paddingBottom: '60px' }}>
      {/* Hero Header (.glass-panel) */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 32px',
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span
              className="badge"
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              <HelpCircle size={13} />
              LOST & FOUND MANAGEMENT
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Campus Lost Items Reporting & Search
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '640px', lineHeight: 1.5 }}>
            Submit reports for misplaced belongings (Item Name, Category, Location, Date, Description) and search existing campus reports.
          </p>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setIsFormVisible(!isFormVisible)}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>{isFormVisible ? 'Close Report Form' : 'Report Lost Item'}</span>
            {isFormVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Metrics Row using .stat-card */}
      <div className="dashboard-grid">
        <div className="stat-card stat-rose">
          <div className="stat-info">
            <h3>Total Lost Reports</h3>
            <div className="stat-value">{totalCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <HelpCircle size={24} />
          </div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-info">
            <h3>Active Reports</h3>
            <div className="stat-value">{activeCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card stat-emerald">
          <div className="stat-info">
            <h3>Reunited with Owners</h3>
            <div className="stat-value">{returnedCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* FORM FOR SUBMITTING NEW LOST ITEMS (.glass-panel) */}
      {isFormVisible && (
        <div
          className="glass-panel"
          style={{
            padding: '28px',
            marginBottom: '28px',
            border: '2px solid rgba(239, 68, 68, 0.25)',
            background: 'rgba(255, 255, 255, 0.98)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Submit a New Lost Item Report
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsFormVisible(false)}
            >
              <X size={15} /> Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitReport}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Field 1: Item Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="itemName">
                  Item Name <span className="required">*</span>
                </label>
                <input
                  id="itemName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Casio fx-991EX Calculator / Dell Laptop Charger"
                  value={formData.itemName}
                  onChange={(e) => {
                    setFormData({ ...formData, itemName: e.target.value });
                    if (formErrors.itemName) setFormErrors({ ...formErrors, itemName: null });
                  }}
                />
                {formErrors.itemName && <div className="form-error">{formErrors.itemName}</div>}
              </div>

              {/* Field 2: Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="category">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 3: Location */}
              <div className="form-group">
                <label className="form-label" htmlFor="location">
                  Location Lost <span className="required">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Science Block B, Room 204 or Library 1st Floor"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    if (formErrors.location) setFormErrors({ ...formErrors, location: null });
                  }}
                />
                {formErrors.location && <div className="form-error">{formErrors.location}</div>}
              </div>

              {/* Field 4: Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="date">
                  Date Lost <span className="required">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => {
                    setFormData({ ...formData, date: e.target.value });
                    if (formErrors.date) setFormErrors({ ...formErrors, date: null });
                  }}
                />
                {formErrors.date && <div className="form-error">{formErrors.date}</div>}
              </div>
            </div>

            {/* Field 5: Description */}
            <div className="form-group" style={{ marginTop: '4px' }}>
              <label className="form-label" htmlFor="description">
                Description & Distinguishing Features <span className="required">*</span>
              </label>
              <textarea
                id="description"
                className="form-control"
                rows={3}
                placeholder="Mention brand, color, stickers, unique scratches, engravings, model numbers, or markings that verify your ownership..."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: null });
                }}
              />
              {formErrors.description && <div className="form-error">{formErrors.description}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFormVisible(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ background: '#dc2626', borderColor: '#b91c1c' }}
              >
                {submitting ? 'Registering Report...' : 'Submit Lost Item Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH AND FILTER BAR (.glass-panel) */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Search Input */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search reports by item name, location, marks, or code..."
            style={{ paddingLeft: '38px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div style={{ flex: '0 1 190px' }}>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ flex: '0 1 160px' }}>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="OPEN">Active / Open</option>
            <option value="RETURNED">Returned</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedStatus('All');
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>

      {/* SEARCHABLE LIST OF CURRENT REPORTS (.glass-panel) */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e0e7ff',
              borderTopColor: 'var(--primary-600)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 14px',
            }}
          />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading lost item reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Search size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Matching Lost Item Reports
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 18px', lineHeight: 1.5 }}>
            {searchQuery || selectedCategory !== 'All'
              ? 'No reports match your current search criteria. Try clearing filters or searching with different keywords.'
              : 'There are currently no active lost item reports registered.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsFormVisible(true)}
            style={{ background: '#dc2626', borderColor: '#b91c1c' }}
          >
            <Plus size={16} /> Submit a Lost Item Report
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredReports.map((item) => {
            const displayName = item.itemName || item.title || 'Untitled Item';
            const displayDate = item.date || item.dateOccurred || 'Unknown Date';
            const displayLocation = item.location || item.building || 'Campus';
            const isReturned = item.status === 'RETURNED';

            return (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: isReturned ? '3px solid #16a34a' : '3px solid #ef4444',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span
                      className="badge"
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                      }}
                    >
                      <HelpCircle size={12} />
                      LOST
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      #{item.itemCode || `LF-${item.id}`}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {displayName}
                  </h3>

                  <div style={{ marginBottom: '12px' }}>
                    <span
                      className="badge"
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.74rem',
                      }}
                    >
                      <Tag size={12} />
                      {item.category || 'General'}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                      <span><strong>Location:</strong> {displayLocation}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} color="var(--primary-600)" style={{ flexShrink: 0 }} />
                      <span><strong>Date Lost:</strong> {displayDate}</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      background: isReturned ? '#dcfce7' : '#eff6ff',
                      color: isReturned ? '#15803d' : '#1d4ed8',
                      border: `1px solid ${isReturned ? '#86efac' : '#bfdbfe'}`,
                    }}
                  >
                    {isReturned ? 'Returned to Owner' : 'Report Active'}
                  </span>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setViewingReport(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingReport && (
        <div className="modal-overlay" onClick={() => setViewingReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  className="badge"
                  style={{
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                  }}
                >
                  LOST ITEM
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  #{viewingReport.itemCode || `LF-${viewingReport.id}`}
                </h3>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingReport(null)}
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Item Name
                </span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                  {viewingReport.itemName || viewingReport.title}
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CATEGORY</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {viewingReport.category}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATE LOST</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {viewingReport.date || viewingReport.dateOccurred}
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>LOCATION</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  📍 {viewingReport.location || viewingReport.building}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Description & Identifying Characteristics
                </span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: '#ffffff', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '6px', lineHeight: 1.5 }}>
                  {viewingReport.description || viewingReport.identifyingMarks || 'No description provided.'}
                </p>
              </div>

              {viewingReport.reporterName && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Reported by: <strong>{viewingReport.reporterName}</strong> ({viewingReport.reporterRole || 'STUDENT'})
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingReport(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFoundModule;
