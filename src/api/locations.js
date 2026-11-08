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

const COLLECTION = 'locations';

const handleFirestoreError = (error, operationType, path) => {
  console.error(`Firestore ${operationType} Error on ${path}:`, error);
  throw error;
};

export const locationsApi = {
  getLocations: async () => {
    try {
      const q = query(collection(db, COLLECTION), orderBy('building', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, 'list', COLLECTION);
    }
  },

  getLocation: async (id) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, 'get', `${COLLECTION}/${id}`);
    }
  },

  createLocation: async (data) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      handleFirestoreError(error, 'create', COLLECTION);
    }
  },

  updateLocation: async (id, data) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updated_at: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, 'update', `${COLLECTION}/${id}`);
    }
  },

  deleteLocation: async (id) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, 'delete', `${COLLECTION}/${id}`);
    }
  },
};
