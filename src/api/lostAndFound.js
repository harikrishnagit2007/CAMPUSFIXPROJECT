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

const ITEMS_COLLECTION = 'lost_found';
const CLAIMS_COLLECTION = 'claims';

const handleFirestoreError = (error, operationType, path) => {
  console.error(`Firestore ${operationType} Error on ${path}:`, error);
  throw error;
};

export const lostAndFoundApi = {
  getItems: async (params = {}) => {
    try {
      let q = collection(db, ITEMS_COLLECTION);
      
      const constraints = [];
      if (params.type && params.type !== 'ALL') {
        constraints.push(where('type', '==', params.type.toUpperCase()));
      }
      if (params.category && params.category !== 'ALL') {
        constraints.push(where('category', '==', params.category));
      }
      if (params.status && params.status !== 'ALL') {
        constraints.push(where('status', '==', params.status));
      }
      
      // If we have constraints, we need a compound query. 
      // Note: Firestore might require indexes for some combinations.
      // We'll also add an order by created_at.
      let firestoreQuery = query(q, ...constraints, orderBy('created_at', 'desc'));

      const querySnapshot = await getDocs(firestoreQuery);
      let items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Client-side text search (Firestore doesn't support partial match well without 3rd party)
      if (params.query && params.query.trim()) {
        const searchTerm = params.query.toLowerCase();
        items = items.filter(i => 
          i.itemName?.toLowerCase().includes(searchTerm) || 
          i.description?.toLowerCase().includes(searchTerm) || 
          i.location?.toLowerCase().includes(searchTerm)
        );
      }

      return items;
    } catch (error) {
      handleFirestoreError(error, 'list', ITEMS_COLLECTION);
    }
  },

  getItemById: async (id) => {
    try {
      const docRef = doc(db, ITEMS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, 'get', `${ITEMS_COLLECTION}/${id}`);
    }
  },

  createItem: async (payload) => {
    try {
      const docRef = await addDoc(collection(db, ITEMS_COLLECTION), {
        ...payload,
        status: payload.status || 'OPEN',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return { id: docRef.id, ...payload };
    } catch (error) {
      handleFirestoreError(error, 'create', ITEMS_COLLECTION);
    }
  },

  updateItem: async (id, payload) => {
    try {
      const docRef = doc(db, ITEMS_COLLECTION, id);
      await updateDoc(docRef, {
        ...payload,
        updated_at: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, 'update', `${ITEMS_COLLECTION}/${id}`);
    }
  },

  deleteItem: async (id) => {
    try {
      await deleteDoc(doc(db, ITEMS_COLLECTION, id));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, 'delete', `${ITEMS_COLLECTION}/${id}`);
    }
  },

  submitClaim: async (payload) => {
    try {
      const docRef = await addDoc(collection(db, CLAIMS_COLLECTION), {
        ...payload,
        status: 'PENDING',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return { id: docRef.id, ...payload };
    } catch (error) {
      handleFirestoreError(error, 'create', CLAIMS_COLLECTION);
    }
  },

  getClaims: async (params = {}) => {
    try {
      let q = collection(db, CLAIMS_COLLECTION);
      const constraints = [];
      
      if (params.claimantId) {
        constraints.push(where('claimantId', '==', params.claimantId));
      }
      if (params.itemId) {
        constraints.push(where('itemId', '==', params.itemId));
      }
      if (params.status && params.status !== 'ALL') {
        constraints.push(where('status', '==', params.status));
      }

      const firestoreQuery = query(q, ...constraints, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(firestoreQuery);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, 'list', CLAIMS_COLLECTION);
    }
  },

  updateClaimStatus: async (claimId, newStatus, adminNotes = '') => {
    try {
      const docRef = doc(db, CLAIMS_COLLECTION, claimId);
      await updateDoc(docRef, {
        status: newStatus,
        adminNotes,
        updated_at: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, 'update', `${CLAIMS_COLLECTION}/${claimId}`);
    }
  },

  getStats: async () => {
    try {
      const itemsSnapshot = await getDocs(collection(db, ITEMS_COLLECTION));
      const claimsSnapshot = await getDocs(collection(db, CLAIMS_COLLECTION));
      
      const items = itemsSnapshot.docs.map(d => d.data());
      const claims = claimsSnapshot.docs.map(d => d.data());

      return {
        totalLost: items.filter(i => i.type === 'LOST').length,
        totalFound: items.filter(i => i.type === 'FOUND').length,
        pendingClaims: claims.filter(c => c.status === 'PENDING').length,
        returnedCount: items.filter(i => i.status === 'RETURNED').length,
      };
    } catch (error) {
      console.error('Stats error:', error);
      return { totalLost: 0, totalFound: 0, pendingClaims: 0, returnedCount: 0 };
    }
  },

  findMatches: async (targetItem) => {
    if (!targetItem) return [];
    try {
      const oppositeType = targetItem.type === 'LOST' ? 'FOUND' : 'LOST';
      const q = query(
        collection(db, ITEMS_COLLECTION),
        where('type', '==', oppositeType),
        where('status', '==', 'OPEN')
      );
      const snapshot = await getDocs(q);
      const candidates = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.id !== targetItem.id);

      const targetWords = `${targetItem.itemName} ${targetItem.description} ${targetItem.identifyingMarks || ''}`
        .toLowerCase()
        .split(/\W+/)
        .filter(w => w.length > 2);

      const matches = [];

      for (const cand of candidates) {
        let score = 0;
        const reasons = [];

        if (cand.category === targetItem.category) {
          score += 40;
          reasons.push(`Same Category (${cand.category})`);
        }

        if (cand.building === targetItem.building) {
          score += 25;
          reasons.push(`Same Building (${cand.building})`);
        }

        const candWords = `${cand.itemName} ${cand.description} ${cand.identifyingMarks || ''}`
          .toLowerCase()
          .split(/\W+/)
          .filter(w => w.length > 2);

        const commonWords = targetWords.filter(w => candWords.includes(w));
        if (commonWords.length > 0) {
          const keywordScore = Math.min(35, commonWords.length * 10);
          score += keywordScore;
          reasons.push(`Keywords matched: "${commonWords.slice(0, 3).join(', ')}"`);
        }

        if (score >= 30) {
          matches.push({
            candidate: cand,
            matchConfidence: Math.min(score, 98),
            reasons,
          });
        }
      }

      return matches.sort((a, b) => b.matchConfidence - a.matchConfidence);
    } catch (error) {
      console.error('Match finder error:', error);
      return [];
    }
  }
};
