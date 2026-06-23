import axiosInstance, { COOKIE_OPTIONS } from "../config/apiToken";
import Cookies from "js-cookie";

interface SignInValues {
  username: string;
  password: string;
  grant_type?: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

export const signIn = async (data: SignInValues) => {
  const formData = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) formData.append(key, value);
  });

  const res = await axiosInstance.post("/api/v1/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  if (res.status === 200) {
    const { access_token, refresh_token } = res.data;

    if (!access_token || !refresh_token) {
      throw new Error("Phản hồi đăng nhập thiếu access token hoặc refresh token");
    }

    Cookies.set("token", access_token, COOKIE_OPTIONS);
    Cookies.set("refreshToken", refresh_token, COOKIE_OPTIONS);
    return res;
  }
  return res;
};
