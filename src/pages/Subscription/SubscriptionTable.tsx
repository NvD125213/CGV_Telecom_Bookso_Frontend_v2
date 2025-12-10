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
      case 3:
        return {
          text: "Đã xóa",
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
  viettelCID,
  isLoading,
  onEdit,
  onDelete,
  onDetail,
  onConfirm,
  onReload,
  onRenew,
  role,
  quotaMonth,
}: {
  dataRaw: any[];
  viettelCID?: any[];
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
    { key: "total_did", label: viettelCID ? "VT_CID / CID" : "CID" },
    { key: "total_minutes", label: "Số phút" },
    { key: "created_at", label: "Ngày tạo" },
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

  const { data: dataTotalPrice, isLoading: isLoadingTotalPrice } = useApi(
    () =>
      subscriptionService.getTotalPrice(quotaMonth || getCurrentMonthYear()),
    [quotaMonth]
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

    const allItems = [main_sub, ...(list_sub_plan || [])];

    return allItems.every((item) => item.is_payment === true);
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
    if (item.main_sub && item.main_sub.is_payment === true) {
      unpaid += item.main_sub.price || 0;
    }

    // 2. List Sub Plan
    if (Array.isArray(item.list_sub_plan)) {
      for (const sub of item.list_sub_plan) {
        if (sub.is_payment === true) {
          unpaid += sub.price || 0;
        }
      }
    }

    return unpaid;
  }

  const data = dataRaw.map((item) => {
    // lookup 2 mảng
    let map;
    if (viettelCID) {
      map = new Map(viettelCID.map((item) => [item.slide, item.viettelCID]));
    }

    const key = item.slide_users || item.slide;

    return {
      ...item,
      paid_amount: calculateUnpaidAmount(item),
      viettelCID: map?.get(key.trim()) ?? null,
    };
  });

  return (
    <div className="space-y-3">
      {/* Summary Cards - Compact */}
      <div className="flex gap-2 justify-end items-center">
        {/* Chọn tháng/năm */}

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
                        className={`px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap ${
                          col.key === "progress" ||
                          col.key === "payment_progress"
                            ? "min-w-[200px]"
                            : ""
                        }`}>
                        {col.key === "progress" ? col.label : col.label}
                      </TableCell>
                    ))}

                    {hasActionColumn && (
                      <TableCell
                        isHeader
                        className="px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300 text-xs !text-center">
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
                        className="py-12 !text-center">
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
                                className={`px-3 py-4 text-xs text-gray-600 dark:text-gray-300 ${
                                  col.key === "progress" ||
                                  col.key === "payment_progress"
                                    ? "min-w-[200px]"
                                    : ""
                                }`}>
                                {col.key === "customer_name" ? (
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {item[col.key] || "-"}
                                  </span>
                                ) : col.key === "created_at" ? (
                                  <span className="font-medium">
                                    {formatDate(item[col.key])}
                                  </span>
                                ) : col.key === "status" ? (
                                  <StatusBadge status={item.status} />
                                ) : col.key === "payment_progress" ? (
                                  <PaymentProcess
                                    current={item.paid_amount}
                                    total={item.total_price}
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
                                    {viettelCID && item.viettelCID != null
                                      ? item.viettelCID +
                                        " / " +
                                        formatNumberVN(item[col.key])
                                      : formatNumberVN(item[col.key])}
                                  </span>
                                ) : col.key === "total_minutes" ? (
                                  formatNumberVN(item[col.key])
                                ) : col.key === "list_sub_plan" ? (
                                  <SubPlanSelect
                                    subPlans={item.list_sub_plan}
                                  />
                                ) : col.key === "progress" ? (
                                  item.totalProgress > 0 ? (
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
                                className="px-3 py-2.5 w-[80px] !text-center"
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
