import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp?: number;
}

export const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  sameSite: window.location.protocol === "https:" ? "None" : "Lax",
  secure: window.location.protocol === "https:",
};

// Biến toàn cục để inject hàm reset từ context
let resetTimerFn: (() => void) | null = null;

export const setAxiosInactivityHandler = (resetFn: () => void) => {
  resetTimerFn = resetFn;
};

function decodeToken(token: string): JWTPayload | null {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}

/** Refresh token còn dùng được để gọi API làm mới access token. */
function canAttemptTokenRefresh(): boolean {
  const refreshToken = Cookies.get("refreshToken");
  if (!refreshToken) return false;

  const decoded = decodeToken(refreshToken);
  // Token không phải JWT hoặc không có `exp` → vẫn thử refresh qua API.
  if (!decoded?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now;
}

function logoutAndRedirect() {
  Cookies.remove("token");
  Cookies.remove("refreshToken");
  Cookies.remove("user");
  localStorage.clear();
  document.location.href = "/signin";
}

const axiosInstance = axios.create({
  baseURL: "https://bookso.cgvtelecom.vn:8000/",
});

let isAlertShown = false;

// Request Interceptor (chỉ gắn access token)
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (resetTimerFn) resetTimerFn();
    return config;
  },
  (err) => Promise.reject(err),
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) return Promise.reject(err);

      if (!canAttemptTokenRefresh()) {
        if (!isAlertShown) {
          isAlertShown = true;
          alert("Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục!");
          logoutAndRedirect();
        }
        return Promise.reject(err);
      }

      try {
        const res = await axios.get(
          "https://bookso.cgvtelecom.vn:8000/api/v1/auth/access_token_by_refresh_token",
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          },
        );

        const newAccessToken = res.data?.access_token;
        if (!newAccessToken)
          throw new Error("Không nhận được access token mới");

        Cookies.set("token", newAccessToken, COOKIE_OPTIONS);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        const retryConfig = {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        };

        return axiosInstance(retryConfig);
      } catch (refreshErr) {
        console.log("Lỗi làm mới token:", refreshErr);

        if (!isAlertShown) {
          isAlertShown = true;
          logoutAndRedirect();
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  },
);

export default axiosInstance;
