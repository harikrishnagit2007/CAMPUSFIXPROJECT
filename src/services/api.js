/**
 * CampusFix Centralized REST API Service Layer
 * Location: src/services/api.js
 *
 * Prepared for Java Spring Boot REST Backend with MySQL.
 * Fully supports all standard HTTP verbs: GET, POST, PUT, PATCH, DELETE.
 *
 * Configurable via environment variable: VITE_JAVA_API_BASE_URL (e.g. http://localhost:8080/api)
 */

const rawBase =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_JAVA_API_BASE_URL) ||
  '/api';
const API_BASE_URL = rawBase.replace(/\/+$/, '');

/**
 * Centralized HTTP request dispatcher
 */
export async function apiRequest(endpoint, { method = 'GET', body = null, headers = {}, ...options } = {}) {
  const token = localStorage.getItem('campusfix_token');
  const storedUserJson = localStorage.getItem('campusfix_user');
  let storedUser = null;
  try {
    if (storedUserJson) storedUser = JSON.parse(storedUserJson);
  } catch (e) {}

  const requestHeaders = {
    ...headers,
  };

  if (!(body instanceof FormData) && method !== 'GET') {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (storedUser) {
    if (storedUser.id || storedUser.uid) requestHeaders['X-User-Id'] = String(storedUser.id || storedUser.uid);
    if (storedUser.role) requestHeaders['X-User-Role'] = storedUser.role;
    if (storedUser.email) requestHeaders['X-User-Email'] = storedUser.email;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const fullUrl = `${API_BASE_URL}/${cleanEndpoint}`;

  const config = {
    method,
    headers: requestHeaders,
    ...options,
  };

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(fullUrl, config);
  } catch (networkError) {
    console.warn(`[Java REST API] Network offline at ${fullUrl}:`, networkError.message);
    throw new Error('Could not connect to Java REST server. Fallback caching active.');
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg =
      data?.message || data?.error || data?.detail || `HTTP ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ============================================================================
// 1. COMPLAINT / ISSUE TICKETS SERVICE
// Java Controller: @RestController @RequestMapping("/api/v1/complaints")
// ============================================================================
export const complaintsService = {
  /**
   * Fetch only ACTIVE complaint tickets (Submitted, Under Review, Assigned, In Progress)
   * Java Endpoint: GET /api/v1/complaints/active
   */
  fetchActiveComplaints: async () => {
    try {
      const data = await apiRequest('/v1/complaints/active', { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {
      console.info('[Complaints] Using client fallback for active tickets');
    }
    const cached = localStorage.getItem('campusfix_client_complaints');
    const all = cached ? JSON.parse(cached) : [];
    return all.filter((c) => ['Submitted', 'Under Review', 'Assigned', 'In Progress'].includes(c.status));
  },

  /**
   * Fetch all or filtered complaints
   * Java Endpoint: GET /api/v1/complaints
   */
  fetchComplaints: async (filters = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'All') {
          query.append(k, v);
        }
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      const data = await apiRequest(`/v1/complaints${qs}`, { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {}
    const cached = localStorage.getItem('campusfix_client_complaints');
    return cached ? JSON.parse(cached) : [];
  },

  /**
   * Fetch single complaint by ID
   * Java Endpoint: GET /api/v1/complaints/{id}
   */
  fetchComplaintById: async (id) => {
    try {
      return await apiRequest(`/v1/complaints/${id}`, { method: 'GET' });
    } catch (err) {}
    const cached = localStorage.getItem('campusfix_client_complaints');
    const list = cached ? JSON.parse(cached) : [];
    return list.find((c) => String(c.id) === String(id) || String(c.complaint_id) === String(id)) || null;
  },

  /**
   * Create new complaint ticket
   * Java Endpoint: POST /api/v1/complaints
   */
  createComplaint: async (payload) => {
    return await apiRequest('/v1/complaints', { method: 'POST', body: payload });
  },

  /**
   * Full update of a complaint ticket
   * Java Endpoint: PUT /api/v1/complaints/{id}
   */
  updateComplaint: async (id, payload) => {
    return await apiRequest(`/v1/complaints/${id}`, { method: 'PUT', body: payload });
  },

  /**
   * Partial update of a complaint ticket (e.g. status transition)
   * Java Endpoint: PATCH /api/v1/complaints/{id}
   */
  patchComplaint: async (id, patchData) => {
    return await apiRequest(`/v1/complaints/${id}`, { method: 'PATCH', body: patchData });
  },

  /**
   * Delete a complaint ticket
   * Java Endpoint: DELETE /api/v1/complaints/{id}
   */
  deleteComplaint: async (id) => {
    return await apiRequest(`/v1/complaints/${id}`, { method: 'DELETE' });
  },

  /**
   * Dashboard Analytics
   * Java Endpoint: GET /api/v1/complaints/analytics
   */
  fetchAnalytics: async () => {
    try {
      return await apiRequest('/v1/complaints/analytics', { method: 'GET' });
    } catch (err) {
      return { total: 12, submitted: 3, in_progress: 5, resolved: 4, avg_resolution_hours: 4.8 };
    }
  },

  /**
   * Emergency alerts
   * Java Endpoint: GET /api/v1/complaints/emergency-alerts
   */
  fetchEmergencyAlerts: async () => {
    try {
      return await apiRequest('/v1/complaints/emergency-alerts', { method: 'GET' });
    } catch (err) {
      return [];
    }
  },
};

// ============================================================================
// 2. LOST & FOUND SERVICE
// Java Controller: @RestController @RequestMapping("/api/v1/lost-found")
// ============================================================================
export const lostFoundService = {
  /**
   * Fetch ACTIVE lost item records
   * Java Endpoint: GET /api/v1/lost-found/items/active-lost
   */
  fetchActiveLostItems: async () => {
    try {
      const data = await apiRequest('/v1/lost-found/items?type=LOST&status=OPEN', { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {
      console.info('[LostFound] Client fallback for active lost items');
    }
    const raw = localStorage.getItem('campusfix_lostfound_items');
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((i) => i.type?.toUpperCase() === 'LOST' && i.status?.toUpperCase() === 'OPEN');
  },

  /**
   * Fetch all or filtered Lost & Found items
   * Java Endpoint: GET /api/v1/lost-found/items
   */
  fetchLostFoundItems: async (filters = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'All') {
          query.append(k, v);
        }
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      const data = await apiRequest(`/v1/lost-found/items${qs}`, { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_items');
    let items = raw ? JSON.parse(raw) : [];
    if (filters.type && filters.type !== 'ALL') {
      items = items.filter((i) => i.type?.toUpperCase() === filters.type.toUpperCase());
    }
    if (filters.category && filters.category !== 'All') {
      items = items.filter((i) => i.category?.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.status && filters.status !== 'All' && filters.status !== 'ALL') {
      items = items.filter((i) => i.status?.toUpperCase() === filters.status.toUpperCase());
    }
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase();
      items = items.filter((i) =>
        `${i.title} ${i.itemName} ${i.description} ${i.location} ${i.itemCode}`.toLowerCase().includes(q)
      );
    }
    return items;
  },

  /**
   * Fetch single Lost & Found item by ID
   * Java Endpoint: GET /api/v1/lost-found/items/{id}
   */
  fetchLostFoundItemById: async (id) => {
    try {
      return await apiRequest(`/v1/lost-found/items/${id}`, { method: 'GET' });
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_items');
    const list = raw ? JSON.parse(raw) : [];
    return list.find((i) => String(i.id) === String(id) || String(i.itemCode) === String(id)) || null;
  },

  /**
   * Post/Create a new Lost or Found item
   * Java Endpoint: POST /api/v1/lost-found/items
   */
  createLostFoundItem: async (payload) => {
    try {
      const res = await apiRequest('/v1/lost-found/items', { method: 'POST', body: payload });
      if (res) return res;
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_items');
    const list = raw ? JSON.parse(raw) : [];
    const newId = list.length > 0 ? Math.max(...list.map((i) => Number(i.id) || 0)) + 1 : 1;
    const created = {
      id: newId,
      itemCode: `LF-${new Date().getFullYear()}-${String(newId).padStart(3, '0')}`,
      type: payload.type || 'LOST',
      title: payload.title || payload.itemName || 'Untitled Item',
      itemName: payload.itemName || payload.title || 'Untitled Item',
      category: payload.category || 'General',
      description: payload.description || '',
      location: payload.location || 'Campus',
      building: payload.building || '',
      dateOccurred: payload.dateOccurred || payload.date || new Date().toISOString().split('T')[0],
      date: payload.date || payload.dateOccurred || new Date().toISOString().split('T')[0],
      status: 'OPEN',
      reporterId: payload.reporterId || 'anonymous',
      reporterName: payload.reporterName || 'Student User',
      reporterRole: payload.reporterRole || 'STUDENT',
      contactEmail: payload.contactEmail || '',
      contactPhone: payload.contactPhone || '',
      identifyingMarks: payload.identifyingMarks || payload.description || '',
      createdAt: new Date().toISOString(),
    };
    list.unshift(created);
    try {
      localStorage.setItem('campusfix_lostfound_items', JSON.stringify(list));
    } catch {}
    return created;
  },

  /**
   * Full update of Lost & Found item
   * Java Endpoint: PUT /api/v1/lost-found/items/{id}
   */
  updateLostFoundItem: async (id, payload) => {
    try {
      return await apiRequest(`/v1/lost-found/items/${id}`, { method: 'PUT', body: payload });
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_items');
    if (raw) {
      const list = JSON.parse(raw);
      const idx = list.findIndex((i) => String(i.id) === String(id));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload, updatedAt: new Date().toISOString() };
        localStorage.setItem('campusfix_lostfound_items', JSON.stringify(list));
        return list[idx];
      }
    }
    return null;
  },

  /**
   * Partial update of Lost & Found item (e.g. mark returned)
   * Java Endpoint: PATCH /api/v1/lost-found/items/{id}
   */
  patchLostFoundItem: async (id, patchData) => {
    try {
      return await apiRequest(`/v1/lost-found/items/${id}`, { method: 'PATCH', body: patchData });
    } catch (err) {}
    return lostFoundService.updateLostFoundItem(id, patchData);
  },

  /**
   * Delete Lost & Found item
   * Java Endpoint: DELETE /api/v1/lost-found/items/{id}
   */
  deleteLostFoundItem: async (id) => {
    try {
      return await apiRequest(`/v1/lost-found/items/${id}`, { method: 'DELETE' });
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_items');
    if (raw) {
      const list = JSON.parse(raw).filter((i) => String(i.id) !== String(id));
      localStorage.setItem('campusfix_lostfound_items', JSON.stringify(list));
    }
    return { success: true };
  },

  /**
   * Match finding correlations
   * Java Endpoint: GET /api/v1/lost-found/items/{id}/matches
   */
  fetchPossibleMatches: async (itemId) => {
    try {
      return await apiRequest(`/v1/lost-found/items/${itemId}/matches`, { method: 'GET' });
    } catch (err) {
      return [];
    }
  },

  /**
   * Submit item claim
   * Java Endpoint: POST /api/v1/lost-found/claims
   */
  submitItemClaim: async (claimData) => {
    try {
      return await apiRequest('/v1/lost-found/claims', { method: 'POST', body: claimData });
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_claims');
    const claims = raw ? JSON.parse(raw) : [];
    const newId = claims.length > 0 ? Math.max(...claims.map((c) => Number(c.id) || 0)) + 1 : 1;
    const newClaim = {
      id: newId,
      claimCode: `CLM-${new Date().getFullYear()}-${String(newId).padStart(3, '0')}`,
      ...claimData,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
    claims.unshift(newClaim);
    try {
      localStorage.setItem('campusfix_lostfound_claims', JSON.stringify(claims));
    } catch {}
    return newClaim;
  },

  /**
   * Fetch claims list
   * Java Endpoint: GET /api/v1/lost-found/claims
   */
  fetchItemClaims: async (filters = {}) => {
    try {
      return await apiRequest('/v1/lost-found/claims', { method: 'GET' });
    } catch (err) {}
    const raw = localStorage.getItem('campusfix_lostfound_claims');
    return raw ? JSON.parse(raw) : [];
  },

  /**
   * Patch claim status
   * Java Endpoint: PATCH /api/v1/lost-found/claims/{id}/status
   */
  updateClaimStatus: async (claimId, statusData) => {
    try {
      return await apiRequest(`/v1/lost-found/claims/${claimId}/status`, {
        method: 'PATCH',
        body: typeof statusData === 'string' ? { status: statusData } : statusData,
      });
    } catch (err) {}
    return null;
  },

  /**
   * Fetch Lost & Found statistics
   * Java Endpoint: GET /api/v1/lost-found/stats
   */
  fetchLostFoundStats: async () => {
    try {
      return await apiRequest('/v1/lost-found/stats', { method: 'GET' });
    } catch (err) {
      return { totalLost: 3, totalFound: 2, pendingClaims: 1, returnedCount: 1 };
    }
  },
};

// ============================================================================
// 3. USERS & AUTHENTICATION SERVICE
// Java Controller: @RestController @RequestMapping("/api/v1/users") & "/api/v1/auth"
// ============================================================================
export const usersService = {
  /**
   * User Login
   * Java Endpoint: POST /api/v1/auth/login
   */
  login: (credentials) => apiRequest('/v1/auth/login', { method: 'POST', body: credentials }),

  /**
   * User Registration
   * Java Endpoint: POST /api/v1/auth/register
   */
  register: (userData) => apiRequest('/v1/auth/register', { method: 'POST', body: userData }),

  /**
   * Fetch current user profile
   * Java Endpoint: GET /api/v1/users/me
   */
  getCurrentUser: () => apiRequest('/v1/users/me', { method: 'GET' }),

  /**
   * List all users (Admin)
   * Java Endpoint: GET /api/v1/users
   */
  listUsers: (params = {}) => apiRequest('/v1/users', { method: 'GET' }),

  /**
   * Update user profile
   * Java Endpoint: PUT /api/v1/users/{id}
   */
  updateUser: (id, userData) => apiRequest(`/v1/users/${id}`, { method: 'PUT', body: userData }),

  /**
   * Delete user (Admin)
   * Java Endpoint: DELETE /api/v1/users/{id}
   */
  deleteUser: (id) => apiRequest(`/v1/users/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// 4. STAFF MANAGEMENT SERVICE
// Java Controller: @RestController @RequestMapping("/api/v1/staff")
// ============================================================================
export const staffService = {
  fetchStaff: () => apiRequest('/v1/staff', { method: 'GET' }),
  fetchStaffById: (id) => apiRequest(`/v1/staff/${id}`, { method: 'GET' }),
  createStaff: (data) => apiRequest('/v1/staff', { method: 'POST', body: data }),
  updateStaff: (id, data) => apiRequest(`/v1/staff/${id}`, { method: 'PUT', body: data }),
  patchStaff: (id, data) => apiRequest(`/v1/staff/${id}`, { method: 'PATCH', body: data }),
  deleteStaff: (id) => apiRequest(`/v1/staff/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// 5. CAMPUS LOCATIONS & QR SERVICE
// Java Controller: @RestController @RequestMapping("/api/v1/locations")
// ============================================================================
export const locationsService = {
  fetchLocations: () => apiRequest('/v1/locations', { method: 'GET' }),
  fetchLocationById: (id) => apiRequest(`/v1/locations/${id}`, { method: 'GET' }),
  fetchLocationByQr: (qrCode) => apiRequest(`/v1/locations/qr/${encodeURIComponent(qrCode)}`, { method: 'GET' }),
  createLocation: (data) => apiRequest('/v1/locations', { method: 'POST', body: data }),
  updateLocation: (id, data) => apiRequest(`/v1/locations/${id}`, { method: 'PUT', body: data }),
  deleteLocation: (id) => apiRequest(`/v1/locations/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// 6. NOTIFICATIONS SERVICE
// Java Controller: @RestController @RequestMapping("/api/v1/notifications")
// ============================================================================
export const notificationsService = {
  fetchNotifications: () => apiRequest('/v1/notifications', { method: 'GET' }),
  markAsRead: (id) => apiRequest(`/v1/notifications/${id}/read`, { method: 'PATCH' }),
  deleteNotification: (id) => apiRequest(`/v1/notifications/${id}`, { method: 'DELETE' }),
};

// Direct Named Exports for Component Convenience
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

// ============================================================================
// Unified API Export
// ============================================================================
export const api = {
  complaints: complaintsService,
  lostFound: lostFoundService,
  users: usersService,
  staff: staffService,
  locations: locationsService,
  notifications: notificationsService,
  request: apiRequest,
};

export default api;
