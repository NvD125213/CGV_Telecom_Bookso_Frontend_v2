import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { signIn, saveTokens } from "../services/auth";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { COOKIE_OPTIONS } from "../config/apiToken";
import { DEV_ACCESS_TOKEN, IS_DEV_MODE } from "../config/env";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  isLoading: boolean;
  error: string | null;
}

/** Dev mode: inject VITE_TOKEN_ACCESS, bỏ bước đăng nhập. */
function buildInitialAuthState(): AuthState {
  if (IS_DEV_MODE && DEV_ACCESS_TOKEN) {
    let user: any = null;
    try {
      user = jwtDecode(DEV_ACCESS_TOKEN);
      Cookies.set("token", DEV_ACCESS_TOKEN, COOKIE_OPTIONS);
      Cookies.set("user", JSON.stringify(user), COOKIE_OPTIONS);
    } catch (err) {
      console.error("[DEV] Không decode được VITE_TOKEN_ACCESS:", err);
    }

    return {
      token: DEV_ACCESS_TOKEN,
      refreshToken: null,
      user,
      isLoading: false,
      error: null,
    };
  }

  return {
    token: Cookies.get("token") || null,
    refreshToken: Cookies.get("refreshToken") || null,
    user: Cookies.get("user") ? JSON.parse(Cookies.get("user")!) : null,
    isLoading: false,
    error: null,
  };
}

const initialState: AuthState = buildInitialAuthState();

/** Kết quả login: hoặc vào thẳng hệ thống, hoặc phải qua bước 2FA. */
export type LoginResult =
  | {
      mfaRequired: true;
      mfaToken: string;
      mfaMethods: string[];
      maskedEmail: string | null;
    }
  | { mfaRequired: false; token: string; refreshToken?: string; user: any };

// Thunk để thực hiện login
export const login = createAsyncThunk<
  LoginResult,
  { username: string; password: string },
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const res = await signIn({
      ...credentials,
      grant_type: "password",
      client_id: "",
      client_secret: "",
    });

    // Cần xác thực lớp hai (passkey hoặc OTP email): trả mfa_token cho màn hình xác thực
    if (res.data?.mfa_required) {
      return {
        mfaRequired: true,
        mfaToken: res.data.mfa_token as string,
        mfaMethods: res.data.mfa_methods || [],
        maskedEmail: res.data.masked_email ?? null,
      };
    }

    const token = Cookies.get("token");
    const refreshToken = Cookies.get("refreshToken");

    if (token) {
      const decoded = jwtDecode(token);
      Cookies.set("user", JSON.stringify(decoded), COOKIE_OPTIONS);
      return { mfaRequired: false, token, refreshToken, user: decoded };
    }
    throw new Error("Token is not available");
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || "Login failed");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // Dev mode: giữ token env, không clear / không đá về login
      if (IS_DEV_MODE && DEV_ACCESS_TOKEN) {
        state.token = DEV_ACCESS_TOKEN;
        try {
          state.user = jwtDecode(DEV_ACCESS_TOKEN);
        } catch {
          state.user = null;
        }
        state.refreshToken = null;
        return;
      }

      state.token = null;
      state.user = null;
      state.refreshToken = null;
      Cookies.remove("token");
      Cookies.remove("user");
      Cookies.remove("refreshToken");
    },
    /** Hoàn tất đăng nhập sau khi xác thực 2FA thành công. */
    completeLogin: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) => {
      const { accessToken, refreshToken } = action.payload;
      saveTokens(accessToken, refreshToken);

      const decoded = jwtDecode(accessToken);
      Cookies.set("user", JSON.stringify(decoded), COOKIE_OPTIONS);

      state.token = accessToken;
      state.refreshToken = refreshToken;
      state.user = decoded;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;

        // Chưa xong: còn phải qua bước 2FA nên không set token
        if (action.payload.mfaRequired) return;

        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || "";
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, completeLogin } = authSlice.actions;
export default authSlice.reducer;
