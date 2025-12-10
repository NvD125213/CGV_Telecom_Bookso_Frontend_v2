import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { subscriptionService } from "../../services/subcription";
import { useApi } from "../../hooks/useApi";
import DualProgress from "../../components/progress-bar/DualProgress";
import { formatCurrency } from "../../helper/formatCurrency";
import SubPlanSelect from "../Subscription/SubPlanDropdown";
import { useState, Fragment } from "react";
import { SubPlanTable } from "./SubLog";
import { ChevronDownIcon } from "../../icons";
import { motion, AnimatePresence } from "framer-motion";
// import { formatDate } from "@fullcalendar/core/index.js";
import PaymentProcess from "../Subscription/PaymentProcess";
import LogMenu from "./LogMenu";

const StatusBadge = ({ status }: { status: number }) => {
  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 1:
        return {
          text: "Hoạt động",
          className:
            "inline-flex whitespace-nowrap items-center px-2 py-1 rounded-full font-medium text-xs bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
        };
      case 2:
        return {
          text: "Chờ duyệt",
          className:
            "inline-flex whitespace-nowrap items-center px-2 py-1 rounded-full font-medium text-xs bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500",
        };
      case 0:
        return {
          text: "Hết hạn",
          className:
            "inline-flex whitespace-nowrap items-center px-2 py-1 rounded-full font-medium text-xs bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500",
        };
      default:
        return {
          text: "Đã thu hồi",
          className:
            "inline-flex whitespace-nowrap items-center px-2 py-1 rounded-full font-medium text-xs bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
        };
    }
  };

  const statusDisplay = getStatusDisplay(status);
  return <span className={statusDisplay.className}>{statusDisplay.text}</span>;
};

