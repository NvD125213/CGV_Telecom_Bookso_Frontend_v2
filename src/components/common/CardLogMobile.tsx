import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTheme } from "../../context/ThemeContext";
import { formatCurrency } from "../../helper/formatCurrency";
import DualProgress from "../progress-bar/DualProgress";
import PaymentProcess from "../../pages/Subscription/PaymentProcess";
import { LogTypeBadge } from "../../pages/Logs/LogTable";
import { ChevronDownIcon } from "../../icons";

export interface LogMobileRecord {
  id: number | string;
  customer_name?: string;
  name_sale?: string;
  total_cid?: number;
  total_minutes?: number | string;
  created_at?: string;
  payment_at?: string;
  is_order?: boolean;
  is_subscription?: boolean;
  is_subscription_items?: boolean;
  total_price_payment?: number;
  total_price_paymented?: number;
  total_minutes_all?: number;
  total_quota_used?: number;
  children?: Record<string, any>[];
  [key: string]: any;
}

interface CardLogMobileProps {
  item: LogMobileRecord;
  onDetail?: (item: LogMobileRecord) => void;
  className?: string;
}

const formatLogDate = (date?: string) =>
  date
    ? new Date(date).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const formatNumberVN = (value?: number | string | null) => {
  if (value == null || value === "") return "0";
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d]/g, ""));
    return Number.isFinite(parsed)
      ? parsed.toLocaleString("vi-VN")
      : value;
  }
  return Number(value).toLocaleString("vi-VN");
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 last:pb-0 dark:border-gray-800">
    <span className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">
      {label}
    </span>
    <span className="max-w-[58%] break-words text-right text-sm font-medium text-gray-900 dark:text-gray-100">
      {value}
    </span>
  </div>
);

export const CardLogMobile = ({
  item,
  onDetail,
  className = "",
}: CardLogMobileProps) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const canExpand = (item.children?.length ?? 0) > 0;

  const progressBlock =
    (item.total_minutes_all ?? 0) > 0 ? (
      <DualProgress
        barClassName="h-2"
        labelClassName="text-xs"
        total={item.total_minutes_all ?? 0}
        current={item.total_quota_used ?? 0}
      />
    ) : (
      <span className="text-xs text-gray-400">Không có dữ liệu</span>
    );

  return (
    <div className={`mb-3 px-1 sm:px-0 ${className}`}>
      <div
        className={`rounded-2xl border shadow-sm transition-shadow hover:shadow-md ${
          theme === "dark"
            ? "border-gray-700 bg-gray-900"
            : "border-gray-200 bg-white"
        }`}>
        <div className="p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Khách hàng
              </p>
              <h3 className="mt-1 break-words text-lg font-bold text-gray-900 dark:text-white">
                {item.customer_name || "-"}
              </h3>
              <div className="mt-2">
                <LogTypeBadge
                  is_order={item.is_order}
                  is_subscription={item.is_subscription}
                  is_subscription_items={item.is_subscription_items}
                />
              </div>
            </div>
            {onDetail && (
              <button
                type="button"
                onClick={() => onDetail(item)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Chi tiết">
                <VisibilityIcon fontSize="small" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            <DetailRow label="Sales" value={item.name_sale || "-"} />
            <DetailRow label="CID" value={formatNumberVN(item.total_cid)} />
            <DetailRow
              label="Số phút"
              value={formatNumberVN(item.total_minutes)}
            />
            <DetailRow label="Ngày tạo" value={formatLogDate(item.created_at)} />
            <DetailRow
              label="Ngày thanh toán"
              value={formatLogDate(item.payment_at)}
            />
            <div className="border-b border-gray-100 pb-2 dark:border-gray-800">
              <p className="mb-1.5 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                Lưu lượng cuộc gọi
              </p>
              {progressBlock}
            </div>
          </div>

          <div
            className={`mt-4 rounded-xl border px-3 py-2.5 ${
              theme === "dark"
                ? "border-indigo-800 bg-indigo-950/40"
                : "border-indigo-100 bg-indigo-50"
            }`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              Thanh toán
            </p>
            <div className="mt-2">
              <PaymentProcess
                className="!text-center !text-[11px]"
                current={item.total_price_paymented ?? 0}
                total={item.total_price_payment ?? 0}
              />
            </div>
          </div>

          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}>
                <ChevronDownIcon className="h-4 w-4" />
              </motion.span>
              {expanded ? "Thu gọn gói con" : `Xem ${item.children?.length} gói con`}
            </button>
          )}

          <AnimatePresence>
            {expanded && canExpand && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 space-y-2 overflow-hidden">
                {item.children?.map((child, index) => (
                  <div
                    key={`${child.id ?? index}`}
                    className={`rounded-xl border p-3 text-xs ${
                      theme === "dark"
                        ? "border-gray-700 bg-gray-800/60"
                        : "border-gray-200 bg-gray-50"
                    }`}>
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {child.name_plan || child.customer_name || "Gói con"}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <span>
                        CID:{" "}
                        <strong>{formatNumberVN(child.total_cid)}</strong>
                      </span>
                      <span>
                        Phút:{" "}
                        <strong>{formatNumberVN(child.total_minutes)}</strong>
                      </span>
                      <span className="col-span-2">
                        Giá:{" "}
                        <strong>
                          {formatCurrency(child.total_price ?? 0)}
                        </strong>
                      </span>
                      <span>
                        TT:{" "}
                        <strong
                          className={
                            child.is_payment
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-red-600 dark:text-red-400"
                          }>
                          {child.is_payment ? "Đã TT" : "Chưa TT"}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

interface CardLogMobileListProps {
  items: LogMobileRecord[];
  onDetail?: (item: LogMobileRecord) => void;
  className?: string;
}

export const CardLogMobileList = ({
  items,
  onDetail,
  className = "",
}: CardLogMobileListProps) => {
  if (!items.length) return null;

  return (
    <div className={className}>
      {items.map((item) => (
        <CardLogMobile
          key={String(item.id)}
          item={item}
          onDetail={onDetail}
        />
      ))}
    </div>
  );
};
