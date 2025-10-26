import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

interface JWTPayload {
  exp: number;
}

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

// Hàm check refresh token còn hạn > 5 phút
function isRefreshTokenStillValid(): boolean {
  const refreshToken = Cookies.get("refreshToken");
  if (!refreshToken) return false;

  const decoded = decodeToken(refreshToken);
  if (!decoded) return false;

  const now = Math.floor(Date.now() / 1000);
  const refreshRemaining = decoded.exp - now;

  return refreshRemaining > 5 * 60;
}

// Hàm logout và redirect
function logoutAndRedirect() {
  Cookies.remove("token");
  Cookies.remove("refreshToken");
  Cookies.remove("user");
  localStorage.clear();
  document.location.href = "/signin";
}
const axiosInstance = axios.create({
  // baseURL: "https://bookso.cgvtelecom.vn:8000/",
  baseURL: "https://bookso.cgvtelecom.vn:8000/",
});

let isAlertShown = false;

// ✅ Request Interceptor (chỉ gắn access token)
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (resetTimerFn) resetTimerFn();
    return config;
  },
  (err) => Promise.reject(err)
);

// ✅ Response Interceptor
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) return Promise.reject(err);

      // Check refresh token còn hạn không
      if (!isRefreshTokenStillValid()) {
        toast("Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục!", {
          icon: "⚠️",
          style: { background: "#fef3c7", color: "#92400e" },
        });
        logoutAndRedirect();
        return Promise.reject(err);
      }
      try {
        const res = await axios.get(
          "https://bookso.cgvtelecom.vn:8000/api/v1/auth/access_token_by_refresh_token",
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );

        const newAccessToken = res.data?.access_token;
        if (!newAccessToken)
          throw new Error("Không nhận được access token mới");

        Cookies.set("token", newAccessToken, {
          sameSite: "None",
          secure: true,
        });

        // Đợi 1 giây trước khi retry request với token mới
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Cập nhật token vào header trước khi retry
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Tạo lại request config với token mới
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
  }
);

export default axiosInstance;
