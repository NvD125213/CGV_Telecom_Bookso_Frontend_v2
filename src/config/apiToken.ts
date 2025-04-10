import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: "http://13.229.236.236:8000",
});

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
          "https://bookso.cgvtelecom.vn:8000/api/v1/access_token_by_refresh_token",
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
        Cookies.remove("refreshToken");
        Cookies.remove("user");
        if (refreshErr.response?.data?.detail === "Token has expired") {
          document.location.href = "/signin";
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
