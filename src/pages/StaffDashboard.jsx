import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle2,
  Play,
  MapPin,
  Eye,
  AlertCircle,
  Search,
  RotateCcw,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintsApi } from '../api/complaints';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { SlaCountdownBadge } from '../components/SlaCountdownBadge';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { EmergencyBanner } from '../components/EmergencyBanner';

const STATUSES = ['All', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

export const StaffDashboard = ({ showToast }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingComplaint, setViewingComplaint] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const fetchAssigned = async () => {
    setLoading(true);
    try {
      const [data, emergencyData] = await Promise.all([
        complaintsApi.getComplaints(),
        complaintsApi.getEmergencyAlerts(),
      ]);
      setComplaints(data || []);
      setEmergencies(emergencyData || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load assigned work orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      const res = await complaintsApi.updateStatus(complaintId, newStatus);
      showToast(res.message || `Status updated to ${newStatus}.`, 'success');
      fetchAssigned();
      if (viewingComplaint && viewingComplaint.id === complaintId) {
        setViewingComplaint(res.complaint);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.complaint_title.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.formatted_id && c.formatted_id.toLowerCase().includes(q)) ||
      (c.student_details?.name && c.student_details.name.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'All' || priorityFilter !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
  };

  const pendingCount = complaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      {/* Emergency Alert Banner */}
      <EmergencyBanner
        emergencies={emergencies}
        onSelectComplaint={(c) => setViewingComplaint(c)}
      />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Maintenance Staff Workbench
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Technician: {user?.name} ({user?.department || 'Maintenance Team'}) • Assigned Work Orders & Dispatch
        </p>
      </div>

      {/* Metrics */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Active Assignments</h3>
            <div className="stat-value">{pendingCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#eef2ff', color: 'var(--primary-600)' }}>
            <Wrench size={24} />
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-info">
            <h3>Currently In Progress</h3>
            <div className="stat-value">{inProgressCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#9333ea' }}>
            <Play size={24} />
          </div>
        </div>

        <div className="stat-card stat-emerald">
          <div className="stat-info">
            <h3>Resolved Completed</h3>
            <div className="stat-value">{resolvedCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Search Bar & Status/Priority Filters at Top (User Requirement) */}
      <div className="glass-panel" style={{ padding: '18px 20px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Search */}
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
              placeholder="Search work orders by issue, location, or student..."
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
          <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
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
          <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
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

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
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
      </div>

      {/* Assigned Tasks Table */}
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
            My Assigned Work Orders ({filteredComplaints.length})
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Update resolution progress directly
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading assigned maintenance tickets...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <AlertCircle size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              No assigned work orders match
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {hasActiveFilters
                ? 'Try resetting the filters above to view all work orders.'
                : 'You currently have no open maintenance complaints assigned to you.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Issue & Room</th>
                  <th>Category</th>
                  <th>Student Contact</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Deadline</th>
                  <th style={{ textAlign: 'right' }}>Workflow Action</th>
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
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.complaint_title}
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
                        <MapPin size={12} /> {item.location}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                        {item.category}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.student_details?.name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {item.student_details?.phone || item.student_details?.email}
                      </div>
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

                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewingComplaint(item)}
                          title="View Details"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>

                        {item.status !== 'In Progress' && item.status !== 'Resolved' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUpdateStatus(item.id, 'In Progress')}
                            style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}
                          >
                            <Play size={13} />
                            <span>Start Work</span>
                          </button>
                        )}

                        {item.status !== 'Resolved' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleUpdateStatus(item.id, 'Resolved')}
                            style={{ background: '#10b981' }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Resolve</span>
                          </button>
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

      {/* Complaint Detail Modal with visual timeline */}
      <ComplaintDetailModal
        isOpen={Boolean(viewingComplaint)}
        onClose={() => setViewingComplaint(null)}
        complaint={viewingComplaint}
        onUpdateStatus={handleUpdateStatus}
        onRefresh={fetchAssigned}
        showToast={showToast}
      />
    </div>
  );
};
