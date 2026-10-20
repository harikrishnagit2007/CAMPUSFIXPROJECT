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

// Seed initial demo items if none exist in local preview storage
function getLocalItems() {
  try {
    const raw = localStorage.getItem(STORAGE_ITEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse local items', e);
  }

  const initialItems = [
    {
      id: 1,
      itemCode: 'LF-2026-001',
      type: 'LOST',
      title: 'Blue Hydro Flask Water Bottle',
      category: 'Personal Belongings',
      description: 'Navy blue 32oz Hydro Flask with several stickers (NASA and React logo). Lost near Science Block.',
      location: 'Science Block B, 2nd Floor Corridor',
      building: 'Science Block B',
      dateOccurred: '2026-10-15',
      status: 'OPEN', // OPEN, CLAIM_PENDING, RETURNED, CLOSED
      reporterId: 'stu-101',
      reporterName: 'Kavitha S.',
      reporterRole: 'STUDENT',
      contactEmail: 'kavitha.s@rajalakshmi.edu.in',
      contactPhone: '+91 98765 43210',
      imageUrl: '',
      identifyingMarks: 'Small dent on the bottom rim, NASA circular sticker.',
      createdAt: '2026-10-15T09:30:00Z',
    },
    {
      id: 2,
      itemCode: 'LF-2026-002',
      type: 'FOUND',
      title: 'Blue Insulated Water Flask',
      category: 'Personal Belongings',
      description: 'Found a dark blue metal bottle with stickers on bench outside Science Lab.',
      location: 'Science Block B, Room 204 Outer Bench',
      building: 'Science Block B',
      dateOccurred: '2026-10-15',
      status: 'OPEN',
      reporterId: 'staff-401',
      reporterName: 'Ramesh Kumar (Security Desk)',
      reporterRole: 'STAFF',
      contactEmail: 'security@rajalakshmi.edu.in',
      contactPhone: '+91 98765 11223',
      imageUrl: '',
      identifyingMarks: 'Stickers on body, blue lid with loop handle.',
      holdingLocation: 'Security Gate 1 Main Office',
      createdAt: '2026-10-15T11:45:00Z',
    },
    {
      id: 3,
      itemCode: 'LF-2026-003',
      type: 'LOST',
      title: 'Dell Inspiron 65W Laptop Charger',
      category: 'Electronics',
      description: 'Black round barrel tip Dell laptop AC power adapter with velcro tie.',
      location: 'Central Library, 1st Floor Study Cubicle 14',
      building: 'Central Library',
      dateOccurred: '2026-10-16',
      status: 'OPEN',
      reporterId: 'stu-102',
      reporterName: 'Arun Prasath',
      reporterRole: 'STUDENT',
      contactEmail: 'arun.prasath@rajalakshmi.edu.in',
      contactPhone: '+91 98450 67890',
      imageUrl: '',
      identifyingMarks: 'Yellow tape band around charging cable.',
      createdAt: '2026-10-16T14:15:00Z',
    },
    {
      id: 4,
      itemCode: 'LF-2026-004',
      type: 'FOUND',
      title: 'Student College ID Card & Lanyard',
      category: 'ID Cards & Keys',
      description: 'Rajalakshmi Engineering College blue lanyard with identity card.',
      location: 'Mechanical Workshop Block, Near Water Cooler',
      building: 'Mechanical Workshop',
      dateOccurred: '2026-10-17',
      status: 'CLAIM_PENDING',
      reporterId: 'staff-402',
      reporterName: 'Priya M. (Lab Assistant)',
      reporterRole: 'STAFF',
      contactEmail: 'priya.m@rajalakshmi.edu.in',
      contactPhone: '+91 98401 54321',
      imageUrl: '',
      identifyingMarks: 'Department of AIDS batch card.',
      holdingLocation: 'Department Office HOD Cabin Reception',
      createdAt: '2026-10-17T08:00:00Z',
    },
  ];

  try {
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(initialItems));
  } catch {}
  return initialItems;
}

function getLocalClaims() {
  try {
    const raw = localStorage.getItem(STORAGE_CLAIMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse local claims', e);
  }

  const initialClaims = [
    {
      id: 1,
      claimCode: 'CLM-2026-001',
      itemId: 4,
      itemTitle: 'Student College ID Card & Lanyard',
      claimantId: 'stu-105',
      claimantName: 'Harikrishna G M',
      claimantEmail: 'harikrishna.gm.2025.aids@rajalakshmi.edu.in',
      claimantPhone: '+91 98765 00001',
      ownershipProof: 'Register number 210801045, batch 2025 AIDS, back of ID has library barcode #REC-8821.',
      status: 'UNDER_REVIEW', // PENDING, UNDER_REVIEW, APPROVED, REJECTED, HANDED_OVER
      adminNotes: 'Verification scheduled at Department Office reception.',
      submittedAt: '2026-10-17T09:10:00Z',
      verifiedAt: null,
    },
  ];

  try {
    localStorage.setItem(STORAGE_CLAIMS_KEY, JSON.stringify(initialClaims));
  } catch {}
  return initialClaims;
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
