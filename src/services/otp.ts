/**
 * 2FA bằng mã OTP gửi qua email — dùng cho tài khoản CHƯA đăng ký passkey.
 *
 * Email nhận mã do backend tự lấy từ hồ sơ người dùng, frontend không gửi lên
 * và cũng không được phép chọn.
 */
import { twoFactorApi as api, TWO_FACTOR_BASE as BASE, type TokenPair } from "./webauthn";

export interface OtpSendResult {
  challenge_id: string;
  /** Số giây mã còn hiệu lực */
  expires_in: number;
  masked_email: string;
}

/** Yêu cầu gửi mã OTP. Gọi lại chính hàm này để "gửi lại mã". */
export async function sendOtp(mfaToken: string): Promise<OtpSendResult> {
  const { data } = await api.post<OtpSendResult>(`${BASE}/2fa/otp/send`, {
    mfa_token: mfaToken,
  });
  return data;
}

export async function verifyOtp(
  mfaToken: string,
  challengeId: string,
  code: string,
): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>(`${BASE}/2fa/otp/verify`, {
    mfa_token: mfaToken,
    challenge_id: challengeId,
    code,
  });
  return data;
}

/** Lấy thông báo lỗi tiếng Việt do backend trả về. */
export function describeOtpError(err: any, fallback: string): string {
  const detail = err?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

/**
 * Số giây phải chờ trước khi được gửi lại mã.
 * Backend trả kèm header Retry-After khi billing báo cooldown.
 */
export function retryAfterSeconds(err: any): number | null {
  const header = err?.response?.headers?.["retry-after"];
  const parsed = Number(header);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
