import { FaFileExcel } from "react-icons/fa";
import { BsExclamationTriangleFill } from "react-icons/bs";

export type PhoneErrorFileCardData = {
  file_name: string;
  size_bytes: number;
  created_at: string;
  source_timestamp: string;
  download_url?: string;
};

type CardErrorProps = {
  data: PhoneErrorFileCardData;
  onViewDetail?: (data: PhoneErrorFileCardData) => void;
  className?: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const CardError: React.FC<CardErrorProps> = ({
  data,
  onViewDetail,
  className = "",
}) => {
  const created =
    data.created_at?.trim() || data.source_timestamp?.trim() || "";

  return (
    <div
      className={`min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <FaFileExcel className="text-2xl" aria-hidden />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                  {data.file_name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(data.size_bytes)}</span>
                  {created ? (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">
                        •
                      </span>
                      <span>Tạo lúc: {formatDateTime(created)}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetail?.(data)}
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200">
                  Xem chi tiết
                </button>
              </div>
            </div>

            {/* <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/25 dark:text-amber-200">
                <BsExclamationTriangleFill className="text-[14px] shrink-0" />
                <span className="font-medium">File export lỗi</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardError;
