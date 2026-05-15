import axios from "axios";

const normalizeEnvApiUrl = (value?: string) => {
  if (!value) return "";
  let normalized = value.trim();

  // Handle accidental full "KEY=value" paste in env value field.
  if (normalized.startsWith("VITE_API_URL=")) {
    normalized = normalized.slice("VITE_API_URL=".length).trim();
  }

  // Handle accidental single slash protocol: https:/example.com
  normalized = normalized.replace(/^https:\//i, "https://");
  normalized = normalized.replace(/^http:\//i, "http://");

  return normalized;
};

const rawApiUrl = normalizeEnvApiUrl(import.meta.env.VITE_API_URL);
const fallbackApiUrl = "http://localhost:3000/api";
const normalizedBaseUrl = (rawApiUrl || fallbackApiUrl).replace(/\/+$/, "");

const api = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("loggedInUser");
    }

    return Promise.reject(error);
  },
);

export default api;
