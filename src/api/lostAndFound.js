import { apiClient } from './client';

const normalizeItem = (data) => {
  if (!data) return null;
  const id = data.id || data.itemCode || data.item_code;
  const itemName = data.itemName || data.item_name || data.title || 'Campus Item';
  const itemCode = data.itemCode || data.item_code || (id ? `ITM-${id}` : 'ITM-NEW');
  return {
    ...data,
    id,
    itemCode,
    item_code: itemCode,
    itemName,
    item_name: itemName,
    title: itemName,
    type: data.type ? data.type.toUpperCase() : 'LOST',
    category: data.category || 'General',
    building: data.building || '',
    location: data.location || data.building || 'Campus Facilities',
    dateOccurred: data.dateOccurred || data.date_occurred || (data.date ? data.date : new Date().toISOString().split('T')[0]),
    date_occurred: data.dateOccurred || data.date_occurred || (data.date ? data.date : new Date().toISOString().split('T')[0]),
    date: data.date || data.dateOccurred || data.date_occurred,
    approxTime: data.approxTime || data.approx_time || '',
    approx_time: data.approxTime || data.approx_time || '',
    description: data.description || '',
    identifyingMarks: data.identifyingMarks || data.identifying_marks || '',
    identifying_marks: data.identifyingMarks || data.identifying_marks || '',
    holdingLocation: data.holdingLocation || data.holding_location || '',
    holding_location: data.holdingLocation || data.holding_location || '',
    image: data.image || null,
    status: data.status || 'OPEN',
    reporterId: data.reporterId || data.reporter_id || '',
    reporter_id: data.reporterId || data.reporter_id || '',
    reporterName: data.reporterName || data.reporter_name || '',
    reporter_name: data.reporterName || data.reporter_name || '',
    contactEmail: data.contactEmail || data.contact_email || '',
    contact_email: data.contactEmail || data.contact_email || '',
    contactPhone: data.contactPhone || data.contact_phone || '',
    contact_phone: data.contactPhone || data.contact_phone || '',
    created_at: data.createdAt || data.created_at || new Date().toISOString(),
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
  };
};

const normalizeClaim = (data) => {
  if (!data) return null;
  const id = data.id || data.claimCode || data.claim_code;
  const claimCode = data.claimCode || data.claim_code || (id ? `CLM-${id}` : 'CLM-NEW');
  return {
    ...data,
    id,
    claimCode,
    claim_code: claimCode,
    itemId: data.itemId || data.item_id,
    item_id: data.itemId || data.item_id,
    itemTitle: data.itemTitle || data.item_title,
    item_title: data.itemTitle || data.item_title,
    claimantId: data.claimantId || data.claimant_id,
    claimant_id: data.claimantId || data.claimant_id,
    claimantName: data.claimantName || data.claimant_name,
    claimant_name: data.claimantName || data.claimant_name,
    claimantEmail: data.claimantEmail || data.claimant_email,
    claimant_email: data.claimantEmail || data.claimant_email,
    claimantPhone: data.claimantPhone || data.claimant_phone,
    claimant_phone: data.claimantPhone || data.claimant_phone,
    ownershipProof: data.ownershipProof || data.ownership_proof,
    ownership_proof: data.ownershipProof || data.ownership_proof,
    status: data.status || 'PENDING',
    adminNotes: data.adminNotes || data.admin_notes || '',
    admin_notes: data.adminNotes || data.admin_notes || '',
    submittedAt: data.submittedAt || data.submitted_at || new Date().toISOString(),
    submitted_at: data.submittedAt || data.submitted_at || new Date().toISOString(),
  };
};

