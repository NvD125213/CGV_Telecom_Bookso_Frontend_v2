import React, { useMemo, useState, useCallback } from "react";
import { Tooltip } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { LabelValueItem } from "../../mobiles/TableMobile";
import { ChevronDownIcon } from "../../icons";
import { formatCurrency } from "../../helper/formatCurrency";
import {
  subscriptionItemService,
  subscriptionService,
} from "../../services/subcription";
import Swal from "sweetalert2";
import { GiConfirmed } from "react-icons/gi";

export interface SubscriptionCardAction {
  icon: React.ReactNode;
  label: string;
  onClick: (id: string) => void;
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  className?: string;
}

export interface SubscriptionMobileRecord {
  id: number | string;
  customer_name?: string;
  username?: string;
  root_plan_id?: string | number | null;
  status?: number;
  total_did?: number;
  total_minutes?: number;
  created_at?: string;
  totalProgress?: number;
  currentProgress?: number;
  total_price?: number;
  main_sub?: Record<string, any>;
  list_sub_plan?: Record<string, any>[];
}

interface CardSubcriptionMobileProps {
  data: LabelValueItem[];
  subscription?: SubscriptionMobileRecord;
  actions?: SubscriptionCardAction[];
  onReload?: () => void | Promise<void>;
  userSub?: string;
  className?: string;
}

const getFieldValue = (data: LabelValueItem[], label: string) => {
  const item = data.find((entry) => entry.label === label);
  if (!item) return "Không có";
  const value = String(item.value ?? "").trim();
  return value || "Không có";
};

const getSubscriptionStatusText = (status: number) => {
  switch (status) {
    case 1:
      return "Hoạt động";
    case 2:
      return "Chờ duyệt";
    case 0:
      return "Hết hạn";
    case 3:
      return "Đã xóa";
    default:
      return "Đã thu hồi";
  }
};

const getStatusBadgeClass = (status: string, theme: string) => {
  switch (status) {
    case "Hoạt động":
      return theme === "dark"
        ? "bg-green-900/40 text-green-300 border-green-700"
        : "bg-green-50 text-green-700 border-green-200";
    case "Chờ duyệt":
      return theme === "dark"
        ? "bg-amber-900/40 text-amber-300 border-amber-700"
        : "bg-amber-50 text-amber-700 border-amber-200";
    case "Hết hạn":
      return theme === "dark"
        ? "bg-gray-700 text-gray-300 border-gray-600"
        : "bg-gray-100 text-gray-600 border-gray-300";
    case "Đã xóa":
    case "Đã thu hồi":
      return theme === "dark"
        ? "bg-red-900/40 text-red-300 border-red-700"
        : "bg-red-50 text-red-700 border-red-200";
    default:
      return theme === "dark"
        ? "bg-gray-700 text-gray-300 border-gray-600"
        : "bg-gray-100 text-gray-600 border-gray-300";
  }
};

const getSubPlanStatusBadge = (status: number, theme: string) => {
  const text = getSubscriptionStatusText(Number(status));
  return `${getStatusBadgeClass(text, theme)} text-[10px] px-2 py-0.5`;
};

const getActionButtonStyle = (
  color?: SubscriptionCardAction["color"],
  theme?: string,
) => {
  const baseStyle =
    theme === "dark"
      ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
      : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200";

  switch (color) {
    case "primary":
      return theme === "dark"
        ? "bg-blue-900/30 text-blue-400 border-blue-700 hover:bg-blue-900/50"
        : "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200";
    case "error":
      return theme === "dark"
        ? "bg-red-900/30 text-red-400 border-red-700 hover:bg-red-900/50"
        : "bg-red-100 text-red-600 border-red-300 hover:bg-red-200";
    case "info":
      return theme === "dark"
        ? "bg-cyan-900/30 text-cyan-400 border-cyan-700 hover:bg-cyan-900/50"
        : "bg-cyan-100 text-cyan-600 border-cyan-300 hover:bg-cyan-200";
    case "success":
      return theme === "dark"
        ? "bg-green-900/30 text-green-400 border-green-700 hover:bg-green-900/50"
        : "bg-green-100 text-green-600 border-green-300 hover:bg-green-200";
    case "warning":
      return theme === "dark"
        ? "bg-amber-900/30 text-amber-400 border-amber-700 hover:bg-amber-900/50"
        : "bg-amber-100 text-amber-600 border-amber-300 hover:bg-amber-200";
    default:
      return baseStyle;
  }
};

const formatNumberVN = (value?: number | null) => {
  if (value == null) return "0";
  return Number(value).toLocaleString("vi-VN");
};

const formatSubDate = (date?: string) =>
  date
    ? new Date(date).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Không có";

const checkAllPaid = (mainSub?: Record<string, any>, listSubPlan?: any[]) => {
  const countedSubPlans = (listSubPlan || []).filter((s) => {
    const st = Number(s.status);
    return st === 0 || st === 1;
  });
  const allItems = [mainSub, ...countedSubPlans].filter(Boolean);
  return allItems.every((item) => item?.is_payment === true);
};

