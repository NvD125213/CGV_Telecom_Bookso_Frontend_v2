import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { FiClipboard, FiEdit2, FiFileText, FiUser, FiX } from "react-icons/fi";
import { GiConfirmed } from "react-icons/gi";
import { MdOutlineCancel } from "react-icons/md";
import { HiOutlineDocumentText } from "react-icons/hi";
import Swal from "sweetalert2";
import AutocompleteMultiple, {
  Option as AutocompleteOption,
} from "../../../components/ui/autocomplete/auto-complete";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Select from "../../../components/form/Select";
import { useIsMobile } from "../../../hooks/useScreenSize";
import { users } from "../../../constants/user";
import {
  useConfirmDeploymentOrder,
  useDenyRejectDeploymentOrder,
  useDeploymentOrderById,
  useRejectDeploymentOrder,
  useUpdateDeploymentOrderCustomer,
} from "../../../hooks/api-hooks/v3/useDeploymentOrder";
import { useCustomerList } from "../../../hooks/api-hooks/v3/useCustomer";
import { getCustomers } from "../../../services/customer";
import { formatDate } from "../../../helper/formatDateToISOString";
import { formatCurrency } from "../../../helper/formatCurrency";
import { toDeploymentCustomerSnapshotFromGrouped } from "../../../types/bookingV3";
import type {
  ICustomerSsAccount,
  IGroupedCustomer,
} from "../../../types/customer";
import type {
  IDeploymentOrder,
  IDeploymentOrderItem,
} from "../../../types/deploymentOrder";
import { RootState } from "../../../store";
import { buildDeployOrderPhonesHtml } from "./deployOrderSwal";
import { groupDataCustomer } from "../../../helper/group-data-customer";

type Props = {
  isOpen: boolean;
  orderId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const statusLabel = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "Chờ xử lý";
    case "reject_requested":
      return "Chờ duyệt hủy";
    case "confirmed":
      return "Đã xác nhận";
    case "rejected":
      return "Từ chối";
    case "cancelled":
      return "Đã hủy";
    default:
      return status || "—";
  }
};

const statusClass = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50";
    case "reject_requested":
      return "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:ring-orange-900/50";
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50";
    case "rejected":
      return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900/50";
    case "cancelled":
      return "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700";
    default:
      return "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700";
  }
};

const formatDt = (value?: string | null) => {
  if (!value) return "Chưa có";
  try {
    return formatDate(value);
  } catch {
    return value || "Chưa có";
  }
};

const formatCustomerSales = (
  sales: IGroupedCustomer["sales"] | null | undefined,
  saleUsername?: string | null,
): string => {
  if (Array.isArray(sales) && sales.length > 0) {
    return sales
      .map((s) =>
        typeof s === "string"
          ? s
          : String(s?.username || s?.full_name || "").trim(),
      )
      .filter(Boolean)
      .join(", ");
  }
  return saleUsername?.trim() || "";
};

const toSsPickOptions = (
  customer: IGroupedCustomer,
  q = "",
): AutocompleteOption[] => {
  const customerId = Number(customer.customer_id);
  if (!customerId) return [];
  const name = customer.customer_name?.trim() || `KH #${customerId}`;
  const qLower = q.trim().toLowerCase();
  const nameMatch = !qLower || name.toLowerCase().includes(qLower);

  return (customer.ss_accounts ?? [])
    .filter((account) => {
      if (nameMatch) return true;
      return [account.name, account.description, account.display_account]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(qLower);
    })
    .map((account) => ({
      label: [name, account.name || "—", account.description || "—"].join(
        " · ",
      ),
      value: `${customerId}:${account.account_id}`,
    }));
};

const parseSsOptionValue = (value: string) => {
  const [customerId, accountId] = value.split(":");
  return {
    customerId: Number(customerId),
    accountId: Number(accountId),
  };
};

const matchesGroupedCustomerSearch = (
  customer: IGroupedCustomer,
  q: string,
) => {
  if (!q) return true;
  const qLower = q.toLowerCase();
  if (customer.customer_name?.toLowerCase().includes(qLower)) return true;
  if ((customer.tax_code || "").toLowerCase().includes(qLower)) return true;
  return (customer.ss_accounts ?? []).some(
    (a) =>
      (a.name || "").toLowerCase().includes(qLower) ||
      (a.description || "").toLowerCase().includes(qLower) ||
      (a.display_account || "").toLowerCase().includes(qLower),
  );
};

