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
  useDeploymentOrderById,
  useRejectDeploymentOrder,
  useUpdateDeploymentOrderCustomer,
} from "../../../hooks/api-hooks/v3/useDeploymentOrder";
import { useCustomerList } from "../../../hooks/api-hooks/v3/useCustomer";
import { getCustomers } from "../../../services/customer";
import { formatDate } from "../../../helper/formatDateToISOString";
import { formatCurrency } from "../../../helper/formatCurrency";
import { toDeploymentCustomerSnapshot } from "../../../types/bookingV3";
import type { ICustomer } from "../../../types/customer";
import type {
  IDeploymentOrder,
  IDeploymentOrderItem,
} from "../../../types/deploymentOrder";
import { RootState } from "../../../store";
import { buildDeployOrderPhonesHtml } from "./deployOrderSwal";

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
  if (!value) return "—";
  try {
    return formatDate(value);
  } catch {
    return value;
  }
};

const formatCustomerSales = (
  sales: ICustomer["sales"] | null | undefined,
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

const customerOptionValue = (customer: ICustomer) =>
  `${customer.customer_id}:${customer.contract_id}`;

const matchesCustomerSearch = (customer: ICustomer, q: string) => {
  if (!q) return true;
  return (
    customer.customer_name?.toLowerCase().includes(q) ||
    customer.contract_number?.toLowerCase().includes(q) ||
    (customer.contract_type || "").toLowerCase().includes(q)
  );
};

const toCustomerOption = (customer: ICustomer): AutocompleteOption | null => {
  const customerId = Number(customer.customer_id);
  if (!customerId) return null;
  const name = customer.customer_name?.trim() || `KH #${customerId}`;
  const contract = customer.contract_number?.trim() || "—";
  return {
    label: `${name} (${contract})`,
    value: customerOptionValue(customer),
  };
};

const uniqueCustomerOptions = (items: ICustomer[]): AutocompleteOption[] => {
  const map = new Map<string, AutocompleteOption>();
  items.forEach((item) => {
    const option = toCustomerOption(item);
    if (!option || map.has(option.value)) return;
    map.set(option.value, option);
  });
  return Array.from(map.values());
};

const uniqueCustomersByKey = (items: ICustomer[]): ICustomer[] => {
  const map = new Map<string, ICustomer>();
  items.forEach((item) => {
    const key = customerOptionValue(item);
    if (!key || key.startsWith("0:")) return;
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
};

function InfoRow({
  label,
  value,
  hideIfEmpty = true,
}: {
  label: string;
  value: ReactNode;
  hideIfEmpty?: boolean;
}) {
  const empty =
    value == null || value === "" || value === false || value === "—";
  if (hideIfEmpty && empty) return null;
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-gray-100 py-2.5 last:border-b-0 dark:border-gray-800">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="break-words text-sm font-medium text-gray-900 dark:text-gray-100">
        {empty ? "—" : value}
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
  const [pickedCustomer, setPickedCustomer] = useState<ICustomer | null>(null);
  const [customerCache, setCustomerCache] = useState<ICustomer[]>([]);
  const customerCacheRef = useRef<ICustomer[]>([]);
  const [updateReason, setUpdateReason] = useState("");
  const [saleFilter, setSaleFilter] = useState("");

  const mergeCustomerCache = useCallback((items: ICustomer[]) => {
    if (!items.length) return;
    setCustomerCache((prev) => {
      const map = new Map(
        prev.map((item) => [customerOptionValue(item), item]),
      );
      let changed = false;
      items.forEach((item) => {
        const key = customerOptionValue(item);
        if (!map.has(key)) {
          changed = true;
          map.set(key, item);
        }
      });
      if (!changed) {
        customerCacheRef.current = prev;
        return prev;
      }
      const next = Array.from(map.values());
      customerCacheRef.current = next;
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

  const order = data as IDeploymentOrder | undefined;
  const isPendingStatus =
    String(order?.status || "").toLowerCase() === "pending";
  const canEditCustomer = isPendingStatus;
  const actionBusy =
    confirmMutation.isPending ||
    rejectMutation.isPending ||
    updateCustomerMutation.isPending;

  const saleFilterOptions = useMemo(
    () => [
      { label: "Tất cả sale", value: "" },
      ...users.map((name) => ({ label: name, value: name })),
    ],
    [],
  );

  const customerListParams = useMemo(
    () => ({
      sale:
        user?.role === 1
          ? saleFilter.trim() || undefined
          : saleUsername || undefined,
    }),
    [user?.role, saleUsername, saleFilter],
  );

  const {
    data: customerData,
    isLoading: isCustomerListLoading,
    isFetching: isCustomerListFetching,
  } = useCustomerList(customerListParams, {
    enabled: isOpen && editingCustomer,
  });

  // Merge lại mỗi lần bật edit (kể cả khi react-query trả cùng reference cache)
  useEffect(() => {
    if (!editingCustomer) return;
    mergeCustomerCache(customerData?.items ?? []);
  }, [editingCustomer, customerData?.items, mergeCustomerCache]);

  const customerOptions = useMemo(
    () =>
      uniqueCustomerOptions([...(customerData?.items ?? []), ...customerCache]),
    [customerData?.items, customerCache],
  );

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
    setCustomerCache([]);
    customerCacheRef.current = [];
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
      const apiItems = result.items ?? [];
      // Cập nhật ref ngay để chọn được; merge state chỉ khi có KH mới (tránh loop)
      const map = new Map(
        customerCacheRef.current.map((item) => [
          customerOptionValue(item),
          item,
        ]),
      );
      apiItems.forEach((item) => map.set(customerOptionValue(item), item));
      customerCacheRef.current = Array.from(map.values());
      mergeCustomerCache(apiItems);

      // Filter client theo tên KH / số HĐ / loại HĐ; sale lọc qua param API `sale`
      const qLower = q.toLowerCase();
      const merged = uniqueCustomersByKey([
        ...apiItems,
        ...customerCacheRef.current,
      ]);
      const filtered = q
        ? merged.filter((item) => matchesCustomerSearch(item, qLower))
        : apiItems;
      return uniqueCustomerOptions(filtered);
    },
    [customerListParams, mergeCustomerCache],
  );

  const handleSelectCustomer = (opts: AutocompleteOption[]) => {
    const next = opts.slice(-1);
    setSelectedCustomerOpts(next);
    const value = next[0]?.value;
    if (!value) {
      setPickedCustomer(null);
      return;
    }
    const matched =
      customerCacheRef.current.find(
        (item) => customerOptionValue(item) === value,
      ) || null;
    setPickedCustomer(matched);
  };

  const handleSaveCustomer = async () => {
    if (!orderId || !pickedCustomer) {
      Swal.fire(
        "Thiếu thông tin",
        "Vui lòng chọn khách hàng / hợp đồng.",
        "warning",
      );
      return;
    }

    const snapshot = toDeploymentCustomerSnapshot(pickedCustomer);
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
        "Đã cập nhật thông tin khách/HĐ.",
        "success",
      );
      resetEditState();
      await refetch();
      onSuccess?.();
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        err?.response?.data?.detail || "Không thể cập nhật khách/HĐ.",
        "error",
      );
    }
  };

  const handleConfirm = async () => {
    if (!order || !isPendingStatus) return;

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
    if (!order || !isPendingStatus) return;

    const result = await Swal.fire({
      title: "Từ chối đơn triển khai?",
      html: buildDeployOrderPhonesHtml(order, order.items ?? []),
      input: "textarea",
      inputLabel: "Lý do từ chối (tùy chọn)",
      inputPlaceholder: "Nhập lý do...",
      icon: "warning",
      width: 580,
      showCancelButton: true,
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    try {
      await rejectMutation.mutateAsync({
        orderId: order.id,
        data: { reason: String(result.value || "").trim() || null },
      });
      await Swal.fire("Thành công", "Đã từ chối đơn triển khai.", "success");
      await refetch();
      onSuccess?.();
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        err?.response?.data?.detail || "Không thể từ chối đơn.",
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
                    icon={<FiUser size={14} />}
                    title="Khách hàng & hợp đồng"
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
                            user?.role === 1 ? "lg:grid-cols-2" : ""
                          }`}>
                          {user?.role === 1 ? (
                            <div>
                              <Label>Lọc theo sale</Label>
                              <Select
                                options={saleFilterOptions}
                                value={saleFilter}
                                onChange={handleSaleFilterChange}
                                placeholder="Tất cả sale"
                                className="dark:bg-gray-900 dark:text-white"
                              />
                            </div>
                          ) : null}
                          <div className={user?.role === 1 ? "" : undefined}>
                            <Label>Chọn khách hàng / hợp đồng</Label>
                            <AutocompleteMultiple
                              options={customerOptions}
                              value={selectedCustomerOpts}
                              onChange={handleSelectCustomer}
                              fetchOptions={fetchCustomerOptions}
                              placeholder={
                                customersLoading
                                  ? "Đang tải danh sách khách hàng..."
                                  : "Tìm theo tên KH hoặc số HĐ..."
                              }
                              disabled={customersLoading}
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
                              <Label>Số hợp đồng</Label>
                              <Input
                                type="text"
                                disabled
                                disabledWhite
                                value={pickedCustomer.contract_number || ""}
                                placeholder="—"
                              />
                            </div>
                            <div>
                              <Label>Loại HĐ</Label>
                              <Input
                                type="text"
                                disabled
                                disabledWhite
                                value={pickedCustomer.contract_type || ""}
                                placeholder="—"
                              />
                            </div>
                            <div>
                              <Label>No charge</Label>
                              <Input
                                type="text"
                                disabled
                                disabledWhite
                                value={
                                  pickedCustomer.no_charge ? "Có" : "Không"
                                }
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
                              <Label>Ghi chú HĐ</Label>
                              <Input
                                type="text"
                                disabled
                                disabledWhite
                                value={pickedCustomer.contract_note || ""}
                                placeholder="—"
                              />
                            </div>
                          </div>
                        ) : null}
                        <div>
                          <Label>Lý do đổi (tùy chọn)</Label>
                          <TextArea
                            value={updateReason}
                            onChange={(value) => setUpdateReason(value)}
                            placeholder="Nhập lý do đổi khách/HĐ..."
                            size="sm"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={
                            !pickedCustomer || updateCustomerMutation.isPending
                          }
                          onClick={handleSaveCustomer}
                          className="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
                          {updateCustomerMutation.isPending
                            ? "Đang lưu..."
                            : "Lưu khách/HĐ"}
                        </button>
                      </div>
                    ) : (
                      <dl>
                        <InfoRow
                          label="Khách hàng"
                          value={order.customer_name}
                          hideIfEmpty={false}
                        />
                        <InfoRow
                          label="Số hợp đồng"
                          value={order.contract_number}
                          hideIfEmpty={false}
                        />
                        <InfoRow label="Loại HĐ" value={order.contract_type} />
                        <InfoRow label="MST" value={order.tax_code} />
                        <InfoRow
                          label="No charge"
                          value={order.no_charge ? "Có" : "Không"}
                          hideIfEmpty={false}
                        />
                        <InfoRow label="Ghi chú" value={order.contract_note} />
                      </dl>
                    )}
                  </Section>
                </div>

                <div
                  className={`h-full ${
                    editingCustomer ? "lg:col-span-2" : ""
                  }`}>
                  <Section
                    icon={<FiFileText size={14} />}
                    title="Thông tin đơn">
                    <dl>
                      <InfoRow
                        label="Sale"
                        value={order.sale_username}
                        hideIfEmpty={false}
                      />
                      <InfoRow
                        label="Người tạo"
                        value={order.created_by}
                        hideIfEmpty={false}
                      />
                      <InfoRow
                        label="Ngày tạo"
                        value={formatDt(order.created_at)}
                        hideIfEmpty={false}
                      />
                      {order.confirmed_at ? (
                        <InfoRow
                          label="Xác nhận"
                          value={`${formatDt(order.confirmed_at)}${
                            order.confirmed_by ? ` · ${order.confirmed_by}` : ""
                          }`}
                        />
                      ) : null}
                      {order.rejected_at ? (
                        <InfoRow
                          label="Từ chối"
                          value={`${formatDt(order.rejected_at)}${
                            order.rejected_by ? ` · ${order.rejected_by}` : ""
                          }`}
                        />
                      ) : null}
                      <InfoRow
                        label="Lý do từ chối"
                        value={order.reject_reason}
                      />
                    </dl>
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
          <button
            type="button"
            disabled={!order || !isPendingStatus || actionBusy}
            onClick={handleReject}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-60 disabled:hover:brightness-100 dark:disabled:bg-gray-700 dark:disabled:text-gray-400 sm:flex-1"
            title="Từ chối">
            <MdOutlineCancel className="text-base" />
            Từ chối
          </button>
          <button
            type="button"
            disabled={!order || !isPendingStatus || actionBusy}
            onClick={handleConfirm}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-60 disabled:hover:brightness-100 dark:disabled:bg-gray-700 dark:disabled:text-gray-400 sm:flex-1"
            title="Xác nhận">
            <GiConfirmed className="text-base" />
            Xác nhận
          </button>
        </div>
      </aside>
    </>,
    document.body,
  );
}
