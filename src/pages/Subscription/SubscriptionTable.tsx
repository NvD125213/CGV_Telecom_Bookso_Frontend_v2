import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
// import TableMobile from "../../mobiles/TableMobile";
import { subscriptionService } from "../../services/subcription";
import { useApi } from "../../hooks/useApi";
import DualProgress from "../../components/progress-bar/DualProgress";
import { formatCurrency } from "../../helper/formatCurrency";
import ActionMenu from "./ActionMenu";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SubPlanSelect from "./SubPlanDropdown";
import { useState, Fragment } from "react";
import { SubPlanTable } from "./SubPlanTable";
import { ChevronDownIcon } from "../../icons";

// Component để hiển thị status với màu sắc - Redesigned
const StatusBadge = ({ status }: { status: number }) => {
  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 1:
        return {
          text: "active",
          className:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 ",
        };
      case 2:
        return {
          text: "pending",
          className:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500 ",
        };
      case 0:
        return {
          text: "deleted",

          className:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500 ",
        };
      default:
        return {
          text: "Không xác định",
          icon: (
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          ),
          className:
            "inline-flex items-center px-3 py-1.5 gap-1.5 rounded-full font-semibold text-xs bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30 shadow-sm",
        };
    }
  };

  const statusDisplay = getStatusDisplay(status);
  return (
    <span className={statusDisplay.className}>
      {statusDisplay.icon}
      {statusDisplay.text}
    </span>
  );
};

