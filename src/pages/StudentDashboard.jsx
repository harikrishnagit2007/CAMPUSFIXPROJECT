import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  AlertCircle,
  FileText,
  CheckCircle,
  Clock,
  Play,
  Eye,
  Edit3,
  Trash2,
  MapPin,
  QrCode,
  X,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintsApi } from '../api/complaints';
import { locationsApi } from '../api/locations';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { SlaCountdownBadge } from '../components/SlaCountdownBadge';
import { ComplaintModal } from '../components/ComplaintModal';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { QRScannerModal } from '../components/QRScannerModal';
import { EmergencyBanner } from '../components/EmergencyBanner';

const CATEGORIES = ['All', 'Electrical', 'Furniture', 'Classroom', 'Wi-Fi/Network', 'Plumbing', 'Cleaning', 'Projector', 'Fan/AC', 'Other'];
const STATUSES = ['All', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

export const StudentDashboard = ({
  showToast,
  onOpenReportModal,
  isReportModalOpen,
  onCloseReportModal,
}) => {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [stats, setStats] = useState({ total: 0, submitted: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // Search & Filters (Top Bar)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Modals
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [viewingComplaint, setViewingComplaint] = useState(null);
  const [deletingComplaint, setDeletingComplaint] = useState(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrPrefilledLocation, setQrPrefilledLocation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaintsAndStats = async () => {
    setLoading(true);
    try {
      const [listData, emergencyData] = await Promise.all([
        complaintsApi.getComplaints(),
        complaintsApi.getEmergencyAlerts(),
      ]);
      const myList = listData || [];
      const mySubmitted = myList.filter((c) => ['Submitted', 'Under Review'].includes(c.status)).length;
      const myInProgress = myList.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length;
      const myResolved = myList.filter((c) => c.status === 'Resolved').length;

      setComplaints(myList);
      setEmergencies(emergencyData || []);
      setStats({
        total: myList.length,
        submitted: mySubmitted,
        in_progress: myInProgress,
        resolved: myResolved,
      });
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load complaints.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintsAndStats();

    // Check for Deep-link QR Location in URL (?location_id=...)
    const params = new URLSearchParams(window.location.search);
    const locId = params.get('location_id');
    if (locId) {
      locationsApi
        .getLocation(locId)
        .then((loc) => {
          setQrPrefilledLocation(loc);
          if (onOpenReportModal) onOpenReportModal();
          showToast(`QR Code decoded: ${loc.building} - ${loc.room}`, 'info');
        })
        .catch(() => {});
    }
  }, []);

  // Filter complaints client-side with Search, Status, Priority, Category
  const filteredComplaints = complaints.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.complaint_title.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.formatted_id && item.formatted_id.toLowerCase().includes(q)) ||
      (item.location_id && item.location_id.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    const matchesPriority = selectedPriority === 'All' || item.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedStatus !== 'All' ||
    selectedPriority !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedPriority('All');
  };

  const handleSelectQrLocation = (loc) => {
    setQrPrefilledLocation(loc);
    if (onOpenReportModal) onOpenReportModal();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingComplaint) return;
    setActionLoading(true);
    try {
      await complaintsApi.deleteComplaint(deletingComplaint.id);
      showToast('Complaint ticket cancelled and removed.', 'success');
      setDeletingComplaint(null);
      fetchComplaintsAndStats();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to cancel complaint.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      {/* Emergency Hazard Banner */}
      <EmergencyBanner
        emergencies={emergencies}
        onSelectComplaint={(c) => setViewingComplaint(c)}
      />

      {/* Student Welcome & Quick Actions */}
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
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {user?.department || 'Campus Student'} • Track your reported facility issues and resolution updates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => setIsQrScannerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <QrCode size={18} />
            <span>Scan Location QR</span>
          </button>

          <button
            className="btn btn-primary btn-lg"
            onClick={() => {
              setQrPrefilledLocation(null);
              onOpenReportModal();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>+ Report an Issue</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>My Complaints</h3>
            <div className="stat-value">{stats.total}</div>
            <p>Total issues filed</p>
          </div>
          <div className="stat-icon icon-primary">
            <FileText size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Under Review</h3>
            <div className="stat-value">{stats.submitted}</div>
            <p>Pending staff assignment</p>
          </div>
          <div className="stat-icon icon-warning">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>In Progress</h3>
            <div className="stat-value">{stats.in_progress}</div>
            <p>Technicians active</p>
          </div>
          <div className="stat-icon icon-info">
            <Play size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Resolved</h3>
            <div className="stat-value">{stats.resolved}</div>
            <p>Successfully verified</p>
          </div>
          <div className="stat-icon icon-success">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Search Bar and Status/Priority Filters at Top of Dashboard (User Requirement) */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 280px' }}>
            <Search
              size={18}
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
              placeholder="Search by title, location, room, ID, or keywords..."
              style={{ paddingLeft: '38px', paddingRight: searchQuery ? '36px' : '14px' }}
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
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              title="Filter by ticket status"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
            <select
              className="form-select"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              title="Filter by priority level"
            >
              {PRIORITIES.map((prio) => (
                <option key={prio} value={prio}>
                  Priority: {prio}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              title="Filter by facility category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                background: '#f1f5f9',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} /> Clear
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick:</span>

          <button
            onClick={() => setSelectedPriority(selectedPriority === 'Critical' ? 'All' : 'Critical')}
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              background: selectedPriority === 'Critical' ? '#dc2626' : '#fee2e2',
              color: selectedPriority === 'Critical' ? 'white' : '#b91c1c',
            }}
          >
            🔥 Critical Hazards ({complaints.filter((c) => c.priority === 'Critical').length})
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'In Progress' ? 'All' : 'In Progress')}
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              background: selectedStatus === 'In Progress' ? '#7e22ce' : '#f3e8ff',
              color: selectedStatus === 'In Progress' ? 'white' : '#7e22ce',
            }}
          >
            ⚡ In Progress ({complaints.filter((c) => c.status === 'In Progress').length})
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'Submitted' ? 'All' : 'Submitted')}
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              background: selectedStatus === 'Submitted' ? '#d97706' : '#fef3c7',
              color: selectedStatus === 'Submitted' ? 'white' : '#b45309',
            }}
          >
            ⏳ Submitted ({complaints.filter((c) => c.status === 'Submitted').length})
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'Resolved' ? 'All' : 'Resolved')}
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              background: selectedStatus === 'Resolved' ? '#15803d' : '#dcfce7',
              color: selectedStatus === 'Resolved' ? 'white' : '#15803d',
            }}
          >
            ✓ Resolved ({complaints.filter((c) => c.status === 'Resolved').length})
          </button>
        </div>
      </div>

      {/* Complaints List Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            My Reported Issues ({filteredComplaints.length})
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing records stored in database
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading your maintenance complaints...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <AlertCircle size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              No complaints found
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {hasActiveFilters
                ? 'Try adjusting your search query, status, or priority filters.'
                : 'You have not reported any maintenance issues yet.'}
            </p>
            {complaints.length === 0 ? (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '16px' }}
                onClick={onOpenReportModal}
              >
                + Report Your First Issue
              </button>
            ) : hasActiveFilters ? (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '16px' }}
                onClick={resetFilters}
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title & Location</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Tracking</th>
                  <th>Assigned Staff</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                        #{item.formatted_id || item.id}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.complaint_title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={12} />
                          <span>{item.location}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <SlaCountdownBadge complaint={item} compact={true} />
                    </td>
                    <td>
                      {item.assigned_staff_details ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {item.assigned_staff_details.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn-icon"
                          title="View Details"
                          onClick={() => setViewingComplaint(item)}
                        >
                          <Eye size={16} />
                        </button>

                        {item.status === 'Submitted' && (
                          <>
                            <button
                              className="btn-icon"
                              title="Edit Issue"
                              onClick={() => setEditingComplaint(item)}
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              className="btn-icon text-danger"
                              title="Cancel Ticket"
                              onClick={() => setDeletingComplaint(item)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report or Edit Modal */}
      {(isReportModalOpen || editingComplaint) && (
        <ComplaintModal
          isOpen={isReportModalOpen || Boolean(editingComplaint)}
          onClose={() => {
            if (isReportModalOpen) onCloseReportModal();
            setEditingComplaint(null);
            setQrPrefilledLocation(null);
          }}
          complaint={editingComplaint}
          initialLocation={qrPrefilledLocation}
          onSuccess={() => {
            fetchComplaintsAndStats();
            setEditingComplaint(null);
            setQrPrefilledLocation(null);
          }}
          showToast={showToast}
        />
      )}

      {/* Detail Modal */}
      <ComplaintDetailModal
        isOpen={Boolean(viewingComplaint)}
        onClose={() => setViewingComplaint(null)}
        complaint={viewingComplaint}
        onEdit={(comp) => setEditingComplaint(comp)}
        onDelete={(comp) => setDeletingComplaint(comp)}
        onRefresh={fetchComplaintsAndStats}
        showToast={showToast}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingComplaint)}
        onClose={() => setDeletingComplaint(null)}
        onConfirm={handleDeleteConfirm}
        title="Cancel Maintenance Issue"
        message={`Are you sure you want to cancel and remove complaint #${deletingComplaint?.formatted_id || deletingComplaint?.id}? This action cannot be undone.`}
        loading={actionLoading}
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onSelectLocation={handleSelectQrLocation}
        showToast={showToast}
      />
    </div>
  );
};
