import axios from "axios";

// ─── Agency + client-view shared API instance ─────────────────────────────────
// Uses agency token when present; falls back to client token for /c/* routes.
const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("client_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Páginas públicas: um 401 aqui NÃO deve forçar redirect para /login
// (ex.: token velho expirado ao abrir a landing page "/"). Só limpamos o token
// e deixamos a página pública seguir normalmente.
const PUBLIC_PATHS = ["/", "/login", "/privacidade", "/oauth/callback"];
const onPublicPath = () => PUBLIC_PATHS.includes(window.location.pathname);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (localStorage.getItem("client_token")) {
        // Client session expired
        const slug = localStorage.getItem("client_slug") || "";
        localStorage.removeItem("client_token");
        localStorage.removeItem("client_slug");
        if (!onPublicPath()) window.location.href = `/c/${slug}/login`;
      } else {
        localStorage.removeItem("token");
        if (!onPublicPath()) window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ─── Dedicated client-auth API (always uses client_token, skips agency fallback)
export const clientApi = axios.create({ baseURL: "/api" });

clientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("client_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Agency endpoints ─────────────────────────────────────────────────────────
export const authApi = {
  login:    (data) => api.post("/auth/login",    data).then((r) => r.data),
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  me:       ()     => api.get("/auth/me").then((r) => r.data),
};

export const metricsApi = {
  overview:         (clientId)        => api.get("/metrics/overview",          { params: { clientId } }).then((r) => r.data),
  instagram:        (clientId)        => api.get("/metrics/instagram",         { params: { clientId } }).then((r) => r.data),
  linkedin:         (clientId)        => api.get("/metrics/linkedin",          { params: { clientId } }).then((r) => r.data),
  ga4:              (clientId)        => api.get("/metrics/ga4",               { params: { clientId } }).then((r) => r.data),
  aiInsights:       (clientId, force) => api.get("/metrics/ai-insights",       { params: { clientId, force: force || undefined } }).then((r) => r.data),
  categorizeThemes: (clientId)        => api.post("/metrics/categorize-themes",null, { params: { clientId } }).then((r) => r.data),
};

export const syncApi = {
  trigger: (clientId) => api.post(`/sync/${clientId}`).then((r) => r.data),
  status:  (clientId) => api.get(`/sync/${clientId}/status`).then((r) => r.data),
};

export const teamsApi = {
  list:          ()                 => api.get("/teams").then((r) => r.data),
  users:         ()                 => api.get("/teams/users/all").then((r) => r.data),
  get:           (id)               => api.get(`/teams/${id}`).then((r) => r.data),
  create:        (name)             => api.post("/teams", { name }).then((r) => r.data),
  update:        (id, name)         => api.patch(`/teams/${id}`, { name }).then((r) => r.data),
  remove:        (id)               => api.delete(`/teams/${id}`).then((r) => r.data),
  addMember:     (id, userId)       => api.post(`/teams/${id}/members`, { userId }).then((r) => r.data),
  removeMember:  (id, userId)       => api.delete(`/teams/${id}/members/${userId}`).then((r) => r.data),
  setClientTeam: (clientId, teamId) => api.put(`/teams/clients/${clientId}`, { teamId }).then((r) => r.data),
};

// ─── Client-user auth endpoints ───────────────────────────────────────────────
export const clientAuthApi = {
  login: (data) => api.post("/client-auth/login", data).then((r) => r.data),
  me:    ()     => clientApi.get("/client-auth/me").then((r) => r.data),
};

export default api;
