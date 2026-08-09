import { useState } from "react";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { MdContentCopy, MdDownload, MdWarningAmber } from "react-icons/md";

import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";

interface Props {
  isOpen: boolean;
  codes: string[];
  onClose: () => void;
}

/**
 * Mã khôi phục chỉ được server trả về ĐÚNG MỘT LẦN (backend chỉ lưu hash).
 * Vì vậy modal này cố tình không cho đóng bằng Esc / click nền, và bắt buộc
 * người dùng tích xác nhận đã lưu trước khi rời đi.
 */
export default function RecoveryCodesModal({ isOpen, codes, onClose }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      toast.success("Đã sao chép mã khôi phục");
    } catch {
      toast.error("Trình duyệt không cho phép sao chép, vui lòng tải file về");
    }
  };

  const handleDownload = () => {
    const content = [
      "MÃ KHÔI PHỤC - HỆ THỐNG BOOK SỐ CGV TELECOM",
      "",
      "Mỗi mã chỉ dùng được MỘT LẦN để đăng nhập khi bạn mất thiết bị passkey.",
      "Hãy cất giữ ở nơi an toàn và không chia sẻ cho bất kỳ ai.",
      "",
      ...codes.map((c, i) => `${String(i + 1).padStart(2, "0")}. ${c}`),
    ].join("\n");

    saveAs(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
      "ma-khoi-phuc-cgv-telecom.txt",
    );
    toast.success("Đã tải file mã khôi phục");
  };

  const handleClose = () => {
    if (!confirmed) return; // chặn đóng khi chưa xác nhận
    setConfirmed(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={confirmed}
      className="max-w-[560px] m-4">
      <div className="p-6 sm:p-8">
        <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          Mã khôi phục của bạn
        </h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Dùng các mã này để đăng nhập khi bạn không còn thiết bị đã đăng ký.
        </p>

        <div className="mb-5 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
          <MdWarningAmber
            size={22}
            className="shrink-0 text-amber-600 dark:text-amber-400"
          />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Đây là lần <strong>duy nhất</strong> các mã này được hiển thị. Hệ
            thống chỉ lưu bản mã hoá nên sẽ không thể xem lại. Hãy lưu ngay bây
            giờ.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          {codes.map((code) => (
            <code
              key={code}
              className="text-center font-mono text-sm tracking-wider text-gray-800 dark:text-gray-200">
              {code}
            </code>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="outline"
            startIcon={<MdContentCopy size={18} />}
            onClick={handleCopy}>
            Sao chép
          </Button>
          <Button
            size="sm"
            variant="outline"
            startIcon={<MdDownload size={18} />}
            onClick={handleDownload}>
            Tải về
          </Button>
        </div>

        <label className="mb-5 flex cursor-pointer items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span>Tôi đã lưu các mã khôi phục ở nơi an toàn</span>
        </label>

        <Button className="w-full" size="sm" onClick={handleClose} disabled={!confirmed}>
          Hoàn tất
        </Button>
      </div>
    </Modal>
  );
}
