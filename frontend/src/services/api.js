import axios from "axios";

// ─── Agency + client-view shared API instance ─────────────────────────────────
// Uses agency token when present; falls back to client token for /c/* routes.
const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("client_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (localStorage.getItem("client_token")) {
        // Client session expired
        const slug = localStorage.getItem("client_slug") || "";
        localStorage.removeItem("client_token");
        localStorage.removeItem("client_slug");
        window.location.href = `/c/${slug}/login`;
      } else {
        localStorage.removeItem("token");
        window.location.href = "/login";
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
  overview:  (clientId) => api.get("/metrics/overview",  { params: { clientId } }).then((r) => r.data),
  instagram: (clientId) => api.get("/metrics/instagram", { params: { clientId } }).then((r) => r.data),
  linkedin:  (clientId) => api.get("/metrics/linkedin",  { params: { clientId } }).then((r) => r.data),
  ga4:       (clientId) => api.get("/metrics/ga4",       { params: { clientId } }).then((r) => r.data),
};

export const syncApi = {
  trigger: (clientId) => api.post(`/sync/${clientId}`).then((r) => r.data),
  status:  (clientId) => api.get(`/sync/${clientId}/status`).then((r) => r.data),
};

// ─── Client-user auth endpoints ───────────────────────────────────────────────
export const clientAuthApi = {
  login: (data) => api.post("/client-auth/login", data).then((r) => r.data),
  me:    ()     => clientApi.get("/client-auth/me").then((r) => r.data),
};

export default api;
