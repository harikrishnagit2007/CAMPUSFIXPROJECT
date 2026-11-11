import { apiClient } from './client';

export const staffApi = {
  getStaff: async (params = {}) => {
    try {
      const q = new URLSearchParams();
      if (params.department) q.append('department', params.department);
      if (params.status || params.availability) q.append('availability', params.status || params.availability);
      const queryString = q.toString() ? `?${q.toString()}` : '';
      return await apiClient(`/staff${queryString}`, { method: 'GET' });
    } catch (error) {
      console.error('[staffApi] getStaff error:', error);
      return [];
    }
  },

  getStaffMember: async (id) => {
    try {
      return await apiClient(`/staff/${id}`, { method: 'GET' });
    } catch (error) {
      console.error(`[staffApi] getStaffMember error for id ${id}:`, error);
      return null;
    }
  },

  createStaff: async (data) => {
    return await apiClient('/staff', {
      method: 'POST',
      body: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        specialization: data.specialization || '',
        availability: data.availability || 'Available',
        active: data.active !== undefined ? data.active : true,
      },
    });
  },

  updateStaff: async (id, data) => {
    return await apiClient(`/staff/${id}`, {
      method: 'PUT',
      body: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        specialization: data.specialization || '',
        availability: data.availability || 'Available',
        active: data.active !== undefined ? data.active : true,
      },
    });
  },

  deleteStaff: async (id) => {
    return await apiClient(`/staff/${id}`, {
      method: 'DELETE',
    });
  },
};
