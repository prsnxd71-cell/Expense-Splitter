// Ensure API_BASE is a valid HTTP/HTTPS URL; fallback to default backend URL if misconfigured
let configuredBase = import.meta.env.VITE_API_BASE_URL;
if (!configuredBase || (!configuredBase.startsWith('http://') && !configuredBase.startsWith('https://') && !configuredBase.startsWith('/'))) {
  configuredBase = 'http://localhost:5000/api';
}
const API_BASE = configuredBase.replace(/\/+$/, '');

/**
 * Common fetch wrapper handling JSON parsing, Authorization headers, and friendly error messages
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (err) {
    // If backend server is down or unreachable
    console.error('Fetch error:', err);
    throw new Error(
      `Cannot connect to backend server (${API_BASE}). Please ensure the backend is running (cd backend && npm start).`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth endpoints (Minimoth OTP)
  sendOtp: (phone) =>
    request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    }),

  verifyOtp: (phone, code, name) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name })
    }),

  // Groups & Expenses endpoints
  getGroups: () => request('/groups'),

  createGroup: (name, members) =>
    request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, members })
    }),

  addExpense: (groupId, expenseData) =>
    request(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData)
    })
};