const EMPTY_DISPLAY = "Chưa có";

const isEmptyValue = (value: ReactNode) =>
  value == null ||
  value === "" ||
  value === false ||
  value === "—" ||
  value === EMPTY_DISPLAY;

/**
 * Thời gian + người thao tác.
 * @param byLabel ví dụ "Xác nhận bởi", "Yêu cầu hủy bởi", "Từ chối bởi"
 */
const formatActorDt = (
  at?: string | null,
  by?: string | null,
  byLabel?: string,
) => {
  const actor = by?.trim();
  if (!at && !actor) return EMPTY_DISPLAY;

  const dt = at ? formatDt(at) : null;
  const actorPart = actor
    ? byLabel?.trim()
      ? `${byLabel.trim()} ${actor}`
      : actor
    : null;

  if (dt && actorPart) return `${dt} · ${actorPart}`;
  return dt || actorPart || EMPTY_DISPLAY;
};

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  const empty = isEmptyValue(value);
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-gray-100 py-2.5 last:border-b-0 dark:border-gray-800">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd
        className={`break-words text-sm font-medium ${
          empty
            ? "text-gray-400 dark:text-gray-500"
            : "text-gray-900 dark:text-gray-100"
        }`}>
        {empty ? EMPTY_DISPLAY : value}
      </dd>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
  action,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex h-full flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3.5 py-2.5 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-brand-500">{icon}</span>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-3.5 py-1">{children}</div>
    </section>
  );
}

