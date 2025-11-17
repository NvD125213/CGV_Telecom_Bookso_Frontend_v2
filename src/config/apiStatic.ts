import axios from "axios";

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

export const instanceStatic = axios.create({
  baseURL: "http://103.216.124.164:8000/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động add token vào header
instanceStatic.interceptors.request.use((config) => {
  const token = getTokenFromCookie();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
