import { apiClient } from './client';

const DEFAULT_LOCATIONS = [
  {
    id: 'LOC-101',
    building: 'Technology Block C',
    room: 'Room 304',
    department: 'Computer Science',
    type: 'Lab / Classroom',
    qr_code_svg: '',
  },
  {
    id: 'LOC-102',
    building: 'Academic Block A',
    room: 'Room 102',
    department: 'Electrical Engineering',
    type: 'Classroom',
    qr_code_svg: '',
  },
  {
    id: 'LOC-103',
    building: 'Science Block B',
    room: 'Lab 201',
    department: 'Physics Dept',
    type: 'Laboratory',
    qr_code_svg: '',
  },
  {
    id: 'LOC-104',
    building: 'Central Library',
    room: '2nd Floor Reading Room',
    department: 'Library Facilities',
    type: 'Study Space',
    qr_code_svg: '',
  },
  {
    id: 'LOC-105',
    building: 'Men’s Hostel Block 1',
    room: 'Room 114',
    department: 'Hostel Facilities',
    type: 'Residential',
    qr_code_svg: '',
  },
];

export const locationsApi = {
  getLocations: async () => {
    try {
      const res = await apiClient('/locations/', { method: 'GET' });
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (err) {
      console.warn('API getLocations fallback:', err);
    }
    return DEFAULT_LOCATIONS;
  },

  getLocation: async (id) => {
    try {
      const res = await apiClient(`/locations/${id}/`, { method: 'GET' });
      if (res && res.id) return res;
    } catch (err) {
      console.warn('API getLocation fallback:', err);
    }
    const found = DEFAULT_LOCATIONS.find((l) => l.id.toLowerCase() === String(id).toLowerCase());
    return found || DEFAULT_LOCATIONS[0];
  },

  createLocation: (data) =>
    apiClient('/locations/', {
      method: 'POST',
      body: data,
    }),

  updateLocation: (id, data) =>
    apiClient(`/locations/${id}/`, {
      method: 'PATCH',
      body: data,
    }),

  deleteLocation: (id) =>
    apiClient(`/locations/${id}/`, {
      method: 'DELETE',
    }),
};
