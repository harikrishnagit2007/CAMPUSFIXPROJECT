import { apiClient } from './client';

export const complaintsApi = {
  // Read all or filtered complaints
  getComplaints: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient(`/complaints/${qs}`, { method: 'GET' });
  },

  // Read single complaint
  getComplaint: (id) => apiClient(`/complaints/${id}/`, { method: 'GET' }),

  // Create complaint (handles JSON or FormData)
  createComplaint: (payload) =>
    apiClient('/complaints/', {
      method: 'POST',
      body: payload,
    }),

  // Update complaint (student or admin)
  updateComplaint: (id, data) =>
    apiClient(`/complaints/${id}/`, {
      method: 'PATCH',
      body: data,
    }),

  // Delete complaint
  deleteComplaint: (id) =>
    apiClient(`/complaints/${id}/`, {
      method: 'DELETE',
    }),

  // Dashboard analytics
  getAnalytics: () => apiClient('/complaints/analytics/', { method: 'GET' }),

  // Emergency safety alerts
  getEmergencyAlerts: () => apiClient('/complaints/emergency_alerts/', { method: 'GET' }),

  // Smart Feature: Advanced AI Duplicate check
  checkDuplicate: ({ category, location, title, description, exclude_id }) => {
    const query = new URLSearchParams({
      category: category || '',
      location: location || '',
      title: title || '',
      description: description || '',
    });
    if (exclude_id) query.append('exclude_id', exclude_id);
    return apiClient(`/complaints/check_duplicate/?${query.toString()}`, { method: 'GET' });
  },

  // Smart Feature: Priority detection heuristic
  detectPriority: (title, description) =>
    apiClient('/complaints/detect_priority/', {
      method: 'POST',
      body: { title, description },
    }),

  // AI-Powered Image Analysis
  analyzeImage: (image) =>
    apiClient('/complaints/analyze_image/', {
      method: 'POST',
      body: { image },
    }),

  // Emergency Escalation Workflow
  escalateEmergency: (complaintId, { reason, target_department } = {}) =>
    apiClient(`/complaints/${complaintId}/escalate_emergency/`, {
      method: 'POST',
      body: { reason, target_department },
    }),

  // Link / Merge Duplicate Complaint
  linkDuplicate: (complaintId, { duplicate_of_id, note } = {}) =>
    apiClient(`/complaints/${complaintId}/link_duplicate/`, {
      method: 'POST',
      body: { duplicate_of_id, note },
    }),

  // Admin action: Assign staff
  assignStaff: (complaintId, staffId) =>
    apiClient(`/complaints/${complaintId}/assign_staff/`, {
      method: 'PATCH',
      body: { staff_id: staffId },
    }),

  // Admin / Staff action: Update status
  updateStatus: (complaintId, status, resolution_notes = '') =>
    apiClient(`/complaints/${complaintId}/update_status/`, {
      method: 'PATCH',
      body: { status, resolution_notes },
    }),

  // Student action: Verify resolution (Yes/No)
  verifyResolution: (complaintId, { is_resolved, feedback, rating } = {}) =>
    apiClient(`/complaints/${complaintId}/verify_resolution/`, {
      method: 'POST',
      body: { is_resolved, feedback, rating },
    }),

  // Smart Staff Assignment Recommendation
  getRecommendedStaff: (complaintId) =>
    apiClient(`/complaints/${complaintId}/recommended_staff/`, { method: 'GET' }),

  // AI Maintenance Executive Summary
  getAiSummary: () =>
    apiClient('/analytics/ai_summary/', { method: 'GET' }),
};
