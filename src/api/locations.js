import { apiClient } from './client';

export const locationsApi = {
  getLocations: () => apiClient('/locations/', { method: 'GET' }),

  getLocation: (id) => apiClient(`/locations/${id}/`, { method: 'GET' }),

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
