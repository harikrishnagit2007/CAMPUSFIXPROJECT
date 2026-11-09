/**
 * CampusFix Centralized Axios API Service Layer
 * Location: src/services/api.js
 *
 * Configured for Java Spring Boot REST Backend with MySQL.
 * Includes request interceptor for JWT / token injection and response interceptor for 401 error handling.
 */

import axios from 'axios';

const rawBase =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_JAVA_API_BASE_URL) ||
  '/api';
const API_BASE_URL = rawBase.replace(/\/+$/, '');

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token and user headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusfix_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const storedUserJson = localStorage.getItem('campusfix_user');
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson);
        if (storedUser) {
          if (storedUser.id || storedUser.uid) config.headers['X-User-Id'] = String(storedUser.id || storedUser.uid);
          if (storedUser.role) config.headers['X-User-Role'] = storedUser.role;
          if (storedUser.email) config.headers['X-User-Email'] = storedUser.email;
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error formatting and 401 handling
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Clear session on 401 Unauthorized
        localStorage.removeItem('campusfix_token');
        localStorage.removeItem('campusfix_user');
        localStorage.removeItem('campusfix_selected_role');
        if (window.location.hash !== '#/login' && !window.location.pathname.includes('login')) {
          window.location.href = '/';
        }
      }

      const data = error.response.data;
      let errorMsg = 'An unexpected error occurred.';
      if (data) {
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.message) {
          errorMsg = data.message;
        } else {
          const messages = [];
          for (const [key, value] of Object.entries(data)) {
            const valStr = Array.isArray(value) ? value.join(' ') : String(value);
            messages.push(`${key}: ${valStr}`);
          }
          if (messages.length) errorMsg = messages.join(' | ');
        }
      }
      const err = new Error(errorMsg);
      err.status = error.response.status;
      err.data = data;
      return Promise.reject(err);
    } else if (error.request) {
      return Promise.reject(new Error('Network connection failure. Please check if the Java Spring Boot backend server is running.'));
    } else {
      return Promise.reject(error);
    }
  }
);

// Helper dispatcher matching apiRequest interface for backward compatibility
export async function apiRequest(endpoint, { method = 'GET', body = null, headers = {}, ...options } = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `/${cleanEndpoint}`;

  try {
    const response = await axiosInstance({
      url,
      method,
      data: body,
      headers,
      ...options,
    });
    return response;
  } catch (err) {
    throw err;
  }
}

