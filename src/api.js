const API_BASE = import.meta.env.VITE_API_URL;
export const WS_BASE = import.meta.env.VITE_WS_URL;

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const finalOptions = { ...defaultOptions, ...options };
  if (options.headers) {
    finalOptions.headers = { ...defaultOptions.headers, ...options.headers };
  }

  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorMsg = data.detail || data.message || `Request failed (${response.status})`;
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  me: () => apiRequest('/users/me'),
  login: (email, password) => apiRequest('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (email, password) => apiRequest('/users/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => apiRequest('/users/logout', { method: 'POST' }),
  refresh: () => apiRequest('/users/refresh', { method: 'POST' }),
  contacts: () => apiRequest('/chat/contacts'),
  messages: (username) => apiRequest(`/chat/${encodeURIComponent(username)}`),
  addContact: (username) => apiRequest(`/chat/${encodeURIComponent(username)}`, { method: 'POST' }),
  sendMessage: (to, msg) => apiRequest('/chat/send-msg', { method: 'POST', body: JSON.stringify({ to, msg }) }),
  clearChat: (username) => apiRequest(`/chat/clear-chat/${encodeURIComponent(username)}`, { method: 'DELETE' })
};
