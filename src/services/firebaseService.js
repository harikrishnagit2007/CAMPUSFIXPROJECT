import { complaintsApi } from '../api/complaints';
import { lostAndFoundApi } from '../api/lostAndFound';
import { staffApi } from '../api/staff';
import { locationsApi } from '../api/locations';

export const firebaseService = {
  // --- Complaints ---
  getComplaints: (userId, userRole) => complaintsApi.getComplaints(userId, userRole),
  createComplaint: (payload) => complaintsApi.createComplaint(payload),
  updateComplaintStatus: (complaintId, status) => complaintsApi.updateStatus(complaintId, status),
  deleteComplaint: (complaintId) => complaintsApi.deleteComplaint(complaintId),
  getAnalytics: (userId, userRole) => complaintsApi.getAnalytics(userId, userRole),

  // --- Lost & Found ---
  getLostFoundItems: (params) => lostAndFoundApi.getItems(params),
  createLostFoundItem: (payload) => lostAndFoundApi.createItem(payload),
  submitItemClaim: (payload) => lostAndFoundApi.submitClaim(payload),
  fetchItemClaims: (params) => lostAndFoundApi.getClaims(params),
  updateClaimStatus: (claimId, statusData) => {
    const status = typeof statusData === 'string' ? statusData : statusData.status;
    const notes = statusData.adminNotes || '';
    return lostAndFoundApi.updateClaimStatus(claimId, status, notes);
  },
  fetchLostFoundStats: () => lostAndFoundApi.getStats(),
  fetchPossibleMatches: (itemId) => lostAndFoundApi.findMatches({ id: itemId }), // simplified for now

  // --- Staff ---
  fetchStaff: (params) => staffApi.getStaff(params),
  fetchStaffById: (id) => staffApi.getStaffMember(id),
  createStaff: (data) => staffApi.createStaff(data),
  updateStaff: (id, data) => staffApi.updateStaff(id, data),
  deleteStaff: (id) => staffApi.deleteStaff(id),

  // --- Locations ---
  fetchLocations: () => locationsApi.getLocations(),
  fetchLocationById: (id) => locationsApi.getLocation(id),
  createLocation: (data) => locationsApi.createLocation(data),
  updateLocation: (id, data) => locationsApi.updateLocation(id, data),
  deleteLocation: (id) => locationsApi.deleteLocation(id),
};
