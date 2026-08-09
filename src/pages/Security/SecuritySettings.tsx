import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  MdAddCircleOutline,
  MdCloudDone,
  MdDeleteOutline,
  MdDriveFileRenameOutline,
  MdFingerprint,
  MdKey,
  MdLockOutline,
  MdShield,
} from "react-icons/md";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import RecoveryCodesModal from "../../components/security/RecoveryCodesModal";
import PasswordConfirmModal from "../../components/security/PasswordConfirmModal";
import {
  deleteCredential,
  describeWebAuthnError,
  disableTwoFactor,
  getTwoFactorStatus,
  hasPlatformAuthenticator,
  isWebAuthnSupported,
  regenerateRecoveryCodes,
  registerPasskey,
  renameCredential,
  type TwoFactorStatus,
  type WebAuthnCredential,
} from "../../services/webauthn";

const formatDate = (value: string | null) => {
  if (!value) return "Chưa sử dụng";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SecuritySettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);

  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [passwordAction, setPasswordAction] = useState<"disable" | "regenerate" | null>(
    null,
  );

  const supported = isWebAuthnSupported();

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await getTwoFactorStatus());
    } catch {
      toast.error("Không tải được trạng thái bảo mật");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    hasPlatformAuthenticator().then(setHasBiometric).catch(() => setHasBiometric(false));
  }, [loadStatus]);

  const handleAddDevice = async () => {
    if (isRegistering) return;

    const { value: deviceName, isConfirmed } = await Swal.fire({
      title: "Đặt tên cho thiết bị",
      input: "text",
      inputPlaceholder: "VD: MacBook cơ quan, iPhone của tôi",
      inputAttributes: { maxlength: "255" },
      showCancelButton: true,
      confirmButtonText: "Tiếp tục",
      cancelButtonText: "Huỷ",
      confirmButtonColor: "#465fff",
      inputValidator: (v) => (!v?.trim() ? "Vui lòng nhập tên thiết bị" : undefined),
    });
    if (!isConfirmed) return;

    setIsRegistering(true);
    try {
      const result = await registerPasskey(deviceName);
      toast.success(`Đã đăng ký "${result.credential.device_name}"`);

      // Chỉ có ở lần đăng ký đầu tiên, khi 2FA vừa được bật
      if (result.recovery_codes) {
        setRecoveryCodes(result.recovery_codes);
      }
      await loadStatus();
    } catch (err: any) {
      const message = describeWebAuthnError(err);
      if (message) toast.error(message); // null = người dùng chủ động huỷ
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRename = async (cred: WebAuthnCredential) => {
    const { value, isConfirmed } = await Swal.fire({
      title: "Đổi tên thiết bị",
      input: "text",
      inputValue: cred.device_name,
      inputAttributes: { maxlength: "255" },
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Huỷ",
      confirmButtonColor: "#465fff",
      inputValidator: (v) => (!v?.trim() ? "Tên không được để trống" : undefined),
    });
    if (!isConfirmed || value === cred.device_name) return;

    try {
      await renameCredential(cred.id, value);
      toast.success("Đã đổi tên thiết bị");
      await loadStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Đổi tên thất bại");
    }
  };

  const handleDelete = async (cred: WebAuthnCredential) => {
    const isLastDevice = (status?.credential_count ?? 0) <= 1;

    const { isConfirmed } = await Swal.fire({
      title: "Gỡ thiết bị này?",
      html: isLastDevice
        ? `Đây là thiết bị cuối cùng. Gỡ xong, <b>xác thực hai lớp sẽ tự động tắt</b> và toàn bộ mã khôi phục bị xoá.`
        : `Thiết bị "<b>${cred.device_name}</b>" sẽ không dùng để đăng nhập được nữa.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Gỡ thiết bị",
      cancelButtonText: "Huỷ",
      confirmButtonColor: "#ef4444",
    });
    if (!isConfirmed) return;

    try {
      const result = await deleteCredential(cred.id);
      toast.success(result.message);
      await loadStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Gỡ thiết bị thất bại");
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    if (passwordAction === "disable") {
      const result = await disableTwoFactor(password);
      toast.success(result.message);
      await loadStatus();
      return;
    }

    const codes = await regenerateRecoveryCodes(password);
    setRecoveryCodes(codes);
    await loadStatus();
  };

  const enabled = status?.enabled ?? false;
  const lowOnCodes = enabled && (status?.recovery_codes_remaining ?? 0) <= 2;

  return (
    <>
      <PageMeta
        title="Bảo mật tài khoản | Hệ thống đặt số của CGV Telecom"
        description="Quản lý xác thực hai lớp bằng passkey và mã khôi phục"
      />
      <PageBreadcrumb pageTitle="Bảo mật tài khoản" />

      <div className="space-y-6">
        {/* ---------- Trạng thái 2FA ---------- */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  enabled
                    ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                    : "bg-gray-100 text-gray-400 dark:bg-white/5"
                }`}>
                <MdShield size={26} />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                  Xác thực hai lớp (2FA)
                </h3>
                <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Bảo vệ tài khoản bằng passkey — vân tay, khuôn mặt hoặc khoá bảo
                  mật. Sau khi bật, mỗi lần đăng nhập bạn sẽ cần xác nhận thêm
                  trên thiết bị đã đăng ký.
                </p>
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      enabled
                        ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
                    }`}>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        enabled ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {enabled ? "Đang bật" : "Chưa bật"}
                  </span>
                </div>
              </div>
            </div>

            {enabled && (
              <Button
                size="sm"
                variant="outline"
                className="!text-red-500 !ring-red-300 hover:!bg-red-50 dark:!ring-red-500/40"
                startIcon={<MdLockOutline size={18} />}
                onClick={() => setPasswordAction("disable")}>
                Tắt 2FA
              </Button>
            )}
          </div>

          {!supported && (
            <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
              Trình duyệt này không hỗ trợ passkey. Vui lòng dùng Chrome, Edge
              hoặc Safari phiên bản mới để bật xác thực hai lớp.
            </div>
          )}

          {supported && !enabled && (
            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400">
              {hasBiometric
                ? "Thiết bị này có sẵn sinh trắc học — bạn có thể bật 2FA ngay bằng vân tay hoặc khuôn mặt."
                : "Bạn có thể dùng khoá bảo mật USB, hoặc passkey trên điện thoại bằng cách quét mã QR."}
            </div>
          )}
        </div>

        {/* ---------- Danh sách thiết bị ---------- */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Thiết bị đã đăng ký
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {status?.credential_count
                  ? `${status.credential_count} thiết bị đang hoạt động`
                  : "Chưa có thiết bị nào"}
              </p>
            </div>
            <Button
              size="sm"
              startIcon={<MdAddCircleOutline size={18} />}
              onClick={handleAddDevice}
              disabled={!supported || isRegistering}>
              {isRegistering ? "Đang đăng ký..." : "Thêm thiết bị"}
            </Button>
          </div>

          {enabled && status?.credential_count === 1 && (
            <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
              Bạn chỉ có một thiết bị. Nên đăng ký thêm một thiết bị dự phòng để
              tránh mất quyền truy cập nếu thiết bị này hỏng hoặc thất lạc.
            </div>
          )}

          {isLoading ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Đang tải...
            </p>
          ) : !status?.credentials.length ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
              <MdFingerprint
                size={40}
                className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chưa đăng ký thiết bị nào. Thêm thiết bị đầu tiên để bật xác thực
                hai lớp.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {status.credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                      <MdFingerprint size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {cred.device_name}
                        </p>
                        {cred.is_backed_up && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            <MdCloudDone size={13} /> Đã sao lưu
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Đăng ký {formatDate(cred.created_at)} · Dùng lần cuối{" "}
                        {formatDate(cred.last_used_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRename(cred)}
                      title="Đổi tên"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5">
                      <MdDriveFileRenameOutline size={19} />
                    </button>
                    <button
                      onClick={() => handleDelete(cred)}
                      title="Gỡ thiết bị"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10">
                      <MdDeleteOutline size={19} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Mã khôi phục ---------- */}
        {enabled && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  <MdKey size={24} />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                    Mã khôi phục
                  </h3>
                  <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                    Dùng để đăng nhập khi bạn không còn thiết bị nào. Còn lại{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {status?.recovery_codes_remaining ?? 0} mã
                    </span>{" "}
                    chưa sử dụng.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setPasswordAction("regenerate")}>
                Phát lại mã
              </Button>
            </div>

            {lowOnCodes && (
              <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
                Bạn sắp hết mã khôi phục. Hãy phát lại bộ mã mới để đảm bảo vẫn
                đăng nhập được khi mất thiết bị.
              </div>
            )}
          </div>
        )}
      </div>

      <RecoveryCodesModal
        isOpen={!!recoveryCodes}
        codes={recoveryCodes || []}
        onClose={() => setRecoveryCodes(null)}
      />

      <PasswordConfirmModal
        isOpen={!!passwordAction}
        title={passwordAction === "disable" ? "Tắt xác thực hai lớp" : "Phát lại mã khôi phục"}
        description={
          passwordAction === "disable"
            ? "Toàn bộ thiết bị đã đăng ký và mã khôi phục sẽ bị xoá. Tài khoản chỉ còn được bảo vệ bằng mật khẩu."
            : "Bộ mã khôi phục cũ sẽ bị vô hiệu hoá ngay lập tức và thay bằng bộ mã mới."
        }
        confirmLabel={passwordAction === "disable" ? "Tắt 2FA" : "Phát lại mã"}
        danger={passwordAction === "disable"}
        onConfirm={handlePasswordConfirm}
        onClose={() => setPasswordAction(null)}
      />
    </>
  );
}
