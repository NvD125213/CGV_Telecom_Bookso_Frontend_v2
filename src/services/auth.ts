import axiosInstance from "../config/apiToken";
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
    Cookies.set("token", access_token);
    Cookies.set("refreshToken", refresh_token);
    return res;
  }
  return res;
};
