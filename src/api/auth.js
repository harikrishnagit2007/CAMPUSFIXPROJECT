import { apiClient } from './client';

export const authApi = {
  login: (email, password, role) =>
    apiClient('/auth/login/', {
      method: 'POST',
      body: { email, password, role },
    }),

  register: (userData) =>
    apiClient('/auth/register/', {
      method: 'POST',
      body: userData,
    }),

  logout: () =>
    apiClient('/auth/logout/', {
      method: 'POST',
    }),

  getCurrentUser: (options = {}) =>
    apiClient('/auth/me/', {
      method: 'GET',
      silentError: true,
      ...options,
    }),

  forgotPassword: (email) =>
    apiClient('/auth/forgot-password/', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (email, token, newPassword) =>
    apiClient('/auth/reset-password/', {
      method: 'POST',
      body: { email, token, newPassword },
    }),

  googleLogin: (payload, options = {}) =>
    apiClient('/auth/google/', {
      method: 'POST',
      body: payload,
      silentError: true,
      ...options,
    }),
};
