import { apiClient } from './client';

/**
 * Campus Lost & Found Service Layer
 * Designed to communicate with a Java Spring Boot REST Backend backed by MySQL.
 *
 * Spring Boot REST Controller Endpoints Contract:
 * - GET    /api/v1/lost-found/items          -> Retrieve items (with optional ?type=LOST|FOUND&category=&status=&query=)
 * - GET    /api/v1/lost-found/items/{id}     -> Retrieve single item details
 * - POST   /api/v1/lost-found/items          -> Create new Lost or Found item report
 * - PUT    /api/v1/lost-found/items/{id}     -> Update item report
 * - DELETE /api/v1/lost-found/items/{id}     -> Delete item report
 * - GET    /api/v1/lost-found/items/{id}/matches -> Find possible matches for an item
 * - POST   /api/v1/lost-found/claims         -> Submit a claim for a found item
 * - GET    /api/v1/lost-found/claims         -> List claims (filtered by user or item)
 * - PATCH  /api/v1/lost-found/claims/{id}/status -> Admin/Staff update claim status (APPROVED, REJECTED, RETURNED)
 *
 * Includes local storage resilience for frontend preview before the external Java backend is connected.
 */

const STORAGE_ITEMS_KEY = 'campusfix_lostfound_items';
const STORAGE_CLAIMS_KEY = 'campusfix_lostfound_claims';

// Retrieve local items without inserting fake seed data
function getLocalItems() {
  try {
    const raw = localStorage.getItem(STORAGE_ITEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse local items', e);
  }
  return [];
}

function getLocalClaims() {
  try {
    const raw = localStorage.getItem(STORAGE_CLAIMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse local claims', e);
  }
  return [];
}

export const lostAndFoundApi = {
  /**
   * Fetch all Lost & Found items from Java Spring Boot REST API
   * Endpoint: GET /api/v1/lost-found/items
   */
  getItems: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
          query.append(k, v);
        }
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      const data = await apiClient(`/v1/lost-found/items${qs}`, { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {
      console.info('Java Spring Boot API not connected yet; falling back to local storage simulation.');
    }

    // Local storage fallback
    let items = getLocalItems();
    if (params.type && params.type !== 'ALL') {
      items = items.filter((i) => i.type.toUpperCase() === params.type.toUpperCase());
    }
    if (params.category && params.category !== 'ALL') {
      items = items.filter((i) => i.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params.status && params.status !== 'ALL') {
      items = items.filter((i) => i.status.toUpperCase() === params.status.toUpperCase());
    }
    if (params.query && params.query.trim()) {
      const q = params.query.toLowerCase();
      items = items.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q) ||
          i.identifyingMarks?.toLowerCase().includes(q)
      );
    }
    return items;
  },

  /**
   * Fetch single item by ID
   * Endpoint: GET /api/v1/lost-found/items/{id}
   */
  getItemById: async (id) => {
    try {
      const data = await apiClient(`/v1/lost-found/items/${id}`, { method: 'GET' });
      if (data) return data;
    } catch (err) {
      console.info('Java Spring Boot API single item fetch fallback.');
    }
    const items = getLocalItems();
    return items.find((i) => String(i.id) === String(id)) || null;
  },

  /**
   * Create a new Lost or Found Item Report
   * Endpoint: POST /api/v1/lost-found/items
   */
  createItem: async (payload) => {
    return await apiClient('/v1/lost-found/items', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Update item status or details
   * Endpoint: PUT /api/v1/lost-found/items/{id}
   */
  updateItem: async (id, payload) => {
    return await apiClient(`/v1/lost-found/items/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Delete item
   * Endpoint: DELETE /api/v1/lost-found/items/{id}
   */
  deleteItem: async (id) => {
    return await apiClient(`/v1/lost-found/items/${id}`, { method: 'DELETE' });
  },

  /**
   * Intelligent Possible-Match Finder
   * Endpoint: GET /api/v1/lost-found/items/{id}/matches
   * Correlates opposite item type (LOST <-> FOUND) by category, title keywords, location, and dates.
   */
  findMatches: async (targetItem) => {
    if (!targetItem) return [];

    try {
      const data = await apiClient(`/v1/lost-found/items/${targetItem.id}/matches`, { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {
      // Local fallback smart matcher
    }

    const allItems = getLocalItems();
    const oppositeType = targetItem.type === 'LOST' ? 'FOUND' : 'LOST';
    const candidates = allItems.filter(
      (item) => item.type === oppositeType && String(item.id) !== String(targetItem.id) && item.status !== 'CLOSED'
    );

    const targetWords = `${targetItem.title} ${targetItem.description} ${targetItem.identifyingMarks}`
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2);

    const matches = [];

    for (const cand of candidates) {
      let score = 0;
      const reasons = [];

      // 1. Category match (+40%)
      if (cand.category && targetItem.category && cand.category.toLowerCase() === targetItem.category.toLowerCase()) {
        score += 40;
        reasons.push(`Same Category (${cand.category})`);
      }

      // 2. Location / Building similarity (+25%)
      if (cand.building && targetItem.building && cand.building.toLowerCase() === targetItem.building.toLowerCase()) {
        score += 25;
        reasons.push(`Same Building (${cand.building})`);
      } else if (
        cand.location &&
        targetItem.location &&
        (cand.location.toLowerCase().includes(targetItem.location.toLowerCase()) ||
          targetItem.location.toLowerCase().includes(cand.location.toLowerCase()))
      ) {
        score += 20;
        reasons.push('Overlapping Location');
      }

      // 3. Keyword matches in Title / Description (+35%)
      const candWords = `${cand.title} ${cand.description} ${cand.identifyingMarks}`
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2);

      const commonWords = targetWords.filter((w) => candWords.includes(w));
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
  },

  /**
   * Submit a Claim for a Found Item
   * Endpoint: POST /api/v1/lost-found/claims
   */
  submitClaim: async (payload) => {
    return await apiClient('/v1/lost-found/claims', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Retrieve Claims
   * Endpoint: GET /api/v1/lost-found/claims
   */
  getClaims: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, v);
        }
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      const data = await apiClient(`/v1/lost-found/claims${qs}`, { method: 'GET' });
      if (Array.isArray(data)) return data;
    } catch (err) {
      console.info('Java Spring Boot API get claims fallback.');
    }

    let claims = getLocalClaims();
    if (params.claimantId) {
      claims = claims.filter((c) => String(c.claimantId) === String(params.claimantId));
    }
    if (params.itemId) {
      claims = claims.filter((c) => String(c.itemId) === String(params.itemId));
    }
    if (params.status && params.status !== 'ALL') {
      claims = claims.filter((c) => c.status === params.status);
    }
    return claims;
  },

  /**
   * Update Claim Status (Admin/Staff)
   * Endpoint: PATCH /api/v1/lost-found/claims/{id}/status
   */
  updateClaimStatus: async (claimId, newStatus, adminNotes = '') => {
    return await apiClient(`/v1/lost-found/claims/${claimId}/status`, {
      method: 'PATCH',
      body: { status: newStatus, adminNotes },
    });
  },

  /**
   * Summary Statistics for Lost & Found Dashboard
   */
  getStats: async () => {
    const items = await lostAndFoundApi.getItems();
    const claims = await lostAndFoundApi.getClaims();

    return {
      totalLost: items.filter((i) => i.type === 'LOST').length,
      totalFound: items.filter((i) => i.type === 'FOUND').length,
      pendingClaims: claims.filter((c) => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length,
      returnedCount: items.filter((i) => i.status === 'RETURNED').length,
    };
  },
};
