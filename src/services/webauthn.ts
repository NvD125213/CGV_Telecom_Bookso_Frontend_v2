import axios from "axios";
import Cookies from "js-cookie";
import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";

/**
 * Instance riêng cho các API 2FA.
 *
 * Không dùng chung axiosInstance ở config/apiToken vì interceptor ở đó tự động
 * refresh token khi gặp 401 — với 2FA thì 401 là kết quả hợp lệ (sai mật khẩu,
 * sai mã khôi phục, mfa_token hết hạn) và không được phép làm người dùng bị đăng xuất.
 */
export const twoFactorApi = axios.create({
  baseURL: "https://bookso.cgvtelecom.vn:8000/",
});

twoFactorApi.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const api = twoFactorApi;

export const TWO_FACTOR_BASE = "/api/v1/auth";
const BASE = TWO_FACTOR_BASE;

// ---------------------------------------------------------------------------
// Kiểu dữ liệu
// ---------------------------------------------------------------------------

export interface LoginResponse {
  mfa_required: boolean;
  access_token: string | null;
  refresh_token: string | null;
  token_type: string;
  mfa_token: string | null;
  /** "webauthn" | "recovery_code" | "email_otp" */
  mfa_methods: string[];
  /** Chỉ có khi phương thức là email_otp */
  masked_email: string | null;
}

export interface WebAuthnCredential {
  id: number;
  device_name: string;
  credential_id: string;
  transports: string[];
  is_backed_up: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  credential_count: number;
  recovery_codes_remaining: number;
  credentials: WebAuthnCredential[];
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegistrationResult {
  verified: boolean;
  credential: WebAuthnCredential;
  two_factor_enabled: boolean;
  recovery_codes: string[] | null;
}

// ---------------------------------------------------------------------------
// Hỗ trợ trình duyệt
// ---------------------------------------------------------------------------

export const isWebAuthnSupported = () => browserSupportsWebAuthn();
export const hasPlatformAuthenticator = () => platformAuthenticatorIsAvailable();

/**
 * Chuyển lỗi từ trình duyệt / backend thành thông báo tiếng Việt dễ hiểu.
 * Trả về null khi người dùng chủ động huỷ (không nên hiện như lỗi hệ thống).
 */
export function describeWebAuthnError(err: any): string | null {
  // Lỗi từ trình duyệt (DOMException)
  switch (err?.name) {
    case "NotAllowedError":
      return null; // người dùng bấm huỷ hoặc hết thời gian chờ
    case "AbortError":
      return null;
    case "InvalidStateError":
      return "Thiết bị này đã được đăng ký trước đó.";
    case "NotSupportedError":
      return "Trình duyệt hoặc thiết bị không hỗ trợ phương thức xác thực này.";
    case "SecurityError":
      return "Lỗi bảo mật: trang web phải chạy trên HTTPS đúng tên miền.";
  }

  // Lỗi từ backend
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;

  if (err?.response?.status === 401) {
    return "Phiên xác thực đã hết hạn, vui lòng đăng nhập lại.";
  }

  return "Xác thực thất bại, vui lòng thử lại.";
}

// ---------------------------------------------------------------------------
// Đăng nhập bước 2 (dùng mfa_token, chưa có access_token)
// ---------------------------------------------------------------------------

/** Xác thực bằng passkey và nhận về cặp token. */
export async function authenticateWithPasskey(mfaToken: string): Promise<TokenPair> {
  const { data: optionsJSON } = await api.post(
    `${BASE}/webauthn/authenticate/options`,
    { mfa_token: mfaToken },
  );

  const credential = await startAuthentication({ optionsJSON });

  const { data } = await api.post<TokenPair>(`${BASE}/webauthn/authenticate/verify`, {
    mfa_token: mfaToken,
    credential,
  });
  return data;
}

/** Đăng nhập bằng mã khôi phục khi mất thiết bị. */
export async function authenticateWithRecoveryCode(
  mfaToken: string,
  code: string,
): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>(`${BASE}/2fa/recovery-code/verify`, {
    mfa_token: mfaToken,
    code,
  });
  return data;
}

// ---------------------------------------------------------------------------
// Quản lý 2FA (cần access_token)
// ---------------------------------------------------------------------------

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const { data } = await api.get<TwoFactorStatus>(`${BASE}/2fa/status`);
  return data;
}

/** Đăng ký một passkey mới cho tài khoản đang đăng nhập. */
export async function registerPasskey(deviceName?: string): Promise<RegistrationResult> {
  const { data: optionsJSON } = await api.post(`${BASE}/webauthn/register/options`, {});

  const credential = await startRegistration({ optionsJSON });

  const { data } = await api.post<RegistrationResult>(`${BASE}/webauthn/register/verify`, {
    credential,
    device_name: deviceName?.trim() || undefined,
  });
  return data;
}

export async function renameCredential(
  id: number,
  deviceName: string,
): Promise<WebAuthnCredential> {
  const { data } = await api.patch<WebAuthnCredential>(
    `${BASE}/webauthn/credentials/${id}`,
    { device_name: deviceName },
  );
  return data;
}

export async function deleteCredential(id: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`${BASE}/webauthn/credentials/${id}`);
  return data;
}

export async function disableTwoFactor(password: string): Promise<{ message: string }> {
  const { data } = await api.post(`${BASE}/2fa/disable`, { password });
  return data;
}

export async function regenerateRecoveryCodes(password: string): Promise<string[]> {
  const { data } = await api.post<{ recovery_codes: string[] }>(
    `${BASE}/2fa/recovery-codes/regenerate`,
    { password },
  );
  return data.recovery_codes;
}
