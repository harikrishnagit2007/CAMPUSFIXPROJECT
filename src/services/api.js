/**
 * CampusFix Centralized API Service Layer
 * Direct bridge to Spring Boot REST APIs and MySQL backend services.
 */

import { complaintsApi } from '../api/complaints';
import { lostAndFoundApi } from '../api/lostAndFound';
import { staffApi } from '../api/staff';
import { locationsApi } from '../api/locations';
import { notificationsApi } from '../api/notifications';
import { authApi } from '../api/auth';

export const complaintsService = {
  fetchActiveComplaints: async () => {
    const all = await complaintsApi.getComplaints();
    return all.filter((c) => ['Submitted', 'Under Review', 'Assigned', 'In Progress'].includes(c.status));
  },
  fetchComplaints: (userId, userRole, userEmail) => complaintsApi.getComplaints(userId, userRole, userEmail),
  fetchComplaintById: async (id) => {
    const list = await complaintsApi.getComplaints();
    return list.find((c) => String(c.id) === String(id) || String(c.complaintId) === String(id));
  },
  createComplaint: (payload) => complaintsApi.createComplaint(payload),
  updateComplaint: (id, payload) => complaintsApi.updateStatus(id, payload.status, payload.resolution_notes),
  patchComplaint: (id, patchData) => complaintsApi.updateStatus(id, patchData.status, patchData.resolution_notes),
  deleteComplaint: (id) => complaintsApi.deleteComplaint(id),
  fetchAnalytics: (userId, userRole, userEmail) => complaintsApi.getAnalytics(userId, userRole, userEmail),
  fetchEmergencyAlerts: () => complaintsApi.getEmergencyAlerts(),
};

export const lostFoundService = {
  fetchActiveLostItems: () => lostAndFoundApi.getItems({ type: 'LOST', status: 'OPEN' }),
  fetchLostFoundItems: (filters) => lostAndFoundApi.getItems(filters),
  fetchLostFoundItemById: (id) => lostAndFoundApi.getItemById(id),
  createLostFoundItem: (payload) => lostAndFoundApi.createItem(payload),
  updateLostFoundItem: (id, payload) => lostAndFoundApi.updateItem(id, payload),
  patchLostFoundItem: (id, patchData) => lostAndFoundApi.updateItem(id, patchData),
  deleteLostFoundItem: (id) => lostAndFoundApi.deleteItem(id),
  fetchPossibleMatches: (item) => lostAndFoundApi.findMatches(item),
  submitItemClaim: (payload) => lostAndFoundApi.submitClaim(payload),
  fetchItemClaims: (params) => lostAndFoundApi.getClaims(params),
  updateClaimStatus: (claimId, statusData) =>
    lostAndFoundApi.updateClaimStatus(claimId, statusData.status, statusData.adminNotes),
  fetchLostFoundStats: () => lostAndFoundApi.getStats(),
};

export const staffService = {
  fetchStaff: (params) => staffApi.getStaff(params),
  fetchStaffById: (id) => staffApi.getStaffMember(id),
  createStaff: (data) => staffApi.createStaff(data),
  updateStaff: (id, data) => staffApi.updateStaff(id, data),
  patchStaff: (id, data) => staffApi.updateStaff(id, data),
  deleteStaff: (id) => staffApi.deleteStaff(id),
};

export const locationsService = {
  fetchLocations: () => locationsApi.getLocations(),
  fetchLocationById: (id) => locationsApi.getLocation(id),
  createLocation: (data) => locationsApi.createLocation(data),
  updateLocation: (id, data) => locationsApi.updateLocation(id, data),
  deleteLocation: (id) => locationsApi.deleteLocation(id),
};

export const usersService = {
  login: (email, password, role) => authApi.login(email, password, role),
  register: (userData) => authApi.register(userData),
  getCurrentUser: () => authApi.getCurrentUser(),
  listUsers: () => Promise.resolve([]),
};

export const notificationsService = {
  fetchNotifications: () => notificationsApi.getNotifications(),
  markAsRead: (id) => notificationsApi.markAsRead(id),
  deleteNotification: (id) => notificationsApi.deleteNotification(id),
};

// Direct Named Exports
export const {
  fetchActiveComplaints,
  fetchComplaints,
  fetchComplaintById,
  createComplaint,
  updateComplaint,
  patchComplaint,
  deleteComplaint,
  fetchAnalytics,
  fetchEmergencyAlerts,
} = complaintsService;

export const {
  fetchActiveLostItems,
  fetchLostFoundItems,
  fetchLostFoundItemById,
  createLostFoundItem,
  updateLostFoundItem,
  patchLostFoundItem,
  deleteLostFoundItem,
  fetchPossibleMatches,
  submitItemClaim,
  fetchItemClaims,
  updateClaimStatus,
  fetchLostFoundStats,
} = lostFoundService;

export const api = {
  complaints: complaintsService,
  lostFound: lostFoundService,
  users: usersService,
  staff: staffService,
  locations: locationsService,
  notifications: notificationsService,
};

export default api;
