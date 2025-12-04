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
import ActionMenu from "./ActionMenu";
import SubPlanSelect from "./SubPlanDropdown";
import { useState, Fragment } from "react";
import { SubPlanTable } from "./SubPlanTable";
import { ChevronDownIcon } from "../../icons";
import { motion, AnimatePresence } from "framer-motion";
// import { formatDate } from "@fullcalendar/core/index.js";
import PaymentProcess from "./PaymentProcess";
import { CalendarMonth } from "@mui/icons-material";

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

export const CustomSubscriptionTable = ({
  dataRaw,
  isLoading,
  onEdit,
  onDelete,
  onDetail,
  onConfirm,
  onReload,
  onRenew,
  role,
  quotaMonth,
  onQuotaMonthChange,
}: {
  dataRaw: any[];
  isLoading: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (id: string | number) => void;
  onDetail?: (item: any) => void;
  onConfirm?: (item: any) => void;
  onRenew?: (item: any) => void;
  onReload?: () => void;
  role?: number;
  quotaMonth?: string;
  onQuotaMonthChange?: (value: string) => void;
}) => {
  const columns = [
    { key: "customer_name", label: "Khách hàng" },
    { key: "username", label: "Sales" },
    { key: "status", label: "Trạng thái" },
    { key: "total_did", label: "CID" },
    { key: "total_minutes", label: "Số phút" },
    { key: "total_price", label: "Tổng giá" },
    { key: "progress", label: "Lưu lượng cuộc gọi" },
    { key: "payment_progress", label: "Thanh toán" },
  ];

  const hasActionColumn = onEdit || onDelete;
  const getCurrentMonthYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Xử lý chọn tháng và năm
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(
    getCurrentMonthYear()
  );

  const { data: dataTotalPrice, isLoading: isLoadingTotalPrice } = useApi(
    () => subscriptionService.getTotalPrice(selectedMonthYear),
    [selectedMonthYear]
  );

  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string, subListPlan: any) => {
    if (subListPlan.list_sub_plan.length === 0) return;
    setOpenRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatNumberVN = (value: number) => {
    if (value == null) return "";
    return value.toLocaleString("vi-VN");
  };

  const checkPayment = (data: any) => {
    const { main_sub, list_sub_plan } = data;

    // Filter status = 0
    const activeItems = [main_sub, ...(list_sub_plan || [])].filter(
      (item) => item.status !== 0
    );

    // trả về bool
    return activeItems.every((item) => item.is_payment == true);
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

  function calculateUnpaidAmount(item: any) {
    let unpaid = 0;

    // 1. Main Sub
    if (
      item.main_sub &&
      item.main_sub.is_payment === true &&
      item.main_sub.status == 1
    ) {
      unpaid += item.main_sub.price || 0;
    }

    // 2. List Sub Plan
    if (Array.isArray(item.list_sub_plan)) {
      for (const sub of item.list_sub_plan) {
        if (sub.is_payment === true && sub.status == 1) {
          unpaid += sub.price || 0;
        }
      }
    }

    return unpaid;
  }

  const data = dataRaw.map((item) => {
    return {
      ...item,
      paid_amount: calculateUnpaidAmount(item),
    };
  });

  const handleMonthYearChange = (value: string) => {
    setSelectedMonthYear(value);
    console.log("Selected month/year:", value);
  };
  const formatMonthYear = (value: string | undefined) => {
    if (!value) return "";
    const [year, month] = value.split("-");
    return `${month}/${year}`;
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
              {isLoadingTotalPrice
                ? "..."
                : formatCurrency(dataTotalPrice?.data.total_price)}
            </span>
          </div>

          {/* Chưa thanh toán */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-500/10">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
              Chưa thanh toán:
            </span>
            <span className="text-sm font-bold text-red-700 dark:text-red-400">
              {isLoadingTotalPrice
                ? "..."
                : formatCurrency(dataTotalPrice?.data.outstanding_amount)}
            </span>
          </div>
        </div>

        {/* Chọn tháng/năm */}
        <div className="relative flex items-center px-2 py-2">
          {/* Icon lịch */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const input = document.getElementById(
                "summary-month-year-input"
              ) as HTMLInputElement;
              input?.showPicker?.() ?? input?.focus();
            }}
            className="flex items-center justify-center p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 dark:bg-gray-800 dark:border dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all">
            <CalendarMonth />
          </button>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatMonthYear(selectedMonthYear)}
          </span>

          {/* Hidden month input */}
          <input
            id="summary-month-year-input"
            type="month"
            value={selectedMonthYear}
            onChange={(e) => handleMonthYearChange(e.target.value)}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
          />
        </div>
      </div>

      {/* Table Container */}
      <motion.div
        className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-black overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="max-h-[600px] overflow-y-auto dark:bg-black">
              <Table className="dark:text-white text-sm">
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
                        className={`px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap`}>
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
                          <p className="text-sm font-medium">No data found</p>
                          <p className="text-xs">
                            No subscriptions match the current filter
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
                              {item.list_sub_plan.length > 0 && (
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
                                className={`px-3 py-4 text-xs text-gray-600 dark:text-gray-300`}>
                                {col.key === "customer_name" ? (
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {item[col.key] || "-"}
                                  </span>
                                ) : col.key === "status" ? (
                                  <StatusBadge status={item.status} />
                                ) : col.key === "payment_progress" ? (
                                  item.status == "1" ? (
                                    <PaymentProcess
                                      current={item.paid_amount}
                                      total={item.total_price}
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      Đã xóa hoặc hết hạn
                                    </span>
                                  )
                                ) : col.key === "total_price" ? (
                                  <span className="font-medium">
                                    {formatCurrency(item[col.key])}
                                  </span>
                                ) : col.key === "released_at" ? (
                                  <span className="font-medium">
                                    {formatDate(item[col.key])}
                                  </span>
                                ) : col.key === "total_minutes" ? (
                                  formatNumberVN(item[col.key])
                                ) : col.key === "list_sub_plan" ? (
                                  <SubPlanSelect
                                    subPlans={item.list_sub_plan}
                                  />
                                ) : col.key === "progress" ? (
                                  item.currentProgress > 0 ? (
                                    <DualProgress
                                      barClassName="h-2"
                                      labelClassName="text-xs"
                                      total={item.totalProgress}
                                      current={item.currentProgress}
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
                                <ActionMenu
                                  item={item}
                                  role={role}
                                  onEdit={onEdit}
                                  onDetail={onDetail}
                                  onDelete={(id) => onDelete?.(id)}
                                  onRenew={(item) => onRenew?.(item)}
                                  onConfirm={(item) => onConfirm?.(item)}
                                />
                              </TableCell>
                            )}
                          </motion.tr>

                          {/* Expanded Row */}
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
                                      subPlans={item.list_sub_plan}
                                      mainSub={item.main_sub}
                                      checkPayment={checkPayment(item)}
                                      onReload={onReload}
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
