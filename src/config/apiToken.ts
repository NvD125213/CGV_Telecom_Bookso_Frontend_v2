import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: "http://13.228.23.40:8000/",
});

let isAlertShown = false;

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = ` Bearer ${token} `;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        return Promise.reject(err);
      }

      // Xóa token cũ ngay lập tức
      Cookies.remove("token");

      try {
        const res = await axios.get(
          "http://13.228.23.40:8000/api/v1/auth/access_token_by_refresh_token",
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const newAccessToken = res.data?.access_token;
        if (!newAccessToken) {
          throw new Error("Không nhận được access token mới");
        }

        // Lưu token mới
        Cookies.set("token", newAccessToken, {
          sameSite: "None",
          secure: true,
        });
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr: any) {
        console.log("Lỗi ở đây >>", refreshErr);

        if (!isAlertShown) {
          isAlertShown = true;
          if (refreshErr.status === 401) {
            alert("Phiên đăng nhập đã hết hạn");
          } else if (refreshErr.status === 403) {
            alert("Yêu cầu bị từ chối!");
          }

          document.location.href = "/signin";
          Cookies.remove("refreshToken");
          Cookies.remove("user");
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
