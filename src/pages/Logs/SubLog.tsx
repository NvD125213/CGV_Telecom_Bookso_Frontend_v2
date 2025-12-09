import { useMemo } from "react";
import { motion } from "framer-motion";
import React from "react";
import { RootState } from "../../store";
import { useSelector } from "react-redux";
import { GiConfirmed } from "react-icons/gi";
import ActionMenu from "./LogMenu"; // Import ActionMenu component
import DualProgress from "../../components/progress-bar/DualProgress";

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
  ({ sub, onConfirm, checkPayment, onDetail }: any) => {
    const formatCurrency = (value: number | string | undefined) => {
      if (value == null) return "0 ₫";
      // Handle string formatted prices like "10.000.000 ₫"
      if (typeof value === "string") {
        return value;
      }
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    };

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
    const formatNumberVN = (value: number | string) => {
      if (value == null) return "";
      // Handle string formatted numbers like "10.000"
      if (typeof value === "string") {
        return value;
      }
      return value.toLocaleString("vi-VN");
    };

    const getPlanType = (sub: any) => {
      if (sub.is_subscription === true) return "main"; // gói cha
      if (sub.is_subscription_items === true) return "sub"; // gói con
      return sub.type || "sub"; // fallback
    };

    const mappedSub = {
      ...sub,
      name: sub.name_plan || sub.name,
      cid: sub.total_cid ?? sub.cid ?? 0,
      minutes: sub.total_minutes ?? sub.minutes ?? 0,
      price: sub.total_price ?? sub.price ?? 0,
      planType: getPlanType(sub),
    };

    return (
      <motion.tr
        layout
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
        {/* Dot payment */}
        <td className="px-3 py-2 text-center">
          <span className="relative flex h-2 w-2 mx-auto">
            <span
              className={`absolute inset-0 rounded-full animate-ping ${
                mappedSub.is_payment ? "bg-blue-400" : "bg-red-400"
              } opacity-75`}
            />
            <span
              className={`relative h-2 w-2 rounded-full ${
                mappedSub.is_payment ? "bg-blue-500" : "bg-red-500"
              }`}
            />
          </span>
        </td>

        {/* Name */}
        <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
          <span className="truncate block">{mappedSub.name || "-"}</span>
        </td>

        {/* CID */}
        <td className="px-3 py-2 text-[12px] text-center text-gray-600 dark:text-gray-300">
          <span className="font-medium">{formatNumberVN(mappedSub.cid)}</span>
        </td>

        {/* Minutes */}
        <td className="px-3 py-2 text-[12px] text-center text-gray-600 dark:text-gray-300">
          <span className="font-medium">
            {formatNumberVN(mappedSub.minutes)}
          </span>
        </td>

        {/* Type */}
        <td className="px-3 py-2 text-center">
          {mappedSub.planType === "main" ? (
            <span className="px-2 py-0.5 text-[12px] font-medium rounded-full text-blue-700 bg-blue-100 dark:bg-blue-900/30 whitespace-nowrap">
              Gói chính
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[12px] font-medium rounded-full text-purple-600 bg-purple-100 dark:bg-purple-900/30 whitespace-nowrap">
              Gói phụ
            </span>
          )}
        </td>

        {/* Price */}
        <td className="px-3 py-2 text-[12px] text-center text-gray-600 dark:text-gray-300">
          <span className="font-medium">{formatCurrency(mappedSub.price)}</span>
        </td>

        {/* is_payment */}
        <td className="px-3 py-2 text-center">
          <span
            className={`inline-block px-2 py-0.5 text-[12px] font-medium rounded-full whitespace-nowrap ${
              mappedSub.is_payment
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                : "bg-red-100 text-red-700 dark:bg-red-900/30"
            }`}>
            {mappedSub.is_payment ? "Đã thanh toán" : "Chưa thanh toán"}
          </span>
        </td>

        {/* Created date */}
        <td className="px-3 py-2 text-[12px] text-center text-gray-600 dark:text-gray-300">
          <span className="inline-block">
            {formatDate(mappedSub.created_at)}
          </span>
        </td>

        {/* Payment date */}
        <td className="px-3 py-2 text-[12px] text-center text-gray-600 dark:text-gray-300">
          <span className="inline-block">
            {formatDate(mappedSub.payment_at)}
          </span>
        </td>

        {/* Progress */}
        <td className="px-3 py-2 min-w-[180px]">
          <DualProgress
            labelClassName="text-[12px]"
            current={mappedSub.quota_used ?? 0}
            total={mappedSub.total_minutes ?? 0}
          />
        </td>

        {/* Action Menu */}
        <td className="px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            {/* Confirm button - only show for specific users and unpaid items */}
            {checkPayment === false &&
              (user.sub == "VANLTT" || user.sub == "HUYLQ") && (
                <button
                  onClick={onConfirm}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors">
                  <GiConfirmed className="h-4 w-4 text-blue-500" />
                </button>
              )}

            {/* Action Menu */}
            <ActionMenu item={mappedSub} onDetail={onDetail} />
          </div>
        </td>
      </motion.tr>
    );
  }
);

// Updated SubPlanTable to handle the new data structure with children array
export const SubPlanTable = ({
  parentItem,
  isLoading,
  onDetail,
}: {
  parentItem: any;
  isLoading?: boolean;
  onDetail?: (item: any) => void;
}) => {
  // Create merged plans from parent item and its children
  const mergedPlans = useMemo(() => {
    const plans = [];

    // Add parent as main plan
    if (parentItem) {
      plans.push({
        ...parentItem,
        type: "main",
      });
    }

    // Add children as sub plans
    if (parentItem?.children && Array.isArray(parentItem.children)) {
      parentItem.children.forEach((child: any) => {
        plans.push({
          ...child,
          type: "sub",
        });
      });
    }

    return plans;
  }, [parentItem]);

  return (
    <div className="w-full dark:from-gray-900 dark:to-gray-800 overflow-hidden px-3">
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-4">
            <SubPlanSkeleton />
          </div>
        ) : mergedPlans?.length ? (
          <table className="w-full text-sm">
            <thead className="dark:bg-gray-800/70 sticky top-0 border-b-2 border-gray-300 dark:border-gray-600">
              <tr>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px]"></th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-[12px]">
                  Tên gói
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px]">
                  CID
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px]">
                  Phút gọi
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px]">
                  Loại gói
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px]">
                  Giá
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px]">
                  Thanh toán
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px]">
                  Ngày tạo
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px]">
                  Ngày thanh toán
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px]">
                  Lưu lượng
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 text-[12px] w-24">
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody>
              {mergedPlans.map((sub: any, index: number) => (
                <SubPlanRow
                  key={`${sub.id}-${index}`}
                  sub={sub}
                  onDetail={onDetail}
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