// ============================================================================
// 1. COMPLAINT / ISSUE TICKETS SERVICE
// ============================================================================
export const complaintsService = {
  fetchActiveComplaints: async () => {
    try {
      const data = await apiRequest('v1/complaints/active', { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {}
    const cached = localStorage.getItem('campusfix_client_complaints');
    const all = cached ? JSON.parse(cached) : [];
    return all.filter((c) => ['Submitted', 'Under Review', 'Assigned', 'In Progress'].includes(c.status));
  },

  fetchComplaints: async (filters = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'All') {
          query.append(k, v);
        }
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      const data = await apiRequest(`v1/complaints${qs}`, { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {}
    const cached = localStorage.getItem('campusfix_client_complaints');
    return cached ? JSON.parse(cached) : [];
  },

  fetchComplaintById: async (id) => {
    try {
      return await apiRequest(`v1/complaints/${id}`, { method: 'GET' });
    } catch (err) {}
    const cached = localStorage.getItem('campusfix_client_complaints');
    const list = cached ? JSON.parse(cached) : [];
    return list.find((c) => String(c.id) === String(id) || String(c.complaint_id) === String(id)) || null;
  },

  createComplaint: async (payload) => {
    return await apiRequest('v1/complaints', { method: 'POST', body: payload });
  },

  updateComplaint: async (id, payload) => {
    return await apiRequest(`v1/complaints/${id}`, { method: 'PUT', body: payload });
  },

  patchComplaint: async (id, patchData) => {
    return await apiRequest(`v1/complaints/${id}`, { method: 'PATCH', body: patchData });
  },

  deleteComplaint: async (id) => {
    return await apiRequest(`v1/complaints/${id}`, { method: 'DELETE' });
  },

  fetchAnalytics: async () => {
    try {
      return await apiRequest('v1/complaints/analytics', { method: 'GET' });
    } catch (err) {
      return { total: 12, submitted: 3, in_progress: 5, resolved: 4, avg_resolution_hours: 4.8 };
    }
  },

  fetchEmergencyAlerts: async () => {
    try {
      return await apiRequest('v1/complaints/emergency-alerts', { method: 'GET' });
    } catch (err) {
      return [];
    }
  },
};

// ============================================================================
// 2. LOST & FOUND SERVICE
// ============================================================================
export const lostFoundService = {
  fetchActiveLostItems: async () => {
    try {
      const data = await apiRequest('v1/lost-found/items?type=LOST&status=OPEN', { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_items');
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((i) => i.type?.toUpperCase() === 'LOST' && i.status?.toUpperCase() === 'OPEN');
  },

  fetchLostFoundItems: async (filters = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'All') {
          query.append(k, v);
        }
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      const data = await apiRequest(`v1/lost-found/items${qs}`, { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_items');
    let items = raw ? JSON.parse(raw) : [];
    if (filters.type && filters.type !== 'ALL') {
      items = items.filter((i) => i.type?.toUpperCase() === filters.type.toUpperCase());
    }
    return items;
  },

  fetchLostFoundItemById: async (id) => {
    try {
      return await apiRequest(`v1/lost-found/items/${id}`, { method: 'GET' });
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_items');
    const list = raw ? JSON.parse(raw) : [];
    return list.find((i) => String(i.id) === String(id) || String(i.itemCode) === String(id)) || null;
  },

  createLostFoundItem: async (payload) => {
    return await apiRequest('v1/lost-found/items', { method: 'POST', body: payload });
  },

  updateLostFoundItem: async (id, payload) => {
    return await apiRequest(`v1/lost-found/items/${id}`, { method: 'PUT', body: payload });
  },

  patchLostFoundItem: async (id, patchData) => {
    return await apiRequest(`v1/lost-found/items/${id}`, { method: 'PATCH', body: patchData });
  },

  deleteLostFoundItem: async (id) => {
    return await apiRequest(`v1/lost-found/items/${id}`, { method: 'DELETE' });
  },

  fetchPossibleMatches: async (itemId) => {
    try {
      return await apiRequest(`v1/lost-found/items/${itemId}/matches`, { method: 'GET' });
    } catch (err) {
      return [];
    }
  },

  submitItemClaim: async (claimData) => {
    return await apiRequest('v1/lost-found/claims', { method: 'POST', body: claimData });
  },

  fetchItemClaims: async () => {
    try {
      return await apiRequest('v1/lost-found/claims', { method: 'GET' });
    } catch (err) {
      return [];
    }
  },

  updateClaimStatus: async (claimId, statusData) => {
    return await apiRequest(`v1/lost-found/claims/${claimId}/status`, {
      method: 'PATCH',
      body: typeof statusData === 'string' ? { status: statusData } : statusData,
    });
  },

  fetchLostFoundStats: async () => {
    try {
      return await apiRequest('v1/lost-found/stats', { method: 'GET' });
    } catch (err) {
      return { totalLost: 3, totalFound: 2, pendingClaims: 1, returnedCount: 1 };
    }
  },
};

// ============================================================================
// 3. USERS & AUTHENTICATION SERVICE
// ============================================================================
export const usersService = {
  login: (credentials) => apiRequest('v1/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiRequest('v1/auth/register', { method: 'POST', body: userData }),
  getCurrentUser: () => apiRequest('v1/users/me', { method: 'GET' }),
  listUsers: () => apiRequest('v1/users', { method: 'GET' }),
  updateUser: (id, userData) => apiRequest(`v1/users/${id}`, { method: 'PUT', body: userData }),
  deleteUser: (id) => apiRequest(`v1/users/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// 4. STAFF MANAGEMENT SERVICE
// ============================================================================
export const staffService = {
  fetchStaff: () => apiRequest('v1/staff', { method: 'GET' }),
  fetchStaffById: (id) => apiRequest(`v1/staff/${id}`, { method: 'GET' }),
  createStaff: (data) => apiRequest('v1/staff', { method: 'POST', body: data }),
  updateStaff: (id, data) => apiRequest(`v1/staff/${id}`, { method: 'PUT', body: data }),
  patchStaff: (id, data) => apiRequest(`v1/staff/${id}`, { method: 'PATCH', body: data }),
  deleteStaff: (id) => apiRequest(`v1/staff/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// 5. CAMPUS LOCATIONS & QR SERVICE
// ============================================================================
export const locationsService = {
  fetchLocations: () => apiRequest('v1/locations', { method: 'GET' }),
  fetchLocationById: (id) => apiRequest(`v1/locations/${id}`, { method: 'GET' }),
  fetchLocationByQr: (qrCode) => apiRequest(`v1/locations/qr/${encodeURIComponent(qrCode)}`, { method: 'GET' }),
  createLocation: (data) => apiRequest('v1/locations', { method: 'POST', body: data }),
  updateLocation: (id, data) => apiRequest(`v1/locations/${id}`, { method: 'PUT', body: data }),
  deleteLocation: (id) => apiRequest(`v1/locations/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// 6. NOTIFICATIONS SERVICE
// ============================================================================
export const notificationsService = {
  fetchNotifications: () => apiRequest('v1/notifications', { method: 'GET' }),
  markAsRead: (id) => apiRequest(`v1/notifications/${id}/read`, { method: 'PATCH' }),
  deleteNotification: (id) => apiRequest(`v1/notifications/${id}`, { method: 'DELETE' }),
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

export const {
  login,
  register,
  getCurrentUser,
  listUsers,
  updateUser,
  deleteUser,
} = usersService;

// Unified API Export
export const api = {
  complaints: complaintsService,
  lostFound: lostFoundService,
  users: usersService,
  staff: staffService,
  locations: locationsService,
  notifications: notificationsService,
  request: apiRequest,
  axiosInstance: axiosInstance,
};

export default api;