export const CustomSubscriptionTable = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onDetail,
  onConfirm,
  role,
}: {
  data: any[];
  isLoading: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (id: string | number) => void;
  onDetail?: (item: any) => void;
  onConfirm?: (id: string | number) => void;
  role?: number;
}) => {
  const columns = [
    {
      key: "customer_name",
      label: "Tên khách hàng",
      minWidth: "min-w-[200px]",
    },
    { key: "total_did", label: "Tổng CID" },
    { key: "total_minutes", label: "Phút gọi" },
    { key: "progress", label: "Lưu lượng", minWidth: "min-w-[200px]" },
    { key: "list_sub_plan", label: "Gói phụ" },
    { key: "total_price", label: "Tổng giá" },
    { key: "root_plan_id", label: "Gói chính" },
    { key: "is_payment", label: "Thanh toán" },
    { key: "username", label: "Sale" },
    { key: "status", label: "Trạng thái" },
  ];

  const hasActionColumn = onEdit || onDelete;
  const totalColumnCount = columns.length + 1 + (hasActionColumn ? 1 : 0);
  const isManyColumns = totalColumnCount > 8;

  const formatNumberVN = (value: number) => {
    if (value == null) return "";
    return value.toLocaleString("vi-VN");
  };

  // Lấy danh sách tổng giá
  const { data: dataTotalPrice, isLoading: isLoadingTotalPrice } = useApi(() =>
    subscriptionService.getTotalPrice()
  );

  // Mở bảng subPlan nếu có
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => {
    setOpenRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  return (
    <div className="space-y-4">
      {/* Total Price Display - Top Right */}
      <div className="flex items-center justify-end gap-3">
        {/* Tổng đã thanh toán */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-green-300 bg-green-50 dark:bg-green-500/10">
          <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
            ĐÃ THANH TOÁN:
          </span>
          <span className="text-base font-bold text-green-700 dark:text-green-400">
            {isLoadingTotalPrice
              ? "..."
              : formatCurrency(dataTotalPrice?.data.total_price)}
          </span>
        </div>

        {/* Tổng chưa thanh toán */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-red-300 bg-red-50 dark:bg-red-500/10">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
            CHƯA THANH TOÁN:
          </span>
          <span className="text-base font-bold text-red-700 dark:text-red-400">
            {isLoadingTotalPrice
              ? "..."
              : formatCurrency(dataTotalPrice?.data.outstanding_amount)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="max-h-[800px] overflow-y-auto dark:bg-black min-w-[1000px] pb-4">
              <Table className="dark:text-white">
                {/* Table Header */}
                <TableHeader>
                  <TableRow>
                    {columns.map((col, idx) => (
                      <TableCell
                        align={
                          ["list_sub_plan", "progress", "total_price"].includes(
                            col.key
                          )
                            ? "left"
                            : "center"
                        }
                        key={`${col.key}-${idx}`}
                        isHeader
                        className={`px-5 ${col.minWidth || ""} ${
                          isManyColumns ? "text-[12px]" : "text-sm"
                        } dark:text-gray-300 py-3 text-base font-semibold text-gray-500`}>
                        {col.label}
                      </TableCell>
                    ))}

                    {hasActionColumn && (
                      <TableCell
                        isHeader
                        className={`px-5 min-w-[120px] ${
                          isManyColumns ? "text-[13px]" : "text-sm"
                        } dark:text-gray-300 py-3 text-base font-semibold text-gray-500 text-center
                        bg-white dark:bg-black`}>
                        Hành động
                      </TableCell>
                    )}
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        {columns.map((col) => (
                          <TableCell
                            key={col.key}
                            className={`px-5 py-3 ${
                              col.minWidth || ""
                            } text-sm text-gray-500 dark:text-gray-300 ${
                              isManyColumns ? "text-[13px]" : "text-sm"
                            }`}>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                        ))}
                        <TableCell className="px-5 py-3 min-w-[200px]">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </TableCell>
                        {hasActionColumn && (
                          <TableCell
                            className={`px-5 py-3 min-w-[120px] ${
                              isManyColumns ? "text-[13px]" : "text-sm"
                            } sticky right-0 bg-white dark:bg-black z-10`}>
                            <div className="flex gap-2 justify-center">
                              <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={totalColumnCount}
                        className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <svg
                            className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-lg font-medium mb-2">
                            Không có dữ liệu
                          </p>
                          <p className="text-sm">
                            Không tìm thấy subscription nào phù hợp với bộ lọc
                            hiện tại
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item, index) => (
                      <Fragment key={`${index}-${Number(item.id)}`}>
                        {/* Row chính */}
                        <TableRow
                          className={`
                          cursor-pointer transition-all duration-200 ease-in-out
                          ${
                            openRows[item.id]
                              ? "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-transparent"
                          }
                        `}
                          onClick={() => toggleRow(item.id)}>
                          {/* Cột đầu tiên với icon expand */}
                          <TableCell
                            align="left"
                            className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <ChevronDownIcon
                                className={`
                                  w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-300
                                  ${
                                    openRows[item.id]
                                      ? "rotate-180"
                                      : "rotate-0"
                                  }
                                `}
                              />

                              <span>{item.customer_name || "-"}</span>
                            </div>
                          </TableCell>

                          {/* Các cột còn lại */}
                          {columns.slice(1).map((col) => (
                            <TableCell
                              align={
                                [
                                  "list_sub_plan",
                                  "progress",
                                  "total_price",
                                ].includes(col.key)
                                  ? "left"
                                  : "center"
                              }
                              key={col.key}
                              className={`px-5 py-3 ${
                                col.minWidth || ""
                              } text-sm text-gray-500 dark:text-gray-300 ${
                                isManyColumns ? "text-[13px]" : "text-sm"
                              }`}>
                              {/* ... render logic cho từng cột giữ nguyên ... */}
                              {col.key === "status" ? (
                                <StatusBadge status={item.status} />
                              ) : col.key === "is_payment" ? (
                                <div className="flex items-center px-1">
                                  {item[col.key] ? (
                                    <CheckIcon className="text-blue-500 pr-2" />
                                  ) : (
                                    <CloseIcon className="text-red-500 pr-2" />
                                  )}
                                </div>
                              ) : col.key === "total_price" ? (
                                formatCurrency(item[col.key])
                              ) : col.key === "total_minutes" ? (
                                formatNumberVN(item[col.key])
                              ) : col.key === "list_sub_plan" ? (
                                <SubPlanSelect subPlans={item.list_sub_plan} />
                              ) : col.key === "progress" ? (
                                item.currentProgress > 0 ? (
                                  <DualProgress
                                    barClassName="h-4"
                                    labelClassName="text-xs"
                                    total={item.totalProgress}
                                    current={item.currentProgress}
                                  />
                                ) : (
                                  <span className="text-gray-400 flex justify-start dark:text-gray-500 text-xs">
                                    Chưa thêm mã trượt
                                  </span>
                                )
                              ) : (
                                item[col.key] || "-"
                              )}
                            </TableCell>
                          ))}

                          {hasActionColumn && (
                            <TableCell
                              className={`px-5 py-3 min-w-[120px] ${
                                isManyColumns ? "text-[13px]" : "text-sm"
                              } bg-white dark:bg-black`}
                              onClick={(e: any) => e.stopPropagation()}>
                              <ActionMenu
                                item={item}
                                role={role}
                                onEdit={onEdit}
                                onDetail={onDetail}
                                onDelete={(id) => onDelete?.(id)}
                                onConfirm={(id) => onConfirm?.(id)}
                              />
                            </TableCell>
                          )}
                        </TableRow>

                        {/* Row con với animation */}
                        <TableRow
                          className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${
                              openRows[item.id]
                                ? "opacity-100"
                                : "opacity-0 h-0"
                            }
                          `}>
                          <TableCell
                            colSpan={totalColumnCount}
                            className={`
                              bg-gradient-to-b from-blue-50/50 to-white 
                              dark:from-blue-950/10 dark:to-gray-900
                              transition-all duration-300 ease-in-out
                              ${
                                openRows[item.id]
                                  ? "p-0 border-b-2 border-blue-200 dark:border-blue-800"
                                  : "p-0 h-0"
                              }
                            `}>
                            <div
                              className={`
                                transform transition-all duration-300 ease-in-out origin-top
                                ${
                                  openRows[item.id]
                                    ? "scale-y-100 opacity-100"
                                    : "scale-y-0 opacity-0 h-0"
                                }
                              `}>
                              {openRows[item.id] && (
                                <div className="animate-slideDown">
                                  <SubPlanTable
                                    subPlans={item.list_sub_plan}
                                    onEdit={(sub: any) =>
                                      console.log("Edit sub plan", sub)
                                    }
                                    onDelete={(subId: any) =>
                                      console.log("Delete sub plan", subId)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
