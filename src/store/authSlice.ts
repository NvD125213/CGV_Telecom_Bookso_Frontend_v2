import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { signIn } from "../services/auth";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: Cookies.get("token") || null,
  refreshToken: Cookies.get("refreshToken") || null,
  user: Cookies.get("user") ? JSON.parse(Cookies.get("user")!) : null,
  isLoading: false,
  error: null,
};

// Thunk để thực hiện login
export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      await signIn({
        ...credentials,
        grant_type: "password",
        client_id: "",
        client_secret: "",
      });

      // Lấy token từ Cookies
      const token = Cookies.get("token");
      const refreshToken = Cookies.get("refreshToken");

      if (token) {
        const decoded = jwtDecode(token);
        Cookies.set("user", JSON.stringify(decoded));

        return { token, refreshToken, user: decoded };
      } else {
        throw new Error("Token is not available");
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Login failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.refreshToken = null;
      Cookies.remove("token");
      Cookies.remove("user");
      Cookies.remove("refreshToken");
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
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || "";
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
