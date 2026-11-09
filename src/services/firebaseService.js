import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';

const COMPLAINTS_COL = 'complaints';
const LF_COL = 'lost_found';

export const firebaseService = {
  // --- Complaints ---
  getComplaints: async (userId, userRole) => {
    let q = query(collection(db, COMPLAINTS_COL), orderBy('created_at', 'desc'));
    if (userRole === 'STUDENT' && userId) {
      q = query(collection(db, COMPLAINTS_COL), where('student_id', '==', userId), orderBy('created_at', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  createComplaint: async (payload) => {
    return await addDoc(collection(db, COMPLAINTS_COL), {
      ...payload,
      status: 'Submitted',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  updateComplaintStatus: async (complaintId, status) => {
    await updateDoc(doc(db, COMPLAINTS_COL, complaintId), {
      status,
      updated_at: serverTimestamp(),
      ...(status === 'Resolved' ? { resolved_at: serverTimestamp() } : {})
    });
  },

  deleteComplaint: async (complaintId) => {
    await deleteDoc(doc(db, COMPLAINTS_COL, complaintId));
  },

  // --- Analytics ---
  getAnalytics: async (userId, userRole) => {
    const q = collection(db, COMPLAINTS_COL);
    const snapshot = await getDocs(q);
    const all = snapshot.docs.map(doc => doc.data());
    
    let filtered = all;
    if (userRole === 'STUDENT' && userId) {
      filtered = all.filter(c => c.student_id === userId);
    }
    
    return {
      total: filtered.length,
      submitted: filtered.filter(c => ['Submitted', 'Under Review'].includes(c.status)).length,
      in_progress: filtered.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length,
      resolved: filtered.filter(c => c.status === 'Resolved').length,
      critical: filtered.filter(c => c.priority === 'Critical').length
    };
  },

  // --- Lost & Found ---
  getLostFoundItems: async () => {
    const snapshot = await getDocs(collection(db, LF_COL));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  createLostFoundItem: async (payload) => {
    return await addDoc(collection(db, LF_COL), {
      ...payload,
      status: 'OPEN',
      created_at: serverTimestamp(),
    });
  }
};
