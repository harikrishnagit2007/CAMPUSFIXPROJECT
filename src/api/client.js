/**
 * CampusFix API Client
 * Centralized fetch client handling Authorization tokens, headers, and error formatting.
 */

// Base API URL supports Java Spring Boot backend via environment variable (e.g. http://localhost:8080/api) or default proxy
const rawBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_JAVA_API_BASE_URL)
  ? import.meta.env.VITE_JAVA_API_BASE_URL
  : '/api';
const BASE_URL = rawBase.replace(/\/+$/, '');

export async function apiClient(endpoint, { body, silentError = false, ...customConfig } = {}) {
  const token = localStorage.getItem('campusfix_token');
  const storedUserJson = localStorage.getItem('campusfix_user');
  let storedUser = null;
  try {
    if (storedUserJson) storedUser = JSON.parse(storedUserJson);
  } catch (e) {}

  const headers = {
    ...customConfig.headers,
  };

  // If body is FormData (file upload), let browser set Content-Type with boundary
  if (!(body instanceof FormData) && customConfig.method && customConfig.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  if (storedUser) {
    if (storedUser.role) headers['X-User-Role'] = storedUser.role;
    if (storedUser.name) headers['X-User-Name'] = storedUser.name;
    if (storedUser.email) headers['X-User-Email'] = storedUser.email;
    if (storedUser.id || storedUser.uid) headers['X-User-Id'] = String(storedUser.id || storedUser.uid);
  }

  const config = {
    ...customConfig,
    headers,
  };

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${BASE_URL}/${cleanEndpoint}`;

  if (!silentError) {
    console.log(`[API Request] ${customConfig.method || 'GET'} /${cleanEndpoint}`);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    if (!silentError) {
      console.error(`[API Network Error] Request to /${cleanEndpoint} failed:`, err);
    }
    throw new Error('Network connection failure. Please check if the backend server is running.');
  }

  // Parse JSON or text on failure
  let data = null;
  let textBody = '';
  try {
    textBody = await response.text();
    data = JSON.parse(textBody);
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorDetails = {
      status: response.status,
      statusText: response.statusText,
      data: data,
      rawBody: textBody ? textBody.slice(0, 300) : null,
    };

    if (silentError) {
      console.warn(`[API Response Notice] Status ${response.status} for /${cleanEndpoint}`);
    } else {
      console.error(`[API Error Response] Status ${response.status} (${response.statusText || 'HTTP Error'}) for /${cleanEndpoint}:`, errorDetails);
    }

    // Extract meaningful error messages
    let errorMsg = `Server Error (${response.status})`;
    if (data) {
      if (typeof data === 'string') {
        errorMsg = data;
      } else if (data.error) {
        errorMsg = data.error;
      } else if (data.detail) {
        errorMsg = data.detail;
      } else if (data.message) {
        errorMsg = data.message;
      } else {
        // Collect field validation errors
        const messages = [];
        for (const [key, value] of Object.entries(data)) {
          const valStr = Array.isArray(value) ? value.join(' ') : String(value);
          messages.push(`${key}: ${valStr}`);
        }
        if (messages.length) errorMsg = messages.join(' | ');
      }
    } else if (textBody && textBody.trim()) {
      if (textBody.includes('<html') || textBody.includes('<!DOCTYPE') || textBody.includes('<head>')) {
        // Extract title if available from HTML
        const titleMatch = textBody.match(/<title>(.*?)<\/title>/i);
        const titleText = titleMatch ? titleMatch[1].trim() : `HTTP ${response.status} Server Error`;
        errorMsg = `Server Error (${response.status}): ${titleText}. Please verify the Spring Boot backend server state.`;
      } else {
        errorMsg = textBody.length > 200 ? textBody.slice(0, 200) + '...' : textBody;
      }
    } else {
      errorMsg = `Server returned status ${response.status} (${response.statusText || 'Error'})`;
    }

    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
