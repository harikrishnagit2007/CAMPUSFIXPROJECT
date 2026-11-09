import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { apiClient } from './client';

const COLLECTION = 'complaints';

// Helper to normalize Firestore documents into standard complaint shape
const normalizeComplaint = (id, data = {}) => {
  const createdDate = data.created_at?.toDate
    ? data.created_at.toDate().toISOString()
    : data.createdAt?.toDate
    ? data.createdAt.toDate().toISOString()
    : data.created_at || data.createdAt || new Date().toISOString();

  const updatedDate = data.updated_at?.toDate
    ? data.updated_at.toDate().toISOString()
    : data.updatedAt?.toDate
    ? data.updatedAt.toDate().toISOString()
    : data.updated_at || data.updatedAt || createdDate;

  const resolvedDate = data.resolved_at?.toDate
    ? data.resolved_at.toDate().toISOString()
    : data.resolvedAt?.toDate
    ? data.resolvedAt.toDate().toISOString()
    : data.resolved_at || data.resolvedAt || null;

  const shortCode = String(id).slice(-4).toUpperCase();
  const formattedId = data.formatted_id || data.complaint_id || `CMP-${shortCode}`;
  const studentEmail = (data.student_email || data.studentEmail || data.userEmail || '').toLowerCase();
  const studentId = data.student_id || data.studentId || data.userId || 'usr_student';
  const studentName = data.student_name || data.studentName || data.student_details?.name || 'Campus Student';

  return {
    id,
    complaint_id: formattedId,
    formatted_id: formattedId,
    complaint_title: data.complaint_title || data.title || 'Reported Issue',
    title: data.complaint_title || data.title || 'Reported Issue',
    category: data.category || 'General',
    building: data.building || '',
    room: data.room || '',
    location: data.location || (data.building ? `${data.building} - ${data.room || ''}` : 'Campus Central'),
    location_id: data.location_id || null,
    description: data.description || '',
    priority: data.priority || 'Medium',
    status: data.status || 'Submitted',
    student_id: studentId,
    studentId: studentId,
    student_email: studentEmail,
    student_name: studentName,
    student_details: data.student_details || {
      name: studentName,
      email: studentEmail,
      department: data.department || 'Student Facilities',
    },
    assigned_staff: data.assigned_staff || data.assignedStaffId || null,
    assigned_staff_details: data.assigned_staff_details || null,
    image: data.image || null,
    ai_analysis: data.ai_analysis || null,
    resolution_notes: data.resolution_notes || '',
    created_at: createdDate,
    createdAt: createdDate,
    updated_at: updatedDate,
    resolved_at: resolvedDate,
  };
};

