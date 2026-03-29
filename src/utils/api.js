const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, isFormData = false } = options;

  const headers = { ...getAuthHeaders() };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config = { method, headers };
  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth
export const login = (email, password) => apiRequest('/auth/login', { method: 'POST', body: { email, password } });
export const signup = (name, email, password) => apiRequest('/auth/signup', { method: 'POST', body: { name, email, password } });
export const getMe = () => apiRequest('/auth/me');

// Complaints
export const getComplaints = (params = '') => apiRequest(`/complaints${params ? '?' + params : ''}`);
export const getComplaint = (id) => apiRequest(`/complaints/${id}`);
export const getComplaintStats = () => apiRequest('/complaints/stats');
export const submitComplaint = (formData) => apiRequest('/complaints', { method: 'POST', body: formData, isFormData: true });
export const updateComplaintStatus = (id, status, remarks) => apiRequest(`/complaints/${id}/status`, { method: 'PATCH', body: { status, remarks } });
export const reassignComplaint = (id, assigned_to) => apiRequest(`/complaints/${id}/assign`, { method: 'PATCH', body: { assigned_to } });

// Users
export const getSubAdmins = () => apiRequest('/users/sub-admins');

// Auth helpers
export function saveAuth(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isAuthenticated() {
  return !!getToken();
}
