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
  overview: () => api.get("/metrics/overview").then((r) => r.data),
  instagram: () => api.get("/metrics/instagram").then((r) => r.data),
  linkedin: () => api.get("/metrics/linkedin").then((r) => r.data),
  ga4: () => api.get("/metrics/ga4").then((r) => r.data),
};

export default api;
