import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { MdFingerprint, MdKey, MdMailOutline, MdBolt } from "react-icons/md";

import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { completeLogin } from "../../store/authSlice";
import {
  authenticateWithPasskey,
  authenticateWithRecoveryCode,
  describeWebAuthnError,
  isWebAuthnSupported,
  type TokenPair,
} from "../../services/webauthn";
import {
  describeOtpError,
  retryAfterSeconds,
  sendOtp,
  verifyOtp,
} from "../../services/otp";

interface LocationState {
  mfaToken?: string;
  mfaMethods?: string[];
  maskedEmail?: string | null;
}

/** mfa_token sống 5 phút, đếm ngược để người dùng biết mà thao tác kịp. */
const MFA_TOKEN_TTL_SECONDS = 5 * 60;
/** Billing chặn gửi lại trong vòng 60 giây cho cùng một email. */
const RESEND_COOLDOWN_SECONDS = 60;

export default function TwoFactorForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const mfaToken = state.mfaToken;
  const methods = state.mfaMethods || [];
  const canUseRecoveryCode = methods.includes("recovery_code");
  const usesOtp = methods.includes("email_otp");

  const [mode, setMode] = useState<"passkey" | "recovery" | "otp">(
    usesOtp ? "otp" : "passkey",
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(MFA_TOKEN_TTL_SECONDS);

  // --- trạng thái riêng của luồng OTP ---
  const [otpCode, setOtpCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState(state.maskedEmail || "");
  const [isSending, setIsSending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const hasRequestedOtp = useRef(false);

  const supported = useMemo(() => isWebAuthnSupported(), []);
  const expired = secondsLeft <= 0;

  // Vào thẳng URL này mà không qua bước nhập mật khẩu thì không có mfa_token
  useEffect(() => {
    if (!mfaToken) navigate("/signin", { replace: true });
  }, [mfaToken, navigate]);

  useEffect(() => {
    if (!mfaToken) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [mfaToken]);

  // Đếm ngược thời gian được phép bấm "Gửi lại mã"
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const finishLogin = (tokens: TokenPair) => {
    dispatch(
      completeLogin({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      }),
    );
    navigate("/", { replace: true });
  };

  const requestOtp = async (isResend = false) => {
    if (!mfaToken || isSending) return;
    setIsSending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await sendOtp(mfaToken);
      setChallengeId(result.challenge_id);
      setMaskedEmail(result.masked_email);
      setResendIn(RESEND_COOLDOWN_SECONDS);
      if (isResend) setNotice("Đã gửi lại mã, vui lòng kiểm tra hộp thư.");
    } catch (err: any) {
      // 429 kèm Retry-After: khoá nút gửi lại đúng số giây billing yêu cầu
      const wait = retryAfterSeconds(err);
      if (wait) setResendIn(wait);
      setError(describeOtpError(err, "Không gửi được mã OTP, vui lòng thử lại sau."));
    } finally {
      setIsSending(false);
    }
  };

  // Tự gửi mã ngay khi vào màn hình để người dùng không phải bấm thêm một bước
  useEffect(() => {
    if (mode !== "otp" || !mfaToken || hasRequestedOtp.current) return;
    hasRequestedOtp.current = true;
    requestOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, mfaToken]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken || !challengeId || isVerifying || !otpCode.trim()) return;

    setIsVerifying(true);
    setError(null);
    setNotice(null);
    try {
      finishLogin(await verifyOtp(mfaToken, challengeId, otpCode.trim()));
    } catch (err: any) {
      setError(describeOtpError(err, "Mã OTP không đúng."));
      setOtpCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasskey = async () => {
    if (!mfaToken || isVerifying) return;
    setIsVerifying(true);
    setError(null);
    try {
      finishLogin(await authenticateWithPasskey(mfaToken));
    } catch (err: any) {
      // describeWebAuthnError trả null khi người dùng chủ động huỷ -> không báo lỗi đỏ
      setError(describeWebAuthnError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken || isVerifying || !recoveryCode.trim()) return;
    setIsVerifying(true);
    setError(null);
    try {
      finishLogin(await authenticateWithRecoveryCode(mfaToken, recoveryCode));
    } catch (err: any) {
      setError(describeWebAuthnError(err) || "Mã khôi phục không hợp lệ.");
    } finally {
      setIsVerifying(false);
    }
  };

  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  if (!mfaToken) return null;

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col flex-1 w-full max-w-lg mx-auto px-4 sm:px-2 lg:px-0 py-8">
        <div className="flex-1 flex items-center">
          <div className="w-full">
            <div className="mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md text-center">
                XÁC THỰC HAI LỚP
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {mode === "passkey" &&
                  "Xác nhận danh tính bằng thiết bị đã đăng ký để hoàn tất đăng nhập"}
                {mode === "recovery" &&
                  "Nhập một mã khôi phục bạn đã lưu khi bật xác thực hai lớp"}
                {mode === "otp" &&
                  "Nhập mã xác thực vừa được gửi tới email của bạn để hoàn tất đăng nhập"}
              </p>
            </div>

            {expired ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
                  Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => navigate("/signin", { replace: true })}>
                  Quay lại đăng nhập
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </div>
                )}

                {notice && (
                  <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-400">
                    {notice}
                  </div>
                )}

                {!supported && mode === "passkey" && (
                  <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
                    Trình duyệt này không hỗ trợ passkey. Hãy dùng mã khôi phục
                    hoặc mở bằng Chrome, Edge, Safari phiên bản mới.
                  </div>
                )}

                {mode === "otp" && (
                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                      <MdMailOutline
                        size={22}
                        className="shrink-0 text-brand-500 dark:text-brand-400"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isSending && !challengeId ? (
                          "Đang gửi mã tới email của bạn..."
                        ) : maskedEmail ? (
                          <>
                            Mã xác thực đã gửi tới{" "}
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {maskedEmail}
                            </span>
                          </>
                        ) : (
                          "Mã xác thực đã được gửi tới email của bạn"
                        )}
                      </p>
                    </div>

                    <div>
                      <Label>
                        Mã xác thực <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        name="otp_code"
                        type="text"
                        placeholder="Nhập 6 chữ số"
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="text-center text-lg tracking-[0.5em]"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="sm"
                      disabled={isVerifying || !challengeId || otpCode.length < 4}>
                      {isVerifying ? "Đang kiểm tra..." : "Xác nhận"}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => requestOtp(true)}
                        disabled={isSending || resendIn > 0}
                        className="text-sm text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400 dark:disabled:text-gray-500">
                        {resendIn > 0
                          ? `Gửi lại mã sau ${resendIn}s`
                          : isSending
                            ? "Đang gửi..."
                            : "Không nhận được mã? Gửi lại"}
                      </button>
                    </div>

                    {/* Gợi ý chuyển sang passkey cho lần đăng nhập sau */}
                    {supported && (
                      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/40 dark:bg-blue-500/10">
                        <MdBolt
                          size={20}
                          className="shrink-0 text-blue-600 dark:text-blue-400"
                        />
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          <span className="font-medium">Đăng nhập nhanh hơn:</span> bật
                          xác thực bằng passkey trong mục{" "}
                          <span className="font-medium">Bảo mật tài khoản</span> để lần
                          sau chỉ cần vân tay hoặc khuôn mặt, không phải chờ email.
                        </p>
                      </div>
                    )}
                  </form>
                )}

                {mode === "passkey" && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 py-8 dark:border-gray-800 dark:bg-white/[0.03]">
                      <MdFingerprint
                        size={56}
                        className="text-brand-500 dark:text-brand-400"
                      />
                      <p className="px-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Trình duyệt sẽ yêu cầu vân tay, khuôn mặt hoặc mã PIN của
                        thiết bị.
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      size="sm"
                      onClick={handlePasskey}
                      disabled={isVerifying || !supported}>
                      {isVerifying ? "Đang xác thực..." : "Xác thực bằng passkey"}
                    </Button>
                  </div>
                )}

                {mode === "recovery" && (
                  <form onSubmit={handleRecoveryCode} className="space-y-6">
                    <div>
                      <Label>
                        Mã khôi phục <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        name="recovery_code"
                        placeholder="VD: A3KM-9PQR-7XZT"
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value)}
                        className="tracking-widest uppercase"
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Mỗi mã chỉ dùng được một lần.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="sm"
                      disabled={isVerifying || !recoveryCode.trim()}>
                      {isVerifying ? "Đang kiểm tra..." : "Xác nhận"}
                    </Button>
                  </form>
                )}

                <div className="mt-6 flex flex-col items-center gap-3">
                  {canUseRecoveryCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMode(mode === "passkey" ? "recovery" : "passkey");
                      }}
                      className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                      {mode === "passkey" ? (
                        <>
                          <MdKey size={18} /> Dùng mã khôi phục
                        </>
                      ) : (
                        <>
                          <MdFingerprint size={18} /> Quay lại dùng passkey
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Phiên xác thực còn hiệu lực trong{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {mmss}
                    </span>
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/signin", { replace: true })}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    Huỷ và đăng nhập lại
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 pt-4 text-xs text-center text-gray-500 border-t border-gray-200 dark:text-gray-400 dark:border-gray-800">
          Designed by CGV Telecom Development Team
        </div>
      </div>
    </div>
  );
}
