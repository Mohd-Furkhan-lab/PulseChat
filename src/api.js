const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const WS_URL = API_URL.replace(/^http/, "ws") + "/ws/connect";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.message || "Request failed");
  return data;
}

export const api = {
  signUp: (email, password) => request("/users/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email, password) => request("/users/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/users/me"),
  refresh: () => request("/users/refresh", { method: "POST" }),
  logout: () => request("/users/logout", { method: "POST" }),
  contacts: () => request("/chat/contacts"),
  messages: (username) => request(`/chat/${encodeURIComponent(username)}`),
  sendMessage: (to, msg) => request("/chat/send-msg", { method: "POST", body: JSON.stringify({ to, msg }) }),
  clearChat: (username) => request(`/chat/clear-chat/${encodeURIComponent(username)}`, { method: "DELETE" }),
};