export const lostAndFoundApi = {
  /**
   * GET /api/v1/lost-found/items
   */
  getItems: async (params = {}) => {
    try {
      const q = new URLSearchParams();
      if (params.type && params.type !== 'ALL') q.append('type', params.type.toUpperCase());
      if (params.category && params.category !== 'ALL') q.append('category', params.category);
      if (params.building && params.building !== 'ALL') q.append('building', params.building);
      if (params.status && params.status !== 'ALL') q.append('status', params.status);
      if (params.query || params.search) q.append('search', params.query || params.search);

      const qs = q.toString() ? `?${q.toString()}` : '';
      const response = await apiClient(`/lost-found/items${qs}`, { method: 'GET' });
      return Array.isArray(response) ? response.map(normalizeItem) : [];
    } catch (error) {
      console.error('[lostAndFoundApi] getItems error:', error);
      return [];
    }
  },

  /**
   * GET /api/v1/lost-found/items/{id}
   */
  getItemById: async (id) => {
    try {
      const response = await apiClient(`/lost-found/items/${id}`, { method: 'GET' });
      return normalizeItem(response);
    } catch (error) {
      console.error(`[lostAndFoundApi] getItemById error for id ${id}:`, error);
      return null;
    }
  },

  /**
   * POST /api/v1/lost-found/items or /report
   */
  createItem: async (payload) => {
    const body = {
      type: payload.type ? payload.type.toUpperCase() : 'LOST',
      itemName: payload.itemName || payload.item_name || payload.title,
      category: payload.category || 'General',
      building: payload.building || (payload.location ? payload.location.split('-')[0].trim() : 'Campus Block'),
      location: payload.location || payload.building || 'Campus',
      dateOccurred: payload.dateOccurred || payload.date_occurred || payload.date || new Date().toISOString().split('T')[0],
      approxTime: payload.approxTime || payload.approx_time || '',
      description: payload.description || '',
      identifyingMarks: payload.identifyingMarks || payload.identifying_marks || '',
      holdingLocation: payload.holdingLocation || payload.holding_location || '',
      image: payload.image || null,
      status: payload.status || 'OPEN',
      reporterId: payload.reporterId || payload.reporter_id || '',
      reporterName: payload.reporterName || payload.reporter_name || '',
      reporterRole: payload.reporterRole || payload.reporter_role || 'STUDENT',
      contactEmail: payload.contactEmail || payload.contact_email || '',
      contactPhone: payload.contactPhone || payload.contact_phone || '',
    };

    const response = await apiClient('/lost-found/items', {
      method: 'POST',
      body,
    });
    return normalizeItem(response);
  },

  /**
   * PUT /api/v1/lost-found/items/{id}
   */
  updateItem: async (id, payload) => {
    const body = {
      type: payload.type ? payload.type.toUpperCase() : 'LOST',
      itemName: payload.itemName || payload.item_name || payload.title,
      category: payload.category,
      building: payload.building,
      location: payload.location,
      dateOccurred: payload.dateOccurred || payload.date_occurred || payload.date,
      approxTime: payload.approxTime || payload.approx_time,
      description: payload.description,
      identifyingMarks: payload.identifyingMarks || payload.identifying_marks,
      holdingLocation: payload.holdingLocation || payload.holding_location,
      image: payload.image,
      status: payload.status,
      reporterId: payload.reporterId || payload.reporter_id,
      reporterName: payload.reporterName || payload.reporter_name,
      reporterRole: payload.reporterRole || payload.reporter_role,
      contactEmail: payload.contactEmail || payload.contact_email,
      contactPhone: payload.contactPhone || payload.contact_phone,
    };

    const response = await apiClient(`/lost-found/items/${id}`, {
      method: 'PUT',
      body,
    });
    return normalizeItem(response);
  },

  /**
   * DELETE /api/v1/lost-found/items/{id}
   */
  deleteItem: async (id) => {
    return await apiClient(`/lost-found/items/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * POST /api/v1/lost-found/claims
   */
  submitClaim: async (payload) => {
    const body = {
      itemId: payload.itemId || payload.item_id,
      itemTitle: payload.itemTitle || payload.item_title,
      claimantId: payload.claimantId || payload.claimant_id || '',
      claimantName: payload.claimantName || payload.claimant_name || '',
      claimantEmail: payload.claimantEmail || payload.claimant_email || '',
      claimantPhone: payload.claimantPhone || payload.claimant_phone || '',
      ownershipProof: payload.ownershipProof || payload.ownership_proof || '',
      status: payload.status || 'PENDING',
      adminNotes: payload.adminNotes || payload.admin_notes || '',
    };

    const response = await apiClient('/lost-found/claims', {
      method: 'POST',
      body,
    });
    return normalizeClaim(response);
  },

  /**
   * GET /api/v1/lost-found/claims
   */
  getClaims: async (params = {}) => {
    try {
      const q = new URLSearchParams();
      if (params.status && params.status !== 'ALL') q.append('status', params.status);
      if (params.claimantId) q.append('claimantId', params.claimantId);
      const qs = q.toString() ? `?${q.toString()}` : '';
      const response = await apiClient(`/lost-found/claims${qs}`, { method: 'GET' });
      return Array.isArray(response) ? response.map(normalizeClaim) : [];
    } catch (error) {
      console.error('[lostAndFoundApi] getClaims error:', error);
      return [];
    }
  },

  /**
   * PATCH /api/v1/lost-found/claims/{claimCode}/status
   */
  updateClaimStatus: async (claimId, newStatus, adminNotes = '') => {
    const response = await apiClient(`/lost-found/claims/${claimId}/status`, {
      method: 'PATCH',
      body: {
        status: newStatus,
        adminNotes: adminNotes,
      },
    });
    return { success: true, claim: normalizeClaim(response) };
  },

  /**
   * GET /api/v1/lost-found/stats
   */
  getStats: async () => {
    try {
      const stats = await apiClient('/lost-found/stats', { method: 'GET' });
      return {
        totalLost: stats.totalLost !== undefined ? stats.totalLost : 0,
        totalFound: stats.totalFound !== undefined ? stats.totalFound : 0,
        pendingClaims: stats.pendingClaims !== undefined ? stats.pendingClaims : 0,
        returnedCount: stats.returnedCount !== undefined ? stats.returnedCount : 0,
      };
    } catch (error) {
      console.error('[lostAndFoundApi] getStats error:', error);
      return { totalLost: 0, totalFound: 0, pendingClaims: 0, returnedCount: 0 };
    }
  },

  /**
   * GET /api/v1/lost-found/items/{id}/matches
   */
  findMatches: async (targetItem) => {
    if (!targetItem || (!targetItem.id && !targetItem.itemCode)) return [];
    try {
      const id = targetItem.id || targetItem.itemCode;
      const matches = await apiClient(`/lost-found/items/${id}/matches`, { method: 'GET' });
      return Array.isArray(matches) ? matches : [];
    } catch (error) {
      console.error('[lostAndFoundApi] findMatches error:', error);
      return [];
    }
  },
};
