import axiosInstance, { COOKIE_OPTIONS } from "../config/apiToken";
import Cookies from "js-cookie";
import type { LoginResponse } from "./webauthn";

interface SignInValues {
  username: string;
  password: string;
  grant_type?: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

/** Lưu cặp token vào cookie sau khi đăng nhập thành công. */
export const saveTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set("token", accessToken, COOKIE_OPTIONS);
  Cookies.set("refreshToken", refreshToken, COOKIE_OPTIONS);
};

export const signIn = async (data: SignInValues) => {
  const formData = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) formData.append(key, value);
  });

  const res = await axiosInstance.post<LoginResponse>("/api/v1/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (res.status === 200) {
    const { mfa_required, access_token, refresh_token } = res.data;

    // Tài khoản đã bật 2FA: chưa được cấp token, phải qua bước xác thực passkey.
    // Không lưu gì vào cookie ở bước này.
    if (mfa_required) {
      return res;
    }

    if (!access_token || !refresh_token) {
      throw new Error("Phản hồi đăng nhập thiếu access token hoặc refresh token");
    }

    saveTokens(access_token, refresh_token);
  }

  return res;
};
