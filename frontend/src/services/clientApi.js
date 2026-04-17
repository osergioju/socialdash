import api from "./api";

export const clientApi = {
  list:   ()           => api.get("/clients").then(r => r.data),
  get:    (id)         => api.get(`/clients/${id}`).then(r => r.data),
  create: (data)       => api.post("/clients", data).then(r => r.data),
  update: (id, data)   => api.patch(`/clients/${id}`, data).then(r => r.data),
  remove: (id)         => api.delete(`/clients/${id}`),
};

export const oauthApi = {
  // Returns { url } — frontend opens url in current window
  getConnectUrl: (platform, clientId) =>
    api.get(`/oauth/${platform}/connect`, { params: { clientId } }).then(r => r.data.url),
  revoke: (platform, clientId) =>
    api.delete(`/oauth/${platform}/revoke`, { params: { clientId } }).then(r => r.data),

  // Multi-tenant: seleção de página Meta
  listMetaPages: (clientId) =>
    api.get("/oauth/meta/pages", { params: { clientId } }).then(r => r.data.pages),
  selectMetaPage: (clientId, pageId) =>
    api.post("/oauth/meta/select-page", { clientId, pageId }).then(r => r.data),
};