const calculatePaidAmount = (mainSub?: Record<string, any>, listSubPlan?: any[]) => {
  let paid = 0;
  if (mainSub?.is_payment === true) {
    paid += mainSub.price || 0;
  }
  if (Array.isArray(listSubPlan)) {
    for (const sub of listSubPlan) {
      const st = Number(sub.status);
      if (st !== 0 && st !== 1) continue;
      if (sub.is_payment === true) {
        paid += sub.price || 0;
      }
    }
  }
  return paid;
};

interface SubPlanMiniCardProps {
  plan: Record<string, any> & { type: "main" | "sub" };
  theme: string;
  checkPayment: boolean;
  canConfirm: boolean;
  onConfirm: () => void;
}

const SubPlanMiniCard: React.FC<SubPlanMiniCardProps> = ({
  plan,
  theme,
  checkPayment,
  canConfirm,
  onConfirm,
}) => {
  const deploymentLabel =
    plan.status === 2
      ? "Chưa triển khai"
      : plan.status === 0
        ? "Đã thu hồi"
        : formatSubDate(plan.released_at);

  return (
    <div
      className={`rounded-xl border p-3 ${
        theme === "dark"
          ? "border-gray-700 bg-gray-800/60"
          : "border-gray-200 bg-gray-50"
      }`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {plan.name || "Không có"}
          </p>
          <span
            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              plan.type === "main"
                ? theme === "dark"
                  ? "bg-blue-900/40 text-blue-300"
                  : "bg-blue-100 text-blue-700"
                : theme === "dark"
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-600"
            }`}>
            {plan.type === "main" ? "Gói chính" : "Gói phụ"}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full border font-medium ${getSubPlanStatusBadge(Number(plan.status), theme)}`}>
          {getSubscriptionStatusText(Number(plan.status))}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
        <div>
          <span className="text-gray-500 dark:text-gray-400">CID: </span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {formatNumberVN(plan.cid)}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Phút: </span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {formatNumberVN(plan.minutes)}
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-gray-400">Giá: </span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {formatCurrency(plan.price || 0)}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">TT: </span>
          <span
            className={`font-medium ${
              plan.is_payment
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-600 dark:text-red-400"
            }`}>
            {plan.is_payment ? "Đã TT" : "Chưa TT"}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Triển khai: </span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {deploymentLabel}
          </span>
        </div>
      </div>

      {checkPayment === false && canConfirm && !plan.is_payment && (
        <button
          type="button"
          onClick={onConfirm}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50">
          <GiConfirmed className="h-4 w-4" />
          Xác nhận thanh toán
        </button>
      )}
    </div>
  );
};

