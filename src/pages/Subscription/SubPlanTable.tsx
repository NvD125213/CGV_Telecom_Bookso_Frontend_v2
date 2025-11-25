import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import React from "react";
import { RootState } from "../../store";
import { useSelector } from "react-redux";
import { GiConfirmed } from "react-icons/gi";
import {
  subscriptionItemService,
  subscriptionService,
} from "../../services/subcription";
import Swal from "sweetalert2";

interface StatusConfigItem {
  bg: string;
  text: string;
  label: string;
}

const statusConfig = {
  active: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "active",
  },
  deleted: {
    bg: "bg-red-500",
    text: "text-white",
    label: "deleted",
  },
  pending: {
    bg: "bg-warning-100 dark:bg-warning-900/30",
    text: "text-warning-500",
    label: "pending",
  },
} satisfies Record<string, StatusConfigItem>;

export type StatusKey = keyof typeof statusConfig;

export const StatusBadge = React.memo(
  ({ status }: { status: number | string }) => {
    const statusMap: Record<string | number, StatusKey> = {
      1: "active",
      2: "pending",
      0: "deleted",
      active: "active",
      pending: "pending",
      deleted: "deleted",
    };

    const config = statusConfig[statusMap[status] ?? "active"];

    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  }
);

export const SubPlanSkeleton = () => (
  <div className="animate-pulse w-full space-y-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-2 px-3">
        <div className="h-4 flex-1 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    ))}
  </div>
);

export const SubPlanRow = React.memo(
  ({ sub, onConfirm, checkPayment }: any) => {
    const formatCurrency = (value: number | undefined) =>
      value
        ? new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(value)
        : "0 ₫";

    const formatDate = (date: string | undefined) =>
      date
        ? new Date(date).toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
        : "-";

    const user = useSelector((state: RootState) => state.auth.user);
    const formatNumberVN = (value: number) => {
      if (value == null) return "";
      return value.toLocaleString("vi-VN");
    };

    return (
      <motion.tr
        layout
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
        {/* Dot payment */}
        <td className="px-6 py-3 text-center">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inset-0 rounded-full animate-ping ${
                sub.is_payment ? "bg-blue-400" : "bg-red-400"
              } opacity-75`}
            />
            <span
              className={`relative h-2.5 w-2.5 rounded-full ${
                sub.is_payment ? "bg-blue-500" : "bg-red-500"
              }`}
            />
          </span>
        </td>

        {/* Name + Avatar */}
        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center text-xs font-semibold">
              {(sub.name?.[0] || "P").toUpperCase()}
            </div>
            <span className="truncate min-w-[120px]">{sub.name || "-"}</span>
          </div>
        </td>

        {/* Minutes */}
        <td className="px-4 py-3 text-xs text-center text-gray-600 dark:text-gray-300">
          <span className="font-medium">
            {formatNumberVN(sub.minutes)} phút
          </span>
        </td>

        {/* Type */}
        <td className="px-4 py-3 text-sm text-center min-w-[100px]">
          {sub.type === "main" ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full text-blue-700 bg-blue-100 dark:bg-blue-900/30">
              Gói chính
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium rounded-full text-gray-500 bg-gray-100 dark:bg-gray-800/50">
              Gói phụ
            </span>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3 text-sm text-center">
          <StatusBadge status={sub.status} />
        </td>

        {/* Price */}
        <td className="px-4 py-3 text-xs text-center text-gray-600 dark:text-gray-300">
          <span className="font-medium">Giá: {formatCurrency(sub.price)}</span>
        </td>

        {/* is_payment */}
        <td className="px-4 py-3 text-sm text-center">
          <button
            className={`px-3 py-1 text-xs min-w-[120px] font-medium rounded-full ${
              sub.is_payment
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
            disabled>
            {sub.is_payment ? "Đã thanh toán" : "Chưa thanh toán"}
          </button>
        </td>

        {/* Deployment info */}
        <td className="px-4 py-3 text-xs text-center">
          <span className={`inline-block px-2 py-1 text-[11px] font-medium`}>
            {sub.status === 2
              ? "Chưa triển khai gói"
              : sub.status === 0
              ? "Gói đã xóa và các số đã được thu hồi"
              : `Ngày triển khai: ${formatDate(sub.released_at)}
              `}
          </span>
        </td>

        {/* Confirm button */}
        {checkPayment === false &&
          (user.sub == "VANLTT" || user.sub == "HUYLQ") && (
            <td className="px-6 py-3 text-center">
              <button onClick={onConfirm}>
                <GiConfirmed className="h-5 w-5 text-blue-500" />
              </button>
            </td>
          )}
      </motion.tr>
    );
  }
);

export const SubPlanTable = ({
  subPlans,
  mainSub,
  isLoading,
  onReload,
  checkPayment,
}: any) => {
  const mergedPlans = useMemo(
    () => [
      { ...mainSub, type: "main" },
      ...subPlans.map((p: any) => ({ ...p, type: "sub" })),
    ],
    [mainSub, subPlans]
  );
  const user = useSelector((state: RootState) => state.auth.user);

  const handleConfirmPayment = useCallback(
    async (item: any) => {
      if (item.is_payment) {
        Swal.fire({
          icon: "info",
          title: "Đã thanh toán",
          text: "Gói này đã được thanh toán trước đó !",
        });
        return; // Dừng hàm, không tiếp tục xác nhận
      }

      const result = await Swal.fire({
        title: "Xác nhận thanh toán",
        text: `Bạn có chắc chắn muốn xác nhận thanh toán gói ${item.name} không?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
      });

      if (!result.isConfirmed) return;

      try {
        const service =
          item.type === "main" ? subscriptionService : subscriptionItemService;

        const res = await service.update(item.id, { is_payment: true });

        if (res?.status === 200) {
          Swal.fire("Đã xác nhận!", "Thanh toán thành công.", "success");
          if (onReload) await onReload();
        } else {
          Swal.fire("Lỗi", "Không thể xác nhận thanh toán.", "error");
        }
      } catch (error: any) {
        Swal.fire(
          "Lỗi",
          error?.response?.data?.detail || "Xảy ra lỗi",
          "error"
        );
      }
    },
    [onReload]
  );

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden px-4 dark:border-gray-800">
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-4">
            <SubPlanSkeleton />
          </div>
        ) : mergedPlans?.length ? (
          <table className="w-full text-sm">
            <thead className="dark:bg-gray-800/50 sticky top-0">
              <tr>
                <th className="w-5"></th>
                {Array.from({ length: 7 }).map((_, i) => (
                  <th
                    key={i}
                    className="px-4 text-center font-semibold text-gray-700 dark:text-gray-300 text-xs"></th>
                ))}
                {checkPayment === false &&
                  (user.sub == "VANLTT" || user.sub == "HUYLQ") && (
                    <th className="px-4 text-center w-20 text-xs font-semibold"></th>
                  )}
              </tr>
            </thead>

            <tbody>
              {mergedPlans.map((sub: any, index: number) => (
                <SubPlanRow
                  key={`${sub.id}-${index}`}
                  sub={sub}
                  checkPayment={checkPayment}
                  onConfirm={() => handleConfirmPayment(sub)}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Không có gói phụ nào được đặt
          </div>
        )}
      </div>
    </div>
  );
};
