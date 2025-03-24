import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: "http://13.229.236.236:8000",
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    console.log(">>", err.response?.status);
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refreshToken") || "";

      if (!refreshToken) {
        return Promise.reject(err);
      }

      try {
        const res = await axios.get(
          "http://13.229.236.236:8000/api/v1/access_token_by_refresh_token",
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const newAccessToken = res.data?.access_token || "";
        Cookies.set("token", newAccessToken);
        // Gửi lại request cũ với token mới
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        if (refreshErr.response?.data.detail === "Token has expired") {
          document.location.href = "/signin";
        }

        console.log(refreshErr);

        Cookies.remove("token");
        Cookies.remove("user");
        Cookies.remove("refreshToken");
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