export const CardSubcriptionMobile: React.FC<CardSubcriptionMobileProps> = ({
  data,
  subscription,
  actions = [],
  onReload,
  userSub = "",
  className = "",
}) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const itemId = String(
    subscription?.id ?? data.find((entry) => entry.label === "ID")?.value ?? "",
  );

  const mainSub = subscription?.main_sub;
  const listSubPlan = subscription?.list_sub_plan;
  const canExpand = (listSubPlan?.length ?? 0) > 0;

  const mergedPlans = useMemo((): Array<
    Record<string, any> & { type: "main" | "sub" }
  > => {
    if (!mainSub) return [];
    const subPlans = (listSubPlan ?? []) as Record<string, any>[];
    const mainPlan: Record<string, any> & { type: "main" } = {
      ...mainSub,
      type: "main",
    };
    const subPlanItems = subPlans.map(
      (p): Record<string, any> & { type: "sub" } => ({
        ...p,
        type: "sub",
      }),
    );
    return [mainPlan, ...subPlanItems];
  }, [mainSub, listSubPlan]);

  const allPaid = checkAllPaid(mainSub, listSubPlan);
  const canConfirmSubPlan =
    !allPaid && (userSub === "VANLTT" || userSub === "HUYLQ");

  const paid = subscription
    ? calculatePaidAmount(mainSub, listSubPlan)
    : 0;
  const totalPrice = subscription?.total_price ?? 0;

  const customerName =
    subscription?.customer_name || getFieldValue(data, "Khách hàng");
  const status =
    subscription != null
      ? getSubscriptionStatusText(Number(subscription.status))
      : getFieldValue(data, "Trạng thái");
  const payment = subscription
    ? `${formatCurrency(paid)} / ${formatCurrency(totalPrice)}`
    : getFieldValue(data, "Thanh toán");

  const detailRows = subscription
    ? [
        { label: "Sales", value: subscription.username || "Không có" },
        { label: "Gói chính", value: String(subscription.root_plan_id ?? "Không có") },
        {
          label: "CID",
          value: formatNumberVN(subscription.total_did),
        },
        {
          label: "Số phút",
          value: formatNumberVN(subscription.total_minutes),
        },
        { label: "Ngày tạo", value: formatSubDate(subscription.created_at) },
        {
          label: "Lưu lượng",
          value:
            (subscription.totalProgress ?? 0) > 0
              ? `${formatNumberVN(subscription.currentProgress)} / ${formatNumberVN(subscription.totalProgress)} phút`
              : "Không có dữ liệu",
        },
      ]
    : [
        "Sales",
        "Gói chính",
        "CID",
        "Số phút",
        "Ngày tạo",
        "Lưu lượng",
      ].map((label) => ({ label, value: getFieldValue(data, label) }));

  const handleConfirmSubPlan = useCallback(
    async (plan: Record<string, any> & { type: "main" | "sub" }) => {
      if (plan.is_payment) {
        Swal.fire({
          icon: "info",
          title: "Đã thanh toán",
          text: "Gói này đã được thanh toán trước đó!",
        });
        return;
      }

      const result = await Swal.fire({
        title: "Xác nhận thanh toán",
        text: `Bạn có chắc chắn muốn xác nhận thanh toán gói ${plan.name} không?`,
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
          plan.type === "main" ? subscriptionService : subscriptionItemService;
        const res = await service.update(plan.id, { is_payment: true });

        if (res?.status === 200) {
          Swal.fire("Đã xác nhận!", "Thanh toán thành công.", "success");
          await onReload?.();
        } else {
          Swal.fire("Lỗi", "Không thể xác nhận thanh toán.", "error");
        }
      } catch (error: any) {
        Swal.fire(
          "Lỗi",
          error?.response?.data?.detail || "Xảy ra lỗi",
          "error",
        );
      }
    },
    [onReload],
  );

  const toggleExpand = () => {
    if (!canExpand) return;
    setExpanded((prev) => !prev);
  };

  return (
    <div className={`mb-3 px-1 sm:px-0 ${className}`}>
      <div
        className={`rounded-2xl border shadow-sm transition-shadow hover:shadow-md ${
          theme === "dark"
            ? "border-gray-700 bg-gray-900"
            : "border-gray-200 bg-white"
        }`}>
        <div className="p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Khách hàng
              </p>
              <h3 className="mt-1 break-words text-lg font-bold text-gray-900 dark:text-white">
                {customerName}
              </h3>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(status, theme)}`}>
              {status}
            </span>
          </div>

          <div className="space-y-2.5">
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 last:pb-0 dark:border-gray-800">
                <span className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                  {row.label}
                </span>
                <span className="max-w-[58%] break-words text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                  {row.value}
                </span>
              </div>
            ))}
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
            <p className="mt-1 text-sm font-bold text-indigo-900 dark:text-indigo-100">
              {payment}
            </p>
          </div>

          {canExpand && (
            <div className="mt-4">
              <button
                type="button"
                onClick={toggleExpand}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700/80"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}>
                <span>
                  Danh sách gói ({mergedPlans.length})
                </span>
                <motion.span
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex">
                  <ChevronDownIcon className="h-4 w-4" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden">
                    <div className="mt-3 space-y-2">
                      {mergedPlans.map((plan, index) => (
                        <SubPlanMiniCard
                          key={`sub-plan-${itemId}-${plan.type}-${index}`}
                          plan={plan}
                          theme={theme}
                          checkPayment={allPaid}
                          canConfirm={canConfirmSubPlan}
                          onConfirm={() => handleConfirmSubPlan(plan)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {actions.length > 0 && (
            <div
              className={`mt-4 flex flex-wrap justify-end gap-2 border-t pt-4 ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}>
              {actions.map((action, index) => (
                <Tooltip key={index} title={action.label} arrow>
                  <button
                    type="button"
                    onClick={() => action.onClick(itemId)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 ${getActionButtonStyle(action.color, theme)} ${action.className || ""}`}>
                    {action.icon}
                  </button>
                </Tooltip>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CardSubcriptionMobileListProps {
  data: LabelValueItem[][];
  subscriptions?: SubscriptionMobileRecord[];
  actions?: SubscriptionCardAction[];
  onReload?: () => void | Promise<void>;
  userSub?: string;
  className?: string;
}

export const CardSubcriptionMobileList: React.FC<
  CardSubcriptionMobileListProps
> = ({
  data,
  subscriptions = [],
  actions = [],
  onReload,
  userSub = "",
  className = "",
}) => {
  if (!data.length) return null;

  return (
    <div className={className}>
      {data.map((row, index) => {
        const rowId = String(
          row.find((entry) => entry.label === "ID")?.value ?? index,
        );
        const subscription = subscriptions[index];

        return (
          <CardSubcriptionMobile
            key={rowId}
            data={row}
            subscription={subscription}
            actions={actions}
            onReload={onReload}
            userSub={userSub}
          />
        );
      })}
    </div>
  );
};
