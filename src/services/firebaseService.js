import { complaintsApi } from '../api/complaints';
import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const LF_COL = 'lost_found';

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
  getLostFoundItems: async () => {
    try {
      const snapshot = await getDocs(collection(db, LF_COL));
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn('Firestore getLostFoundItems fallback notice:', err);
      const raw = localStorage.getItem('campusfix_lostfound_items');
      return raw ? JSON.parse(raw) : [];
    }
  },

  createLostFoundItem: async (payload) => {
    try {
      const docRef = await addDoc(collection(db, LF_COL), {
        ...payload,
        status: payload.status || 'OPEN',
        created_at: serverTimestamp(),
      });
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.warn('Firestore createLostFoundItem fallback notice:', err);
      const raw = localStorage.getItem('campusfix_lostfound_items');
      const list = raw ? JSON.parse(raw) : [];
      const item = { id: `LF-${Date.now()}`, ...payload };
      list.unshift(item);
      localStorage.setItem('campusfix_lostfound_items', JSON.stringify(list));
      return item;
    }
  },
};
