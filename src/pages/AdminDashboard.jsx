import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Users,
  Layers,
  MapPin,
  Phone,
  Mail,
  QrCode,
  Flame,
  Printer,
  RotateCcw,
  X,
  Activity,
} from 'lucide-react';
import { complaintsApi } from '../api/complaints';
import { staffApi } from '../api/staff';
import { locationsApi } from '../api/locations';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { SlaCountdownBadge } from '../components/SlaCountdownBadge';
import { AdminAnalyticsDashboard } from '../components/AdminAnalyticsDashboard';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { ComplaintModal } from '../components/ComplaintModal';
import { StaffModal } from '../components/StaffModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { LocationModal } from '../components/LocationModal';
import { QRBadgeModal } from '../components/QRBadgeModal';
import { EmergencyBanner } from '../components/EmergencyBanner';

const CATEGORIES = ['All', 'Electrical', 'Furniture', 'Classroom', 'Wi-Fi/Network', 'Plumbing', 'Cleaning', 'Projector', 'Fan/AC', 'Other'];
const STATUSES = ['All', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

export const AdminDashboard = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' | 'locations' | 'staff'

  // Complaints & Analytics
  const [complaints, setComplaints] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Complaints
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Filters for Locations
  const [locationSearch, setLocationSearch] = useState('');

  // Modals state
  const [viewingComplaint, setViewingComplaint] = useState(null);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [deletingComplaint, setDeletingComplaint] = useState(null);

  const [editingStaff, setEditingStaff] = useState(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState(null);

  const [editingLocation, setEditingLocation] = useState(null);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState(null);
  const [viewingLocationQr, setViewingLocationQr] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compData, statsData, staffData, locData, emergencyData] = await Promise.all([
        complaintsApi.getComplaints(),
        complaintsApi.getAnalytics(),
        staffApi.getStaff(),
        locationsApi.getLocations(),
        complaintsApi.getEmergencyAlerts(),
      ]);
      setComplaints(compData || []);
      setAnalytics(statsData);
      setStaffList(staffData || []);
      setLocationsList(locData || []);
      setEmergencies(emergencyData || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load administration data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Complaints
  const filteredComplaints = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.complaint_title.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.formatted_id && c.formatted_id.toLowerCase().includes(q)) ||
      (c.location_id && c.location_id.toLowerCase().includes(q)) ||
      (c.student_details?.name && c.student_details.name.toLowerCase().includes(q));

    const matchesCat = categoryFilter === 'All' || c.category === categoryFilter;
    const matchesStat = statusFilter === 'All' || c.status === statusFilter;
    const matchesPrio = priorityFilter === 'All' || c.priority === priorityFilter;

    return matchesSearch && matchesCat && matchesStat && matchesPrio;
  });

  const hasActiveComplaintFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'All' ||
    statusFilter !== 'All' ||
    priorityFilter !== 'All';

  const resetComplaintFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStatusFilter('All');
    setPriorityFilter('All');
  };

  // Filtered Locations
  const filteredLocations = locationsList.filter((loc) => {
    const q = locationSearch.toLowerCase();
    return (
      !q ||
      loc.building.toLowerCase().includes(q) ||
      loc.room.toLowerCase().includes(q) ||
      loc.department.toLowerCase().includes(q) ||
      loc.id.toLowerCase().includes(q) ||
      loc.type.toLowerCase().includes(q)
    );
  });

  // Complaint Actions
  const handleAssignStaff = async (complaintId, staffId) => {
    try {
      const res = await complaintsApi.assignStaff(complaintId, staffId);
      showToast(res.message || 'Staff assigned successfully.', 'success');
      loadData();
      if (viewingComplaint && viewingComplaint.id === complaintId) {
        setViewingComplaint(res.complaint);
      }
    } catch (err) {
      showToast(err.message || 'Failed to assign staff.', 'error');
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      const res = await complaintsApi.updateStatus(complaintId, newStatus);
      showToast(res.message || 'Status updated successfully.', 'success');
      loadData();
      if (viewingComplaint && viewingComplaint.id === complaintId) {
        setViewingComplaint(res.complaint);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  const handleDeleteComplaintConfirm = async () => {
    if (!deletingComplaint) return;
    setActionLoading(true);
    try {
      await complaintsApi.deleteComplaint(deletingComplaint.id);
      showToast('Complaint ticket permanently deleted from database.', 'success');
      setDeletingComplaint(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete complaint.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Staff Actions
  const handleDeleteStaffConfirm = async () => {
    if (!deletingStaff) return;
    setActionLoading(true);
    try {
      await staffApi.deleteStaff(deletingStaff.id);
      showToast(`Staff member "${deletingStaff.name}" deleted successfully.`, 'success');
      setDeletingStaff(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete staff member.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Location Actions
  const handleDeleteLocationConfirm = async () => {
    if (!deletingLocation) return;
    setActionLoading(true);
    try {
      await locationsApi.deleteLocation(deletingLocation.id);
      showToast(`Campus location "${deletingLocation.id}" deleted.`, 'success');
      setDeletingLocation(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete campus location.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      {/* Active Hazards Escalation Banner */}
      <EmergencyBanner
        emergencies={emergencies}
        onSelectComplaint={(c) => setViewingComplaint(c)}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Administration Command Center
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Campus Facilities Operations • Live dispatch, QR smart locations, resolution analytics & technician management.
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '10px', padding: '4px', gap: '4px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('complaints')}
            style={{ borderRadius: '8px' }}
          >
            <Layers size={15} />
            <span>Complaints ({complaints.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('analytics')}
            style={{ borderRadius: '8px' }}
          >
            <Activity size={15} />
            <span>Analytics & SLA Hub</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'locations' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('locations')}
            style={{ borderRadius: '8px' }}
          >
            <QrCode size={15} />
            <span>Campus QR Locations ({locationsList.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('staff')}
            style={{ borderRadius: '8px' }}
          >
            <Users size={15} />
            <span>Staff Directory ({staffList.length})</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Complaints</h3>
            <div className="stat-value">{analytics?.total ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#eef2ff', color: 'var(--primary-600)' }}>
            <Layers size={24} />
          </div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-info">
            <h3>Pending Review</h3>
            <div className="stat-value">{analytics?.submitted ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-info">
            <h3>In Progress</h3>
            <div className="stat-value">{analytics?.in_progress ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#9333ea' }}>
            <Play size={24} />
          </div>
        </div>

        <div className="stat-card stat-emerald">
          <div className="stat-info">
            <h3>Resolved Issues</h3>
            <div className="stat-value">{analytics?.resolved ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card stat-rose">
          <div className="stat-info">
            <h3>Critical Hazards</h3>
            <div className="stat-value">{analytics?.emergency_count ?? analytics?.by_priority?.Critical ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Flame size={24} />
          </div>
        </div>
      </div>

      {/* Analytics Category Breakdown */}
      {analytics && (
        <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              letterSpacing: '0.05em',
              marginBottom: '14px',
            }}
          >
            Campus Category Breakdown
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.entries(analytics.by_category || {}).map(([cat, count]) => {
              const pct = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0;
              return (
                <div
                  key={cat}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat}:</span>
                  <span
                    style={{
                      background: 'var(--primary-100)',
                      color: 'var(--primary-700)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                    }}
                  >
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: COMPLAINTS MANAGEMENT */}
      {activeTab === 'complaints' && (
        <>
          {/* Top Search Bar & Status/Priority Filters (User Requirement) */}
          <div className="glass-panel" style={{ padding: '18px 20px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search complaint, location, student, or CMP-ID..."
                  style={{ paddingLeft: '36px', paddingRight: searchQuery ? '36px' : '12px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div style={{ minWidth: '150px', flex: '1 1 150px' }}>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      Status: {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div style={{ minWidth: '150px', flex: '1 1 150px' }}>
                <select
                  className="form-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      Priority: {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div style={{ minWidth: '150px', flex: '1 1 150px' }}>
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      Category: {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear button */}
              {hasActiveComplaintFilters && (
                <button
                  onClick={resetComplaintFilters}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    background: '#f1f5f9',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
            </div>

            {/* Quick Filter Badges */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick:</span>

              <button
                onClick={() => setPriorityFilter(priorityFilter === 'Critical' ? 'All' : 'Critical')}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  background: priorityFilter === 'Critical' ? '#dc2626' : '#fee2e2',
                  color: priorityFilter === 'Critical' ? 'white' : '#b91c1c',
                }}
              >
                🔥 Critical Hazards ({complaints.filter((c) => c.priority === 'Critical').length})
              </button>

              <button
                onClick={() => setStatusFilter(statusFilter === 'Submitted' ? 'All' : 'Submitted')}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === 'Submitted' ? '#d97706' : '#fef3c7',
                  color: statusFilter === 'Submitted' ? 'white' : '#b45309',
                }}
              >
                ⏳ Unassigned / Submitted ({complaints.filter((c) => c.status === 'Submitted').length})
              </button>

              <button
                onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress')}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === 'In Progress' ? '#7e22ce' : '#f3e8ff',
                  color: statusFilter === 'In Progress' ? 'white' : '#7e22ce',
                }}
              >
                ⚡ In Progress ({complaints.filter((c) => c.status === 'In Progress').length})
              </button>
            </div>
          </div>

          {/* Complaints Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Complaints Queue ({filteredComplaints.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Complete administrative dispatch and resolution access
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading complaint records...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No complaints match your filters.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Issue & Location</th>
                      <th>Category</th>
                      <th>Student</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>SLA Tracking</th>
                      <th>Assigned Staff</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                            #{c.formatted_id || c.id}
                          </span>
                        </td>

                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {c.complaint_title}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.78rem',
                                color: 'var(--text-secondary)',
                                marginTop: '2px',
                              }}
                            >
                              <MapPin size={12} /> {c.location}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                            {c.category}
                          </span>
                        </td>

                        <td style={{ fontSize: '0.84rem' }}>
                          <div style={{ fontWeight: 600 }}>{c.student_details?.name || 'Student'}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {c.student_details?.department || ''}
                          </div>
                        </td>

                        <td>
                          <PriorityBadge priority={c.priority} />
                        </td>

                        <td>
                          <StatusBadge status={c.status} />
                        </td>

                        <td>
                          <SlaCountdownBadge complaint={c} compact={true} />
                        </td>

                        <td style={{ fontSize: '0.84rem' }}>
                          <select
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: 'white',
                            }}
                            value={c.assigned_staff || ''}
                            onChange={(e) => handleAssignStaff(c.id, e.target.value)}
                          >
                            <option value="">-- Unassigned --</option>
                            {staffList.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.specialization})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>

                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setViewingComplaint(c)}
                              title="View Full Details & Timeline"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingComplaint(c)}
                              title="Edit Complaint"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeletingComplaint(c)}
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: ANALYTICS & SLA HUB (Recharts Visualizations & KPIs) */}
      {activeTab === 'analytics' && (
        <AdminAnalyticsDashboard showToast={showToast} />
      )}

      {/* TAB 3: CAMPUS LOCATIONS & QR MANAGEMENT (User Requirement 1) */}
      {activeTab === 'locations' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Campus QR Location Management ({locationsList.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Manage physical campus access points, print doorframe QR posters, and configure pre-filled issue locations.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsAddLocationOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                <span>+ Add Campus Location & QR</span>
              </button>
            </div>
          </div>

          {/* Locations Search */}
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-subtle)', background: '#f8fafc' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search building, room, type, or Location ID..."
                style={{ paddingLeft: '36px' }}
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Location ID</th>
                  <th>QR Code</th>
                  <th>Room / Lab</th>
                  <th>Building & Floor</th>
                  <th>Type</th>
                  <th>Department</th>
                  <th>Landmarks / Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => (
                  <tr key={loc.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          color: '#4338ca',
                          background: '#e0e7ff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {loc.id}
                      </span>
                    </td>

                    <td>
                      <button
                        onClick={() => setViewingLocationQr(loc)}
                        title="Click to expand & print QR poster"
                        style={{
                          background: 'white',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {loc.qr_code_data_url ? (
                          <img src={loc.qr_code_data_url} alt="QR" style={{ width: '40px', height: '40px' }} />
                        ) : (
                          <QrCode size={24} />
                        )}
                      </button>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{loc.room}</div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{loc.building}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{loc.floor}</div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          background: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {loc.type}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.84rem' }}>{loc.department}</td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '220px' }}>
                      {loc.notes || '—'}
                    </td>

                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewingLocationQr(loc)}
                          title="Print / Download QR Poster"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Printer size={13} />
                          <span>QR Badge</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingLocation(loc)}
                          title="Edit Location"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingLocation(loc)}
                          title="Delete Location"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MAINTENANCE STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Maintenance Staff Directory ({staffList.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Manage campus maintenance technicians, trade specializations, and dispatch availability.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddStaffOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>+ Add Maintenance Staff</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Staff Member</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>Availability</th>
                  <th>Contact Info</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>#{s.id}</td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                    </td>

                    <td style={{ fontSize: '0.85rem' }}>{s.department}</td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--primary-700)',
                          background: 'var(--primary-50)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {s.specialization}
                      </span>
                    </td>

                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            s.availability === 'Available'
                              ? '#dcfce7'
                              : s.availability === 'Busy'
                              ? '#ffedd5'
                              : '#f1f5f9',
                          color:
                            s.availability === 'Available'
                              ? '#15803d'
                              : s.availability === 'Busy'
                              ? '#c2410c'
                              : '#475569',
                          borderColor:
                            s.availability === 'Available'
                              ? '#bbf7d0'
                              : s.availability === 'Busy'
                              ? '#fed7aa'
                              : '#cbd5e1',
                        }}
                      >
                        {s.availability}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div>
                        <Mail size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {s.email}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        <Phone size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {s.phone}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingStaff(s)}
                          title="Edit Staff Member"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingStaff(s)}
                          title="Delete Staff Member"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        isOpen={Boolean(viewingComplaint)}
        onClose={() => setViewingComplaint(null)}
        complaint={viewingComplaint}
        staffList={staffList}
        onAssignStaff={handleAssignStaff}
        onUpdateStatus={handleUpdateStatus}
        onRefresh={loadData}
        onEdit={(item) => {
          setViewingComplaint(null);
          setEditingComplaint(item);
        }}
        onDelete={(item) => {
          setViewingComplaint(null);
          setDeletingComplaint(item);
        }}
        showToast={showToast}
      />

      {/* Complaint Edit Modal */}
      <ComplaintModal
        isOpen={Boolean(editingComplaint)}
        onClose={() => setEditingComplaint(null)}
        complaint={editingComplaint}
        onSuccess={loadData}
        showToast={showToast}
      />

      {/* Delete Complaint Confirmation */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingComplaint)}
        onClose={() => setDeletingComplaint(null)}
        onConfirm={handleDeleteComplaintConfirm}
        title="Delete Complaint Ticket?"
        message={
          deletingComplaint
            ? `Are you sure you want to permanently delete complaint #${deletingComplaint.formatted_id || deletingComplaint.id} ("${deletingComplaint.complaint_title}")? This will remove all history and records from the database.`
            : ''
        }
        loading={actionLoading}
      />

      {/* Add Staff Modal */}
      <StaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        staffMember={null}
        onSuccess={loadData}
        showToast={showToast}
      />

      {/* Edit Staff Modal */}
      <StaffModal
        isOpen={Boolean(editingStaff)}
        onClose={() => setEditingStaff(null)}
        staffMember={editingStaff}
        onSuccess={loadData}
        showToast={showToast}
      />

      {/* Delete Staff Confirmation */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingStaff)}
        onClose={() => setDeletingStaff(null)}
        onConfirm={handleDeleteStaffConfirm}
        title="Delete Staff Member?"
        message={
          deletingStaff
            ? `Are you sure you want to remove staff technician "${deletingStaff.name}" (${deletingStaff.specialization}) from the database?`
            : ''
        }
        loading={actionLoading}
      />

      {/* Location Create/Edit Modal */}
      <LocationModal
        isOpen={isAddLocationOpen || Boolean(editingLocation)}
        onClose={() => {
          setIsAddLocationOpen(false);
          setEditingLocation(null);
        }}
        location={editingLocation}
        onSuccess={loadData}
        showToast={showToast}
      />

      {/* Delete Location Confirmation */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingLocation)}
        onClose={() => setDeletingLocation(null)}
        onConfirm={handleDeleteLocationConfirm}
        title="Delete Campus Location & QR?"
        message={
          deletingLocation
            ? `Are you sure you want to delete location ${deletingLocation.id} (${deletingLocation.building} - ${deletingLocation.room})? Physical QR codes with this ID will no longer be linked.`
            : ''
        }
        loading={actionLoading}
      />

      {/* QR Badge / Poster Modal */}
      <QRBadgeModal
        isOpen={Boolean(viewingLocationQr)}
        onClose={() => setViewingLocationQr(null)}
        location={viewingLocationQr}
        showToast={showToast}
      />
    </div>
  );
};
