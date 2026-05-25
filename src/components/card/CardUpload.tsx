import {
  BsCheckCircleFill,
  BsExclamationTriangleFill,
  BsXCircleFill,
} from "react-icons/bs";
import { FaFileExcel } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import Swal from "sweetalert2";
import axios from "axios";
import { useDeleteFileNumber } from "../../hooks/api-hooks/v3/useCheckPhone";

export type UploadPhoneRecord = {
  file_code: string;
  original_filename: string;
  brandname_name: string;
  brandname_id: number;
  uploaded_at: string;
  raw: string;
  phone_full: string;
  phone_last9: string;
  provider_name: string;
  type_number_name: string;
  forward_number: string | null;
  length: number;
  is_valid_candidate: boolean;
  validation_errors: string[];
  index: number;
  provider_id: number;
  type_number_id: number;
};

export type UploadFileCardData = {
  file_code: string;
  original_filename: string;
  uploaded_at: string;
  uploaded_by: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  records?: UploadPhoneRecord[];
};

/** Body JSON khi DELETE upload file thành công (HTTP 2xx). */
type DeleteUploadFileSuccessResponse = {
  message?: string;
  file_code?: string;
};

type CardUploadProps = {
  data?: UploadFileCardData;
  onDetail?: (data: UploadFileCardData) => void;
  /** Gọi sau khi xóa file thành công (vd: đóng drawer nếu đang xem file này). */
  onDeleted?: (fileCode: string) => void;
  className?: string;
};

const CardUpload: React.FC<CardUploadProps> = ({
  data = {
    file_code: "20260507155032_88f6f007",
    original_filename: "sample_file.xlsx",
    uploaded_at: "2026-05-07T15:50:32.864833+07:00",
    uploaded_by: "HUYLQ",
    total_records: 6,
    valid_records: 5,
    invalid_records: 1,
  },
  onDetail,
  onDeleted,
  className = "",
}) => {
  const { mutateAsync: deleteFileByCode, isPending: isDeleting } =
    useDeleteFileNumber();

  const hasInvalidRecords = data.invalid_records > 0;

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Xóa file?",
      text: `Bạn có chắc muốn xóa "${data.original_filename}"? Thao tác không hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Hủy",
      confirmButtonText: "Xóa",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await deleteFileByCode(data.file_code);
      const payload = (res?.data ?? {}) as DeleteUploadFileSuccessResponse;

      const successText =
        typeof payload.message === "string" && payload.message.trim()
          ? payload.message.trim()
          : `"${data.original_filename}" đã được gỡ khỏi danh sách.`;

      await Swal.fire({
        icon: "success",
        title: "Đã xóa file",
        text: successText,
        confirmButtonText: "Đóng",
      });

      const deletedCode =
        typeof payload.file_code === "string" && payload.file_code.trim()
          ? payload.file_code.trim()
          : data.file_code;
      onDeleted?.(deletedCode);
    } catch (err: unknown) {
      let message = "Không thể xóa file.";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as {
          detail?: unknown;
          message?: string;
        };
        if (typeof d?.message === "string" && d.message) message = d.message;
        else if (typeof d?.detail === "string") message = d.detail;
        else if (
          d?.detail &&
          typeof d.detail === "object" &&
          "message" in d.detail &&
          typeof (d.detail as { message?: unknown }).message === "string"
        ) {
          message = String((d.detail as { message: string }).message);
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      await Swal.fire({
        icon: "error",
        title: "Không thể xóa file",
        text: message,
        confirmButtonText: "Đóng",
      });
    }
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div
      className={`min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 pt-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <FaFileExcel className="text-2xl" />
            </div>
          </div>

          {/* Main Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              {/* Filename + Metadata */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                  {data.original_filename}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-mono">#{data.file_code}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>Ngày tải: {formatDateTime(data.uploaded_at)}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDetail?.(data);
                  }}
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200">
                  Chi tiết
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300">
                  {isDeleting ? "Đang xóa…" : "Xóa"}
                </button>
              </div>
            </div>

            {/* User Info + Stats (down below) */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300">
                <div className="flex size-5 items-center justify-center rounded-full bg-white/80 dark:bg-blue-950/40">
                  <FiUser className="text-[12px]" />
                </div>
                <span className="text-blue-600/80 dark:text-blue-300/80">
                  Tải lên bởi:
                </span>
                <span className="font-semibold">{data.uploaded_by}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {/* Total */}
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-gray-500">Tổng:</span>
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                    {data.total_records} số
                  </span>
                </div>

                {/* Valid */}
                <div className="flex items-center gap-1.5 whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                  <BsCheckCircleFill className="text-[15px] shrink-0" />
                  <span className="font-semibold tabular-nums leading-none">
                    {data.valid_records}
                  </span>
                  <span className="opacity-75">Hợp lệ</span>
                </div>

                {/* Invalid */}
                {data.invalid_records > 0 && (
                  <div className="flex items-center gap-1.5 whitespace-nowrap text-red-600 dark:text-red-400">
                    <span
                      className="relative inline-flex size-5 shrink-0 items-center justify-center"
                      aria-hidden>
                      <span className="absolute size-4 animate-ping rounded-full bg-red-400/30 dark:bg-red-500/25" />
                      <BsXCircleFill className="relative z-[1] text-[15px]" />
                    </span>
                    <span className="font-semibold tabular-nums leading-none">
                      {data.invalid_records}
                    </span>
                    <span className="opacity-75">Lỗi</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        {hasInvalidRecords && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
            <BsExclamationTriangleFill className="mt-0.5 flex-shrink-0 text-lg" />
            <p className="text-sm leading-relaxed">
              File này có dữ liệu không hợp lệ. Vui lòng kiểm tra chi tiết.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardUpload;
