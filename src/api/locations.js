import { apiClient } from './client';

export const locationsApi = {
  getLocations: async () => {
    try {
      const locations = await apiClient('/locations', { method: 'GET' });
      return Array.isArray(locations) ? locations : [];
    } catch (error) {
      console.error('[locationsApi] getLocations error:', error);
      return [];
    }
  },

  getLocation: async (id) => {
    try {
      return await apiClient(`/locations/${id}`, { method: 'GET' });
    } catch (error) {
      console.error(`[locationsApi] getLocation error for id ${id}:`, error);
      return null;
    }
  },

  getLocationByQr: async (qrCode) => {
    try {
      return await apiClient(`/locations/qr/${qrCode}`, { method: 'GET' });
    } catch (error) {
      console.error(`[locationsApi] getLocationByQr error:`, error);
      return null;
    }
  },

  createLocation: async (data) => {
    return await apiClient('/locations', {
      method: 'POST',
      body: {
        id: data.id || `LOC-${(data.building || 'CAMPUS').slice(0, 3).toUpperCase()}-${data.room || Math.floor(100 + Math.random() * 900)}`,
        building: data.building,
        room: data.room,
        floor: data.floor || '1st Floor',
        wing: data.wing || 'Main Wing',
        qrCode: data.qr_code || data.qrCode || `QR-${data.id || Date.now()}`,
        activeComplaints: data.active_complaints || data.activeComplaints || 0,
      },
    });
  },

  updateLocation: async (id, data) => {
    return await apiClient(`/locations/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  deleteLocation: async (id) => {
    return await apiClient(`/locations/${id}`, {
      method: 'DELETE',
    });
  },
};
