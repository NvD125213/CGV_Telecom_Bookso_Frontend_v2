import { useEffect, useState } from "react";

import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "../../icons";

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}

/** Hỏi lại mật khẩu cho các thao tác nhạy cảm: tắt 2FA, phát lại mã khôi phục. */
export default function PasswordConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(password);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Không thực hiện được, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[460px] m-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{description}</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6">
          <Label>
            Mật khẩu hiện tại <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="Nhập mật khẩu để xác nhận"
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
              {showPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
              )}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button
            type="submit"
            size="sm"
            className={`flex-1 ${danger ? "!bg-red-500 hover:!bg-red-600" : ""}`}
            disabled={isSubmitting || !password}>
            {isSubmitting ? "Đang xử lý..." : confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
