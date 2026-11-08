import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';

const COLLECTION = 'complaints';

const handleFirestoreError = (error, operationType, path) => {
  console.error(`Firestore ${operationType} Error on ${path}:`, error);
  throw new Error(JSON.stringify({
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  }));
};

export const complaintsApi = {
  getComplaints: async (userId, userRole, userEmail) => {
    try {
      let q = collection(db, COLLECTION);
      
      // Filter for non-admin/staff
      if (userRole !== 'ADMIN' && userRole !== 'STAFF' && userId) {
        q = query(q, where('student_id', '==', userId));
      } else {
        q = query(q, orderBy('created_at', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, 'list', COLLECTION);
    }
  },

  createComplaint: async (payload) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...payload,
        status: 'Submitted',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return { id: docRef.id, ...payload, status: 'Submitted' };
    } catch (error) {
      handleFirestoreError(error, 'create', COLLECTION);
    }
  },

  updateStatus: async (complaintId, status, resolution_notes = '') => {
    try {
      const docRef = doc(db, COLLECTION, complaintId);
      await updateDoc(docRef, {
        status,
        resolution_notes,
        updated_at: serverTimestamp(),
        ...(status === 'Resolved' ? { resolved_at: serverTimestamp() } : {})
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, 'update', `${COLLECTION}/${complaintId}`);
    }
  },

  deleteComplaint: async (complaintId) => {
    try {
      await deleteDoc(doc(db, COLLECTION, complaintId));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, 'delete', `${COLLECTION}/${complaintId}`);
    }
  },

  getAnalytics: async (userId, userRole, userEmail) => {
    try {
      const q = collection(db, COLLECTION);
      const querySnapshot = await getDocs(q);
      const allComplaints = querySnapshot.docs.map(doc => doc.data());
      
      let complaints = allComplaints;
      if (userRole !== 'ADMIN' && userRole !== 'STAFF' && userId) {
        complaints = allComplaints.filter(c => c.student_id === userId);
      }

      return {
        total: complaints.length,
        submitted: complaints.filter(c => c.status === 'Submitted').length,
        in_progress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
        critical: complaints.filter(c => c.priority === 'Critical').length
      };
    } catch (error) {
      handleFirestoreError(error, 'list', COLLECTION);
    }
  },
  getEmergencyAlerts: async () => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('priority', '==', 'Critical'),
        where('status', '!=', 'Resolved'),
        orderBy('status'), // Necessary because of != filter
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Emergency alerts error:', error);
      return [];
    }
  }
};