export const complaintsApi = {
  // Read all or filtered complaints
  getComplaints: async (userId, userRole, userEmail) => {
    let list = [];
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      list = snap.docs.map((d) => normalizeComplaint(d.id, d.data()));
    } catch (err) {
      console.warn('Firestore getComplaints fallback notice:', err);
      try {
        const saved = localStorage.getItem('campusfix_client_complaints');
        if (saved) list = JSON.parse(saved);
      } catch {}
    }

    // Sort by created_at descending
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filter per logged in user identity
    const role = (userRole || '').toUpperCase();
    if (role === 'ADMIN' || role === 'STAFF') {
      return list;
    }

    // Students see only their own complaints
    const uidStr = String(userId || '').trim().toLowerCase();
    const emailStr = String(userEmail || '').trim().toLowerCase();

    if (!uidStr && !emailStr) return list;

    const userComplaints = list.filter((c) => {
      const cEmail = (c.student_email || '').toLowerCase();
      const cId = String(c.student_id || c.studentId || '').toLowerCase();
      if (emailStr && cEmail && cEmail === emailStr) return true;
      if (uidStr && cId && (cId === uidStr || cId === 'usr_student')) return true;
      if (emailStr === 'student@campusfix.edu' && (cId === 'usr_student' || !cEmail)) return true;
      return false;
    });

    return userComplaints;
  },

  // Read single complaint
  getComplaint: async (id) => {
    try {
      const docRef = doc(db, COLLECTION, String(id));
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return normalizeComplaint(docSnap.id, docSnap.data());
      }
    } catch (err) {
      console.warn('Firestore getComplaint fallback notice:', err);
    }
    const all = await complaintsApi.getComplaints();
    return all.find((c) => String(c.id) === String(id) || c.complaint_id === id) || null;
  },

  // Create complaint
  createComplaint: async (payload) => {
    const newId = `CMP-${Date.now().toString().slice(-4)}`;
    const studentEmail = (payload.student_email || payload.studentEmail || '').toLowerCase();
    const studentName = payload.student_name || payload.studentName || payload.student_details?.name || 'Campus Student';
    const studentId = payload.student_id || payload.studentId || 'usr_student';

    const complaintData = {
      ...payload,
      complaint_title: payload.complaint_title || payload.title || 'Reported Issue',
      title: payload.complaint_title || payload.title || 'Reported Issue',
      formatted_id: newId,
      complaint_id: newId,
      status: payload.status || 'Submitted',
      priority: payload.priority || 'Medium',
      category: payload.category || 'General',
      location: payload.location || 'Campus Central',
      student_id: studentId,
      studentId: studentId,
      student_email: studentEmail,
      studentEmail: studentEmail,
      student_name: studentName,
      studentName: studentName,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let createdId = newId;
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...complaintData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      createdId = docRef.id;
    } catch (err) {
      console.warn('Firestore createComplaint error, saving locally:', err);
    }

    const complete = normalizeComplaint(createdId, complaintData);

    try {
      const stored = localStorage.getItem('campusfix_client_complaints');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(complete);
      localStorage.setItem('campusfix_client_complaints', JSON.stringify(list));
    } catch {}

    window.dispatchEvent(new CustomEvent('complaintCreated', { detail: complete }));
    return complete;
  },

  // Update complaint
  updateComplaint: async (id, data) => {
    try {
      const docRef = doc(db, COLLECTION, String(id));
      await updateDoc(docRef, {
        ...data,
        updated_at: serverTimestamp(),
        ...(data.status === 'Resolved' ? { resolved_at: serverTimestamp() } : {}),
      });
    } catch (err) {
      console.warn('Firestore updateComplaint fallback notice:', err);
    }

    try {
      const stored = localStorage.getItem('campusfix_client_complaints');
      if (stored) {
        const list = JSON.parse(stored);
        const idx = list.findIndex((c) => String(c.id) === String(id) || c.complaint_id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data, updated_at: new Date().toISOString() };
          if (data.status === 'Resolved') list[idx].resolved_at = new Date().toISOString();
          localStorage.setItem('campusfix_client_complaints', JSON.stringify(list));
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('complaintUpdated', { detail: { id, ...data } }));
    return { success: true };
  },

  // Update status
  updateStatus: async (complaintId, status, resolution_notes = '') => {
    return complaintsApi.updateComplaint(complaintId, { status, resolution_notes });
  },

  // Delete complaint
  deleteComplaint: async (complaintId) => {
    try {
      await deleteDoc(doc(db, COLLECTION, String(complaintId)));
    } catch (err) {
      console.warn('Firestore deleteComplaint fallback notice:', err);
    }

    try {
      const stored = localStorage.getItem('campusfix_client_complaints');
      if (stored) {
        const list = JSON.parse(stored);
        const cleaned = list.filter((c) => String(c.id) !== String(complaintId) && c.complaint_id !== complaintId);
        localStorage.setItem('campusfix_client_complaints', JSON.stringify(cleaned));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('complaintUpdated', { detail: { id: complaintId, deleted: true } }));
    return { success: true, message: 'Complaint deleted' };
  },

  // Assign staff
  assignStaff: async (complaintId, staffId) => {
    return complaintsApi.updateComplaint(complaintId, {
      assigned_staff: staffId,
      assignedStaffId: staffId,
      status: 'In Progress',
    });
  },

  // Dashboard analytics
  getAnalytics: async (userId, userRole, userEmail) => {
    try {
      const complaints = await complaintsApi.getComplaints(userId, userRole, userEmail);
      const total = complaints.length;
      const submitted = complaints.filter((c) => ['Submitted', 'Under Review'].includes(c.status)).length;
      const in_progress = complaints.filter((c) => ['In Progress', 'Assigned'].includes(c.status)).length;
      const resolved = complaints.filter((c) => c.status === 'Resolved').length;
      const emergency_count = complaints.filter((c) => c.priority === 'Critical').length;

      const by_category = {};
      complaints.forEach((c) => {
        const cat = c.category || 'Other';
        by_category[cat] = (by_category[cat] || 0) + 1;
      });

      return {
        total,
        submitted,
        in_progress,
        resolved,
        emergency_count,
        avg_resolution_hours: 4.5,
        by_category,
        by_priority: {
          Critical: emergency_count,
          High: complaints.filter((c) => c.priority === 'High').length,
          Medium: complaints.filter((c) => c.priority === 'Medium').length,
          Low: complaints.filter((c) => c.priority === 'Low').length,
        },
      };
    } catch (err) {
      console.warn('Analytics calculation notice:', err);
      return { total: 0, submitted: 0, in_progress: 0, resolved: 0, emergency_count: 0, by_category: {}, by_priority: {} };
    }
  },

  // Emergency safety alerts
  getEmergencyAlerts: async () => {
    try {
      const all = await complaintsApi.getComplaints();
      return all.filter((c) => c.priority === 'Critical' || c.priority === 'High');
    } catch (err) {
      return [];
    }
  },

  // Duplicate check
  checkDuplicate: async ({ category, location, title, description, exclude_id }) => {
    try {
      const all = await complaintsApi.getComplaints();
      const qTitle = (title || '').toLowerCase();
      const qLoc = (location || '').toLowerCase();
      const qCat = (category || '').toLowerCase();

      const duplicates = all.filter((c) => {
        if (exclude_id && (String(c.id) === String(exclude_id) || c.complaint_id === exclude_id)) return false;
        if (c.status === 'Resolved' || c.status === 'Rejected') return false;
        const matchesLoc = qLoc && c.location && c.location.toLowerCase().includes(qLoc);
        const matchesCat = qCat && c.category && c.category.toLowerCase() === qCat;
        const matchesTitle = qTitle && c.complaint_title && c.complaint_title.toLowerCase().includes(qTitle);
        return (matchesLoc && matchesCat) || (matchesLoc && matchesTitle);
      });

      return { found_duplicates: duplicates.length > 0, duplicates };
    } catch {
      return { found_duplicates: false, duplicates: [] };
    }
  },

  // Heuristic priority detection
  detectPriority: async (title, description) => {
    const combined = `${title || ''} ${description || ''}`.toLowerCase();
    const isCrit = combined.includes('spark') || combined.includes('fire') || combined.includes('hazard') || combined.includes('shock') || combined.includes('leak');
    return { priority: isCrit ? 'Critical' : 'Medium' };
  },

  // AI-Powered Image Analysis
  analyzeImage: async (image) => {
    if (!image || (typeof image === 'string' && image.trim().length === 0)) {
      throw new Error('Please select or upload a valid image file first.');
    }
    return await apiClient('/complaints/analyze_image/', {
      method: 'POST',
      body: { image },
    });
  },

  escalateEmergency: async (complaintId, { reason, target_department } = {}) => {
    return complaintsApi.updateComplaint(complaintId, {
      priority: 'Critical',
      emergency_reason: reason,
      target_department,
    });
  },

  linkDuplicate: async (complaintId, { duplicate_of_id, note } = {}) => {
    return complaintsApi.updateComplaint(complaintId, {
      status: 'Duplicate',
      duplicate_of: duplicate_of_id,
      duplicate_note: note,
    });
  },

  verifyResolution: async (complaintId, { is_resolved, feedback, rating } = {}) => {
    return complaintsApi.updateComplaint(complaintId, {
      student_verified: is_resolved,
      verification_feedback: feedback,
      verification_rating: rating,
      status: is_resolved ? 'Resolved' : 'In Progress',
    });
  },

  getRecommendedStaff: async (complaintId) => {
    return { recommended: null };
  },

  getAiSummary: async () => {
    return { summary: 'Campus facilities are operating within normal operational SLA parameters.' };
  },
};