export default function DeployOrderDetailModal({
  isOpen,
  orderId,
  onClose,
  onSuccess,
}: Props) {
  const isMobile = useIsMobile(768);
  const user = useSelector((state: RootState) => state.auth?.user);
  const saleUsername = String(user?.sub || "");

  const [editingCustomer, setEditingCustomer] = useState(false);
  const [selectedCustomerOpts, setSelectedCustomerOpts] = useState<
    AutocompleteOption[]
  >([]);
  const [pickedCustomer, setPickedCustomer] = useState<IGroupedCustomer | null>(
    null,
  );
  const [pickedAccount, setPickedAccount] = useState<ICustomerSsAccount | null>(
    null,
  );
  const [groupedCache, setGroupedCache] = useState<IGroupedCustomer[]>([]);
  const groupedCacheRef = useRef<IGroupedCustomer[]>([]);
  const [updateReason, setUpdateReason] = useState("");
  const [saleFilter, setSaleFilter] = useState("");

  const mergeGroupedCache = useCallback((items: IGroupedCustomer[]) => {
    if (!items.length) return;
    setGroupedCache((prev) => {
      const map = new Map(prev.map((item) => [String(item.customer_id), item]));
      let changed = false;
      items.forEach((item) => {
        const key = String(item.customer_id);
        if (!map.has(key)) {
          changed = true;
          map.set(key, item);
        } else {
          // Merge contracts / accounts nếu đã có
          const existing = map.get(key)!;
          const contractIds = new Set(
            existing.contracts.map((c) => c.contract_id),
          );
          const accountIds = new Set(
            existing.ss_accounts.map((a) => a.account_id),
          );
          let localChanged = false;
          item.contracts.forEach((c) => {
            if (!contractIds.has(c.contract_id)) {
              existing.contracts.push(c);
              contractIds.add(c.contract_id);
              localChanged = true;
            }
          });
          item.ss_accounts.forEach((a) => {
            if (!accountIds.has(a.account_id)) {
              existing.ss_accounts.push(a);
              accountIds.add(a.account_id);
              localChanged = true;
            }
          });
          if (localChanged) changed = true;
        }
      });
      if (!changed) {
        groupedCacheRef.current = prev;
        return prev;
      }
      const next = Array.from(map.values());
      groupedCacheRef.current = next;
      return next;
    });
  }, []);

  const { data, isLoading, isFetching, refetch } = useDeploymentOrderById(
    orderId ?? undefined,
    { enabled: isOpen && typeof orderId === "number" },
  );
  const updateCustomerMutation = useUpdateDeploymentOrderCustomer();
  const confirmMutation = useConfirmDeploymentOrder();
  const rejectMutation = useRejectDeploymentOrder();
  const denyRejectMutation = useDenyRejectDeploymentOrder();

  const order = data as IDeploymentOrder | undefined;
  const isAdmin = Number(user?.role) === 1;
  const orderStatus = String(order?.status || "").toLowerCase();
  const isPendingStatus = orderStatus === "pending";
  const isRejectRequestedStatus = orderStatus === "reject_requested";
  /** Đổi khách/HĐ chỉ admin + đơn pending */
  const canEditCustomer = isAdmin && isPendingStatus;
  const canConfirm = isAdmin && isPendingStatus;
  /** Sale xin hủy / Admin hủy trực tiếp (pending) hoặc duyệt hủy (reject_requested) */
  const canReject = isPendingStatus || (isAdmin && isRejectRequestedStatus);
  /** Sale rút yêu cầu / Admin từ chối yêu cầu hủy */
  const canDenyReject = isRejectRequestedStatus;
  const actionBusy =
    confirmMutation.isPending ||
    rejectMutation.isPending ||
    denyRejectMutation.isPending ||
    updateCustomerMutation.isPending;

  const saleFilterOptions = useMemo(
    () => users.map((name) => ({ label: name, value: name })),
    [],
  );

  const selectedSale = saleFilter.trim();
  const canPickCustomer = isAdmin
    ? Boolean(selectedSale)
    : Boolean(saleUsername);

  const customerListParams = useMemo(
    () => ({
      sale: isAdmin ? selectedSale || undefined : saleUsername || undefined,
    }),
    [isAdmin, saleUsername, selectedSale],
  );

  const {
    data: customerData,
    isLoading: isCustomerListLoading,
    isFetching: isCustomerListFetching,
  } = useCustomerList(customerListParams, {
    enabled: isOpen && editingCustomer && canPickCustomer,
  });

  const groupedFromApi = useMemo(
    () => groupDataCustomer(customerData),
    [customerData],
  );

  // Merge lại mỗi lần bật edit (kể cả khi react-query trả cùng reference cache)
  useEffect(() => {
    if (!editingCustomer) return;
    mergeGroupedCache(groupedFromApi);
  }, [editingCustomer, groupedFromApi, mergeGroupedCache]);

  const customerOptions = useMemo(() => {
    const map = new Map<string, AutocompleteOption>();
    [...groupedFromApi, ...groupedCache].forEach((item) => {
      toSsPickOptions(item).forEach((option) => {
        if (!map.has(option.value)) map.set(option.value, option);
      });
    });
    return Array.from(map.values());
  }, [groupedFromApi, groupedCache]);

  const accountOptions = useMemo(
    () =>
      (pickedCustomer?.ss_accounts ?? []).map((a) => ({
        label: a.display_account || `${a.name} * ${a.description || ""}`,
        value: String(a.account_id),
      })),
    [pickedCustomer],
  );

  const canSaveCustomer = Boolean(pickedCustomer && pickedAccount);

  const customersLoading =
    editingCustomer &&
    (isCustomerListLoading || isCustomerListFetching) &&
    customerOptions.length === 0;

  const items = useMemo(
    () => (order?.items ?? []) as IDeploymentOrderItem[],
    [order?.items],
  );

  const formatFee = (value?: number | null) => {
    if (value == null || Number.isNaN(Number(value))) return "—";
    return formatCurrency(Number(value));
  };

  const clearPickedCustomer = useCallback(() => {
    setSelectedCustomerOpts([]);
    setPickedCustomer(null);
    setPickedAccount(null);
    setGroupedCache([]);
    groupedCacheRef.current = [];
  }, []);

  const resetEditState = useCallback(() => {
    setEditingCustomer(false);
    clearPickedCustomer();
    setUpdateReason("");
    setSaleFilter("");
  }, [clearPickedCustomer]);

  const handleSaleFilterChange = (value: string) => {
    setSaleFilter(value);
    clearPickedCustomer();
  };

  useEffect(() => {
    if (!isOpen) {
      resetEditState();
    }
  }, [isOpen, resetEditState]);

  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);

  const fetchCustomerOptions = useCallback(
    async (query: string) => {
      const q = query.trim();
      const result = await getCustomers({
        ...customerListParams,
        q: q || undefined,
      });
      const grouped = groupDataCustomer(result);
      const map = new Map(
        groupedCacheRef.current.map((item) => [String(item.customer_id), item]),
      );
      grouped.forEach((item) => map.set(String(item.customer_id), item));
      groupedCacheRef.current = Array.from(map.values());
      mergeGroupedCache(grouped);

      const qLower = q.toLowerCase();
      const merged = Array.from(map.values());
      const filtered = q
        ? merged.filter((item) => matchesGroupedCustomerSearch(item, qLower))
        : grouped;
      const seen = new Set<string>();
      const options: AutocompleteOption[] = [];
      filtered.forEach((item) => {
        toSsPickOptions(item, q).forEach((option) => {
          if (seen.has(option.value)) return;
          seen.add(option.value);
          options.push(option);
        });
      });
      return options;
    },
    [customerListParams, mergeGroupedCache],
  );

  const handleSelectCustomer = (opts: AutocompleteOption[]) => {
    const next = opts.slice(-1);
    setSelectedCustomerOpts(next);
    const value = next[0]?.value;
    if (!value) {
      setPickedCustomer(null);
      setPickedAccount(null);
      return;
    }
    const { customerId, accountId } = parseSsOptionValue(value);
    const matched =
      groupedCacheRef.current.find((item) => item.customer_id === customerId) ||
      groupedFromApi.find((item) => item.customer_id === customerId) ||
      null;
    setPickedCustomer(matched);
    setPickedAccount(
      matched?.ss_accounts.find(
        (account) => account.account_id === accountId,
      ) || null,
    );
  };

  const handleSaveCustomer = async () => {
    if (!orderId || !pickedCustomer || !pickedAccount) {
      Swal.fire(
        "Thiếu thông tin",
        "Vui lòng chọn sale, rồi chọn khách hàng kèm mã SS.",
        "warning",
      );
      return;
    }

    const snapshot = toDeploymentCustomerSnapshotFromGrouped(
      pickedCustomer,
      pickedAccount,
    );
    try {
      await updateCustomerMutation.mutateAsync({
        orderId,
        data: {
          ...snapshot,
          reason: updateReason.trim() || null,
        },
      });
      await Swal.fire(
        "Thành công",
        "Đã cập nhật thông tin khách/SS.",
        "success",
      );
      resetEditState();
      await refetch();
      onSuccess?.();
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        err?.response?.data?.detail || "Không thể cập nhật khách/SS.",
        "error",
      );
    }
  };

  const handleConfirm = async () => {
    if (!isAdmin || !order || !isPendingStatus) return;

    const result = await Swal.fire({
      title: "Xác nhận đơn triển khai?",
      html: buildDeployOrderPhonesHtml(order, order.items ?? []),
      icon: "question",
      width: 580,
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;

    try {
      await confirmMutation.mutateAsync(order.id);
      await Swal.fire("Thành công", "Đã xác nhận đơn triển khai.", "success");
      await refetch();
      onSuccess?.();
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        err?.response?.data?.detail || "Không thể xác nhận đơn.",
        "error",
      );
    }
  };

  const handleReject = async () => {
    if (!order) return;

    if (isPendingStatus) {
      const reasonRequired = !isAdmin;
      const result = await Swal.fire({
        title: isAdmin ? "Từ chối đơn triển khai?" : "Xin hủy đơn triển khai?",
        html: buildDeployOrderPhonesHtml(order, order.items ?? []),
        input: "textarea",
        inputLabel: reasonRequired
          ? "Lý do xin hủy (bắt buộc)"
          : "Lý do từ chối (tùy chọn)",
        inputPlaceholder: "Nhập lý do...",
        inputValidator: reasonRequired
          ? (value) => {
              if (!String(value || "").trim()) {
                return "Vui lòng nhập lý do xin hủy.";
              }
              return null;
            }
          : undefined,
        icon: "warning",
        width: 580,
        showCancelButton: true,
        confirmButtonText: isAdmin ? "Từ chối" : "Gửi yêu cầu hủy",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#d33",
      });
      if (!result.isConfirmed) return;

      try {
        await rejectMutation.mutateAsync({
          orderId: order.id,
          data: { reason: String(result.value || "").trim() || null },
        });
        await Swal.fire(
          "Thành công",
          isAdmin
            ? "Đã từ chối đơn triển khai."
            : "Đã gửi yêu cầu hủy. Chờ admin duyệt.",
          "success",
        );
        await refetch();
        onSuccess?.();
      } catch (err: any) {
        Swal.fire(
          "Oops...",
          err?.response?.data?.detail ||
            (isAdmin ? "Không thể từ chối đơn." : "Không thể gửi yêu cầu hủy."),
          "error",
        );
      }
      return;
    }

    if (isRejectRequestedStatus && isAdmin) {
      const reasonNote = order.reject_reason
        ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280"><b>Lý do sale xin hủy:</b> ${String(order.reject_reason).replace(/</g, "&lt;")}</p>`
        : "";
      const result = await Swal.fire({
        title: "Duyệt hủy đơn?",
        html: `${buildDeployOrderPhonesHtml(order, order.items ?? [])}${reasonNote}`,
        icon: "warning",
        width: 580,
        showCancelButton: true,
        confirmButtonText: "Duyệt hủy (trả số về kho)",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#d33",
      });
      if (!result.isConfirmed) return;

      try {
        await rejectMutation.mutateAsync({ orderId: order.id, data: {} });
        await Swal.fire(
          "Thành công",
          "Đã duyệt hủy đơn. Số đã về kho.",
          "success",
        );
        await refetch();
        onSuccess?.();
      } catch (err: any) {
        Swal.fire(
          "Oops...",
          err?.response?.data?.detail || "Không thể duyệt hủy đơn.",
          "error",
        );
      }
    }
  };

  const handleDenyReject = async () => {
    if (!order || !isRejectRequestedStatus) return;

    const isWithdraw = !isAdmin;
    const result = await Swal.fire({
      title: isWithdraw ? "Rút yêu cầu hủy?" : "Từ chối yêu cầu hủy?",
      text: isWithdraw
        ? "Đơn sẽ quay về trạng thái chờ xử lý."
        : "Giữ đơn và số đang pending_deploy. Đơn quay về chờ xử lý.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isWithdraw ? "Rút yêu cầu" : "Từ chối yêu cầu",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;

    try {
      await denyRejectMutation.mutateAsync(order.id);
      await Swal.fire(
        "Thành công",
        isWithdraw
          ? "Đã rút yêu cầu hủy. Đơn về chờ xử lý."
          : "Đã từ chối yêu cầu hủy. Đơn về chờ xử lý.",
        "success",
      );
      await refetch();
      onSuccess?.();
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        err?.response?.data?.detail || "Không thể xử lý yêu cầu hủy.",
        "error",
      );
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={!isOpen ? undefined : onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[101] flex h-dvh max-h-dvh w-full flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          isMobile ? "max-w-full" : "max-w-4xl"
        } ${isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"}`}
        aria-hidden={!isOpen}>
        <div className="shrink-0 border-b border-gray-200 bg-gray-50/80 px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
                <HiOutlineDocumentText size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                  Quản lý dịch vụ
                </p>
                <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                  Chi tiết đơn triển khai
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Mã đơn #{orderId ?? "—"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-200/70 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Đóng">
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50/40 p-4 dark:bg-gray-950/20 sm:p-5">
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <p className="text-sm text-gray-500">Đang tải chi tiết...</p>
            </div>
          ) : !order ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-gray-500">
                Không tìm thấy đơn triển khai.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
                <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700">
                  {order.item_count ?? items.length} số điện thoại
                </span>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                <div
                  className={`h-full ${
                    editingCustomer ? "lg:col-span-2" : ""
                  }`}>
                  <Section
                    icon={<FiFileText size={14} />}
                    title="Thông tin đơn">
                    <div
                      className={
                        editingCustomer
                          ? "grid grid-cols-1 gap-x-6 sm:grid-cols-2"
                          : undefined
                      }>
                      <dl>
                        <InfoRow label="Sale" value={order.sale_username} />
                        <InfoRow label="Người tạo" value={order.created_by} />
                        <InfoRow
                          label="Ngày tạo"
                          value={formatDt(order.created_at)}
                        />
                        <InfoRow
                          label="Hạn xử lý"
                          value={formatDt(order.expires_at)}
                        />
                        <InfoRow
                          label="Đã hết hạn"
                          value={formatDt(order.expired_at)}
                        />
                      </dl>
                      <dl>
                        <InfoRow
                          label="Cảnh báo hết hạn"
                          value={formatDt(order.expire_warned_at)}
                        />
                        <InfoRow
                          label="Xác nhận"
                          value={formatActorDt(
                            order.confirmed_at,
                            order.confirmed_by,
                            "Xác nhận bởi",
                          )}
                        />
                        <InfoRow
                          label="Xin hủy lúc"
                          value={formatActorDt(
                            order.reject_requested_at,
                            order.reject_requested_by,
                            "Yêu cầu hủy bởi",
                          )}
                        />
                        <InfoRow
                          label="Từ chối"
                          value={formatActorDt(
                            order.rejected_at,
                            order.rejected_by,
                            "Từ chối bởi",
                          )}
                        />
                        <InfoRow
                          label="Lý do hủy / từ chối"
                          value={order.reject_reason}
                        />
                      </dl>
                    </div>
                  </Section>
                </div>
                <div
                  className={`h-full ${
                    editingCustomer ? "lg:col-span-2" : ""
                  }`}>
                  <Section
                    icon={<FiUser size={14} />}
                    title="Khách hàng & Softswitch"
                    action={
                      canEditCustomer ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (editingCustomer) {
                              resetEditState();
                              return;
                            }
                            setEditingCustomer(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/30">
                          <FiEdit2 size={12} />
                          {editingCustomer ? "Hủy đổi" : "Đổi khách hàng"}
                        </button>
                      ) : null
                    }>
                    {editingCustomer ? (
                      <div className="space-y-3 py-2">
                        <div
                          className={`grid grid-cols-1 gap-3 ${
                            user?.role === 1 ? "lg:grid-cols-1" : ""
                          }`}>
                          {isAdmin ? (
                            <div>
                              <Label>Sale *</Label>
                              <Select
                                options={saleFilterOptions}
                                value={saleFilter}
                                onChange={handleSaleFilterChange}
                                placeholder="Chọn sale trước..."
                                className="dark:bg-gray-900 dark:text-white"
                              />
                            </div>
                          ) : null}
                          <div className={isAdmin ? "" : undefined}>
                            <Label>Chọn khách hàng</Label>
                            <AutocompleteMultiple
                              options={canPickCustomer ? customerOptions : []}
                              value={selectedCustomerOpts}
                              onChange={handleSelectCustomer}
                              fetchOptions={
                                canPickCustomer
                                  ? fetchCustomerOptions
                                  : undefined
                              }
                              placeholder={
                                !canPickCustomer
                                  ? "Chọn sale trước..."
                                  : customersLoading
                                    ? "Đang tải danh sách khách hàng..."
                                    : "Tên khách hàng · mã SS · chi tiết SS"
                              }
                              disabled={!canPickCustomer || customersLoading}
                            />
                          </div>
                        </div>
                        {pickedCustomer ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="sm:col-span-2 lg:col-span-3">
                              <Label>Khách hàng</Label>
                              <Input
                                type="text"
                                disabled
                                disabledWhite
                                value={pickedCustomer.customer_name || ""}
                                placeholder="—"
                              />
                            </div>
                            <div>
                              <Label>MST</Label>
                              <Input
                                type="text"
                                disabled
                                disabledWhite
                                value={pickedCustomer.tax_code || ""}
                                placeholder="—"
                              />
                            </div>
                            <div>
                              <Label>Sale</Label>
                              <Input
                                type="text"
                                disabled
                                disabledWhite
                                value={
                                  formatCustomerSales(
                                    pickedCustomer.sales,
                                    pickedCustomer.sale_username,
                                  ) || ""
                                }
                                placeholder="—"
                              />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <Label>Mã Softswitch (SS)</Label>
                              <Select
                                options={accountOptions}
                                value={
                                  pickedAccount
                                    ? String(pickedAccount.account_id)
                                    : ""
                                }
                                onChange={(value) => {
                                  const matched =
                                    pickedCustomer.ss_accounts.find(
                                      (a) => String(a.account_id) === value,
                                    ) || null;
                                  setPickedAccount(matched);
                                }}
                                placeholder={
                                  accountOptions.length
                                    ? "Chọn mã Softwitch"
                                    : "Không có mã SS"
                                }
                                className="dark:bg-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        ) : null}
                        <div>
                          <Label>Lý do đổi (tùy chọn)</Label>
                          <TextArea
                            value={updateReason}
                            onChange={(value) => setUpdateReason(value)}
                            placeholder="Nhập lý do đổi khách/SS..."
                            size="sm"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={
                            !canSaveCustomer || updateCustomerMutation.isPending
                          }
                          onClick={handleSaveCustomer}
                          className="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
                          {updateCustomerMutation.isPending
                            ? "Đang lưu..."
                            : "Lưu khách/SS"}
                        </button>
                      </div>
                    ) : (
                      <dl>
                        <InfoRow
                          label="Mã SS"
                          value={order.name_ss_account || order.name}
                        />
                        <InfoRow
                          label="Chi tiết SS"
                          value={
                            order.description_ss_account || order.description
                          }
                        />
                        <InfoRow
                          label="Khách hàng"
                          value={order.customer_name}
                        />
                        <InfoRow label="MST" value={order.tax_code} />
                      </dl>
                    )}
                  </Section>
                </div>
              </div>

              <Section
                icon={<FiClipboard size={14} />}
                title={`Danh sách số (${items.length})`}>
                <div className="-mx-3.5 overflow-x-auto">
                  {items.length === 0 ? (
                    <p className="px-3.5 py-6 text-center text-sm text-gray-500">
                      Không có số trong đơn.
                    </p>
                  ) : (
                    <table className="min-w-full border-collapse text-left text-xs">
                      <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">
                        <tr>
                          <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                            Số điện thoại
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                            Trạng thái
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                            Nhà cung cấp
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                            Loại số
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                            Telco
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                            Định danh
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                            Phí khởi tạo
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                            Phí duy trì
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                            Phí số đẹp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {items.map((item) => (
                          <tr
                            key={item.id}
                            className="bg-white hover:bg-gray-50/80 dark:bg-gray-900 dark:hover:bg-gray-800/50">
                            <td className="whitespace-nowrap px-3 py-2.5 font-mono text-sm font-medium text-gray-900 dark:text-white">
                              {item.phone_number || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${statusClass(item.status)}`}>
                                {statusLabel(item.status)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-200">
                              {item.provider_name || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-200">
                              {item.type_name || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-200">
                              {item.telco || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-200">
                              {item.brandname_name || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right text-gray-700 dark:text-gray-200">
                              {formatFee(item.installation_fee)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right text-gray-700 dark:text-gray-200">
                              {formatFee(item.maintenance_fee)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right text-gray-700 dark:text-gray-200">
                              {formatFee(item.vanity_number_fee)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Section>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={actionBusy}
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex-1">
            Đóng
          </button>
          {canDenyReject ? (
            <button
              type="button"
              disabled={!order || actionBusy}
              onClick={handleDenyReject}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/60 sm:flex-1"
              title={isAdmin ? "Từ chối yêu cầu hủy" : "Rút yêu cầu hủy"}>
              <MdOutlineCancel className="text-base" />
              {isAdmin ? "Từ chối yêu cầu hủy" : "Rút yêu cầu hủy"}
            </button>
          ) : null}
          {canReject ? (
            <button
              type="button"
              disabled={!order || actionBusy}
              onClick={handleReject}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-60 disabled:hover:brightness-100 dark:disabled:bg-gray-700 dark:disabled:text-gray-400 sm:flex-1"
              title={
                isRejectRequestedStatus
                  ? "Duyệt hủy"
                  : isAdmin
                    ? "Từ chối"
                    : "Xin hủy đơn"
              }>
              <MdOutlineCancel className="text-base" />
              {isRejectRequestedStatus
                ? "Duyệt hủy"
                : isAdmin
                  ? "Từ chối"
                  : "Xin hủy đơn"}
            </button>
          ) : null}
          {isAdmin ? (
            <button
              type="button"
              disabled={!order || !canConfirm || actionBusy}
              onClick={handleConfirm}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-60 disabled:hover:brightness-100 dark:disabled:bg-gray-700 dark:disabled:text-gray-400 sm:flex-1"
              title="Xác nhận">
              <GiConfirmed className="text-base" />
              Xác nhận
            </button>
          ) : null}
        </div>
      </aside>
    </>,
    document.body,
  );
}
