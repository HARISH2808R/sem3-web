import axios from "axios";

export const api = axios.create({ baseURL: "http://localhost:5000/api" });

api.interceptors.request.use(config => {
  const token = localStorage.getItem("hospital_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("hospital_token");
      localStorage.removeItem("hospital_patient");
      window.dispatchEvent(new Event("hospital-unauthorized"));
    }
    return Promise.reject(error);
  }
);

export function cachedGet(key, request) {
  const cached = localStorage.getItem(key);
  if (cached) {
    try { return Promise.resolve({ data: JSON.parse(cached), fromCache: true }); }
    catch { localStorage.removeItem(key); }
  }
  return request().then(response => {
    localStorage.setItem(key, JSON.stringify(response.data));
    return response;
  });
}
