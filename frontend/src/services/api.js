import axios from "axios";

const api = axios.create({
  baseURL: "/api"
});

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
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

export default api;
