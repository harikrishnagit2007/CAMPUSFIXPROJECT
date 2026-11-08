/**
 * CampusFix Centralized API Service Layer (Firestore Wrapper)
 * Redirects legacy Axios/REST calls to the new Firestore implementation.
 */

import { firebaseService } from './firebaseService';

export const complaintsService = {
  fetchActiveComplaints: async () => {
    const all = await firebaseService.getComplaints();
    return all.filter((c) => ['Submitted', 'Under Review', 'Assigned', 'In Progress'].includes(c.status));
  },
  fetchComplaints: (filters) => firebaseService.getComplaints(null, null), // updated as needed by callers
  fetchComplaintById: (id) => firebaseService.getComplaints().then(list => list.find(c => c.id === id)),
  createComplaint: (payload) => firebaseService.createComplaint(payload),
  updateComplaint: (id, payload) => firebaseService.updateComplaintStatus(id, payload.status),
  patchComplaint: (id, patchData) => firebaseService.updateComplaintStatus(id, patchData.status),
  deleteComplaint: (id) => firebaseService.deleteComplaint(id),
  fetchAnalytics: () => firebaseService.getAnalytics(),
  fetchEmergencyAlerts: () => Promise.resolve([]),
};

export const lostFoundService = {
  fetchActiveLostItems: () => firebaseService.getLostFoundItems({ type: 'LOST', status: 'OPEN' }),
  fetchLostFoundItems: (filters) => firebaseService.getLostFoundItems(filters),
  fetchLostFoundItemById: (id) => firebaseService.getLostFoundItems().then(list => list.find(i => i.id === id)),
  createLostFoundItem: (payload) => firebaseService.createLostFoundItem(payload),
  updateLostFoundItem: (id, payload) => firebaseService.getLostFoundItems().then(() => ({ success: true })), // placeholder
  patchLostFoundItem: (id, patchData) => firebaseService.getLostFoundItems().then(() => ({ success: true })), // placeholder
  deleteLostFoundItem: (id) => firebaseService.getLostFoundItems().then(() => ({ success: true })), // placeholder
  fetchPossibleMatches: (itemId) => firebaseService.fetchPossibleMatches(itemId),
  submitItemClaim: (payload) => firebaseService.submitItemClaim(payload),
  fetchItemClaims: (params) => firebaseService.fetchItemClaims(params),
  updateClaimStatus: (claimId, statusData) => firebaseService.updateClaimStatus(claimId, statusData),
  fetchLostFoundStats: () => firebaseService.fetchLostFoundStats(),
};

export const staffService = {
  fetchStaff: (params) => firebaseService.fetchStaff(params),
  fetchStaffById: (id) => firebaseService.fetchStaffById(id),
  createStaff: (data) => firebaseService.createStaff(data),
  updateStaff: (id, data) => firebaseService.updateStaff(id, data),
  patchStaff: (id, data) => firebaseService.updateStaff(id, data),
  deleteStaff: (id) => firebaseService.deleteStaff(id),
};

export const locationsService = {
  fetchLocations: () => firebaseService.fetchLocations(),
  fetchLocationById: (id) => firebaseService.fetchLocationById(id),
  createLocation: (data) => firebaseService.createLocation(data),
  updateLocation: (id, data) => firebaseService.updateLocation(id, data),
  deleteLocation: (id) => firebaseService.deleteLocation(id),
};

export const usersService = {
  login: () => Promise.reject('Legacy Auth Disabled'),
  register: () => Promise.reject('Legacy Auth Disabled'),
  getCurrentUser: () => Promise.resolve(null),
  listUsers: () => Promise.resolve([]),
};

export const notificationsService = {
  fetchNotifications: () => Promise.resolve([]),
  markAsRead: () => Promise.resolve(),
  deleteNotification: () => Promise.resolve(),
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