// Component để hiển thị loại log
export const LogTypeBadge = ({
  is_order,
  is_subscription,
  is_subscription_items,
}: {
  is_order?: boolean;
  is_subscription?: boolean;
  is_subscription_items?: boolean;
}) => {
  const getLogTypes = () => {
    const types: { text: string; className: string }[] = [];

    if (is_order) {
      types.push({
        text: "Gói đặt trước",
        className:
          "inline-flex whitespace-nowrap items-center px-2 py-1 rounded-full font-medium text-xs bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-500",
      });
    }

    if (is_subscription) {
      types.push({
        text: "Gói cố định",
        className:
          "inline-flex whitespace-nowrap items-center px-2 py-1 rounded-full font-medium text-xs bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-500",
      });
    }

    if (is_subscription_items) {
      types.push({
        text: "Gói mở rộng",
        className:
          "inline-flex whitespace-nowrap items-center px-2 py-1 rounded-full font-medium text-xs bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-500",
      });
    }

    return types;
  };

  const logTypes = getLogTypes();

  if (logTypes.length === 0) {
    return (
      <span className="inline-flex whitespace-nowrap items-center px-2 py-1 rounded-full font-medium text-xs bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400">
        Không xác định
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {logTypes.map((type, index) => (
        <span key={index} className={type.className}>
          {type.text}
        </span>
      ))}
    </div>
  );
};

export const CustomLogTable = ({
  rawData,
  isLoading,
  onDetail,
  quotaMonth,
  total_revenue,
  total_unpaid,
  onQuotaMonthChange,
}: {
  rawData: any[];
  viettelCID?: any[];
  isLoading: boolean;
  onDetail?: (item: any) => void;
  onConfirm?: (item: any) => void;
  onRenew?: (item: any) => void;
  onReload?: () => void;
  role?: number;
  quotaMonth?: string;
  total_revenue?: string;
  total_unpaid?: string;
  onQuotaMonthChange?: (value: string) => void;
}) => {
  const columns = [
    { key: "customer_name", label: "Khách hàng" },
    { key: "log_type", label: "Định dạng" },
    { key: "name_sale", label: "Sales" },
    { key: "total_cid", label: "CID" },
    { key: "total_minutes", label: "Số phút" },
    { key: "created_at", label: "Ngày tạo" },
    { key: "payment_at", label: "Ngày thanh toán" },
    { key: "progress", label: "Lưu lượng cuộc gọi" },
    { key: "payment_progress", label: "Thanh toán" },
  ];

  const hasActionColumn = onDetail;

  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string, subListPlan: any) => {
    if (!subListPlan?.children || subListPlan.children.length === 0) return;
    setOpenRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatNumberVN = (value: number) => {
    if (value == null) return "";
    return value.toLocaleString("vi-VN");
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

  // Tính tổng số is_payment true, tổng số is_payment, giá của từng cái

  const data = rawData.map((item: any) => {
    // Convert total_price cha
    const parentPrice =
      typeof item.total_price === "string"
        ? Number(item.total_price.replace(/[^\d]/g, "")) // xoá ký tự . ₫
        : item.total_price || 0;

    // Convert total_minutes cha
    const parentMinutes =
      typeof item.total_minutes === "string"
        ? Number(item.total_minutes.replace(/[^\d]/g, "")) // "10.000" -> 10000
        : item.total_minutes || 0;

    // Check nếu có children
    const hasChildren = item.children && item.children.length > 0;

    // Nếu không có children, chỉ dùng giá trị của cha
    if (!hasChildren) {
      return {
        ...item,
        total_price_payment: parentPrice,
        total_price_paymented: item.is_payment ? parentPrice : 0,
        total_quota_used: item.quota_used || 0,
        total_minutes_all: parentMinutes,
      };
    }

    // Có children - tính tổng
    // Tổng total_price children
    const childrenTotal = item.children.reduce((acc: number, sub: any) => {
      return acc + (sub.total_price || 0);
    }, 0);

    // Tổng total_price children đã thanh toán
    const childrenPaid = item.children.reduce((acc: number, sub: any) => {
      return acc + (sub.is_payment === true ? sub.total_price || 0 : 0);
    }, 0);

    // Tổng quota_used của cha + children
    const totalQuotaUsed =
      (item.quota_used || 0) +
      item.children.reduce(
        (acc: number, sub: any) => acc + (sub.quota_used || 0),
        0
      );

    // Tổng total_minutes cha + children
    const totalMinutes =
      parentMinutes +
      item.children.reduce(
        (acc: number, sub: any) => acc + (sub.total_minutes || 0),
        0
      );

    // Tổng tiền
    const totalPayment = parentPrice + childrenTotal;

    // Tổng tiền đã thanh toán
    const totalPaymented = (item.is_payment ? parentPrice : 0) + childrenPaid;

    return {
      ...item,
      total_price_payment: totalPayment,
      total_price_paymented: totalPaymented,
      total_quota_used: totalQuotaUsed,
      total_minutes_all: totalMinutes,
    };
  });

  // format VND
  const formatCurrency = (value: any) => {
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  return (
    <div className="space-y-3">
      {/* Summary Cards - Compact */}
      <div className="flex gap-2 justify-end items-center">
        <div className="flex gap-2 justify-end items-center">
          {/* Tổng doanh thu */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-300 bg-green-50 dark:bg-green-500/10">
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
              Tổng doanh thu:
            </span>
            <span className="text-sm font-bold text-green-700 dark:text-green-400">
              {formatCurrency(total_revenue)}
            </span>
          </div>

          {/* Chưa thanh toán */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-500/10">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
              Chưa thanh toán:
            </span>
            <span className="text-sm font-bold text-red-700 dark:text-red-400">
              {formatCurrency(total_unpaid)}
            </span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <motion.div
        className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-black overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="w-full">
          <div className="w-full">
            <div className="max-h-[600px] overflow-y-auto dark:bg-black">
              <Table className="w-full dark:text-white text-sm">
                {/* Header */}
                <TableHeader className="relative top-0 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      isHeader
                      className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300 text-xs w-6">
                      <div></div>
                    </TableCell>

                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        isHeader
                        className={`px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap !text-center ${
                          col.key === "progress" ||
                          col.key === "payment_progress"
                            ? "min-w-[150px]"
                            : ""
                        }`}>
                        {col.key === "progress" ? (
                          <div className="flex items-center justify-between gap-2">
                            <span>{col.label}</span>
                            {quotaMonth !== undefined && onQuotaMonthChange && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const input = document.getElementById(
                                      "quota-month-input"
                                    ) as HTMLInputElement;
                                    if (input) {
                                      if (input.showPicker) {
                                        input.showPicker();
                                      } else {
                                        input.focus();
                                      }
                                    }
                                  }}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                  title="Chọn tháng">
                                  <svg
                                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </button>
                                <input
                                  id="quota-month-input"
                                  type="month"
                                  value={quotaMonth}
                                  onChange={(e) =>
                                    onQuotaMonthChange(e.target.value)
                                  }
                                  className="absolute opacity-0 w-0 h-0"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          col.label
                        )}
                      </TableCell>
                    ))}

                    {hasActionColumn && (
                      <TableCell
                        isHeader
                        className="px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300 text-xs text-center w-[100px]">
                        Hành động
                      </TableCell>
                    )}
                  </TableRow>
                </TableHeader>

                {/* Body */}
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <motion.tr
                        key={index}
                        className="border-b border-gray-100 dark:border-gray-800"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}>
                        <TableCell className="px-4 py-2.5 w-6">
                          <div></div>
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell
                            key={col.key}
                            className={`px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400`}>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                          </TableCell>
                        ))}
                        {hasActionColumn && (
                          <TableCell className="px-3 py-2.5 w-[80px]">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2 mx-auto" />
                          </TableCell>
                        )}
                      </motion.tr>
                    ))
                  ) : data.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}>
                      <TableCell
                        colSpan={columns.length + (hasActionColumn ? 2 : 1)}
                        className="py-12 text-center">
                        <motion.div
                          className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.3 }}>
                          <svg
                            className="w-12 h-12 text-gray-300 dark:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-sm font-medium">
                            Không tìm thấy dữ liệu
                          </p>
                          <p className="text-xs">
                            Không tìm thấy dữ liệu phù hợp, đổi bộ lọc để tìm
                            kiếm
                          </p>
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  ) : (
                    <AnimatePresence>
                      {data.map((item, index) => (
                        <Fragment key={`${index}-${Number(item.id)}`}>
                          {/* Main Row */}
                          <motion.tr
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
                            onClick={() => toggleRow(item.id, item)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            layout>
                            <TableCell className="px-4 py-2.5 w-6">
                              {item.children?.length > 0 && (
                                <motion.div
                                  animate={{
                                    rotate: openRows[item.id] ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.2 }}>
                                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                </motion.div>
                              )}
                            </TableCell>

                            {columns.map((col) => (
                              <TableCell
                                key={col.key}
                                className={`px-3 py-4 text-xs text-gray-600 dark:text-gray-300 ${
                                  col.key === "progress" ||
                                  col.key === "payment_progress"
                                    ? "min-w-[150px]"
                                    : ""
                                }`}>
                                {col.key === "customer_name" ? (
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {item[col.key] || "-"}
                                  </span>
                                ) : col.key === "log_type" ? (
                                  <LogTypeBadge
                                    is_order={item.is_order}
                                    is_subscription={item.is_subscription}
                                    is_subscription_items={
                                      item.is_subscription_items
                                    }
                                  />
                                ) : col.key === "payment_at" ? (
                                  <span className="font-medium">
                                    {formatDate(item[col.key])}
                                  </span>
                                ) : col.key === "created_at" ? (
                                  <span className="font-medium">
                                    {formatDate(item[col.key])}
                                  </span>
                                ) : col.key === "status" ? (
                                  <StatusBadge status={item.status} />
                                ) : col.key === "payment_progress" ? (
                                  <PaymentProcess
                                    className="!text-center !text-[11px]"
                                    current={item.total_price_paymented}
                                    total={item.total_price_payment}
                                  />
                                ) : col.key === "total_price" ? (
                                  <span className="font-medium">
                                    {formatCurrency(item[col.key])}
                                  </span>
                                ) : col.key === "released_at" ? (
                                  <span className="font-medium">
                                    {formatDate(item[col.key])}
                                  </span>
                                ) : col.key === "total_did" ? (
                                  <span className="font-medium">
                                    {item.viettelCID +
                                      " / " +
                                      formatNumberVN(item[col.key])}
                                  </span>
                                ) : col.key === "total_minutes" ? (
                                  formatNumberVN(item[col.key])
                                ) : col.key === "list_sub_plan" ? (
                                  <SubPlanSelect
                                    subPlans={item.list_sub_plan}
                                  />
                                ) : col.key === "progress" ? (
                                  item.total_minutes_all > 0 ? (
                                    <DualProgress
                                      barClassName="h-2"
                                      labelClassName="text-xs"
                                      total={item.total_minutes_all}
                                      current={item.total_quota_used}
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      Không có dữ liệu
                                    </span>
                                  )
                                ) : (
                                  item[col.key] || "-"
                                )}
                              </TableCell>
                            ))}

                            {hasActionColumn && (
                              <TableCell
                                className="px-3 py-2.5 w-[80px] text-center"
                                onClick={(e) => e.stopPropagation()}>
                                <LogMenu item={item} onDetail={onDetail} />
                              </TableCell>
                            )}
                          </motion.tr>

                          <AnimatePresence>
                            {openRows[item.id] && (
                              <motion.tr
                                className="dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-800"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{
                                  opacity: 1,
                                  height: "auto",
                                }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                layout>
                                <TableCell
                                  colSpan={
                                    columns.length + (hasActionColumn ? 2 : 1)
                                  }
                                  className="p-0">
                                  <div className="py-2">
                                    <SubPlanTable
                                      parentItem={item}
                                      onDetail={onDetail}
                                    />
                                  </div>
                                </TableCell>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </Fragment>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
