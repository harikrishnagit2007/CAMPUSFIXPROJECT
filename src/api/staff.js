import { apiClient } from './client';

const DEFAULT_STAFF = [
  {
    id: 'STF-101',
    name: 'Rajesh Kumar',
    department: 'Electrical Maintenance',
    email: 'rajesh.maint@campusfix.edu',
    phone: '+91 98765 43210',
    role: 'Senior Electrician',
    status: 'Active',
  },
  {
    id: 'STF-102',
    name: 'Suresh Babu',
    department: 'Civil & Plumbing',
    email: 'suresh.plumb@campusfix.edu',
    phone: '+91 98765 43211',
    role: 'Plumbing Specialist',
    status: 'Active',
  },
  {
    id: 'STF-103',
    name: 'Anitha Ramesh',
    department: 'HVAC & Climate Control',
    email: 'anitha.hvac@campusfix.edu',
    phone: '+91 98765 43212',
    role: 'AC Technician',
    status: 'Active',
  },
  {
    id: 'STF-104',
    name: 'Karthik Subramanian',
    department: 'IT Infrastructure',
    email: 'karthik.it@campusfix.edu',
    phone: '+91 98765 43213',
    role: 'Network Administrator',
    status: 'Active',
  },
];

export const staffApi = {
  getStaff: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, v);
        }
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await apiClient(`/staff/${qs}`, { method: 'GET' });
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (err) {
      console.warn('API getStaff fallback:', err);
    }
    return DEFAULT_STAFF;
  },

  getStaffMember: async (id) => {
    try {
      const res = await apiClient(`/staff/${id}/`, { method: 'GET' });
      if (res && res.id) return res;
    } catch (err) {
      console.warn('API getStaffMember fallback:', err);
    }
    const found = DEFAULT_STAFF.find((s) => s.id.toLowerCase() === String(id).toLowerCase());
    return found || DEFAULT_STAFF[0];
  },

  createStaff: (data) =>
    apiClient('/staff/', {
      method: 'POST',
      body: data,
    }),

  updateStaff: (id, data) =>
    apiClient(`/staff/${id}/`, {
      method: 'PATCH',
      body: data,
    }),

  deleteStaff: (id) =>
    apiClient(`/staff/${id}/`, {
      method: 'DELETE',
    }),
};
