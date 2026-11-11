/**
 * CampusFix Services Compatibility Layer
 * Wraps complaintsApi and lostAndFoundApi to eliminate Firestore dependencies
 * while preserving backwards compatibility with legacy callers.
 */

import { complaintsApi } from '../api/complaints';
import { lostAndFoundApi } from '../api/lostAndFound';

export const firebaseService = {
  // --- Complaints ---
  getComplaints: async (userId, userRole, userEmail) => {
    return complaintsApi.getComplaints(userId, userRole, userEmail);
  },

  createComplaint: async (payload) => {
    return complaintsApi.createComplaint(payload);
  },

  updateComplaintStatus: async (complaintId, status) => {
    return complaintsApi.updateStatus(complaintId, status);
  },

  deleteComplaint: async (complaintId) => {
    return complaintsApi.deleteComplaint(complaintId);
  },

  getAnalytics: async (userId, userRole, userEmail) => {
    return complaintsApi.getAnalytics(userId, userRole, userEmail);
  },

  // --- Lost & Found ---
  getLostFoundItems: async (filters = {}) => {
    return lostAndFoundApi.getItems(filters);
  },

  createLostFoundItem: async (payload) => {
    return lostAndFoundApi.createItem(payload);
  },

  fetchPossibleMatches: async (item) => {
    return lostAndFoundApi.findMatches(item);
  },

  submitItemClaim: async (payload) => {
    return lostAndFoundApi.submitClaim(payload);
  },

  fetchItemClaims: async (params) => {
    return lostAndFoundApi.getClaims(params);
  },

  updateClaimStatus: async (claimId, statusData) => {
    return lostAndFoundApi.updateClaimStatus(claimId, statusData.status, statusData.adminNotes);
  },

  fetchLostFoundStats: async () => {
    return lostAndFoundApi.getStats();
  },
};
