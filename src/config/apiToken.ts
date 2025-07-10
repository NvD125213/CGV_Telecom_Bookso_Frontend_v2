import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
}

// Biến toàn cục để inject hàm reset từ context
let resetTimerFn: (() => void) | null = null;

export const setAxiosInactivityHandler = (resetFn: () => void) => {
  resetTimerFn = resetFn;
};

// Hàm kiểm tra hạn của refresh token
function checkTokenExpirationAndHandle() {
  const refreshToken = Cookies.get("refreshToken");

  if (!refreshToken) return true;

  try {
    const decodedRefresh: JWTPayload = jwtDecode(String(refreshToken));
    const now = Math.floor(Date.now() / 1000);
    const refreshRemaining = decodedRefresh.exp - now;

    if (refreshRemaining <= 5 * 60) {
      console.warn(
        "Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục sử dụng !"
      );
      alert(
        "Phiên đăng nhập còn dưới 5 phút. Hãy logout và đăng nhập lại để đảm bảo trải nghiệm sử dụng tốt nhất !"
      );
      logoutAndRedirect();
      return false;
    }
    return true;
  } catch (err) {
    console.error("Lỗi khi decode refresh token:", err);
    logoutAndRedirect();
    return false;
  }
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
  baseURL: "https://bookso.cgvtelecom.vn:8000/",
});

let isAlertShown = false;

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = Cookies.get("token");

    // Kiểm tra token hết hạn
    const stillValid = checkTokenExpirationAndHandle();
    if (!stillValid) {
      throw new axios.Cancel("Refresh token hết hạn, hủy request");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (resetTimerFn) {
      resetTimerFn();
    }

    return config;
  },
  (err) => Promise.reject(err)
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

      Cookies.remove("token");

      try {
        const res = await axios.get(
          "https://bookso.cgvtelecom.vn:8000/api/v1/auth/access_token_by_refresh_token",
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const newAccessToken = res.data?.access_token;
        if (!newAccessToken)
          throw new Error("Không nhận được access token mới");

        Cookies.set("token", newAccessToken, {
          sameSite: "None",
          secure: true,
        });

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr: any) {
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
