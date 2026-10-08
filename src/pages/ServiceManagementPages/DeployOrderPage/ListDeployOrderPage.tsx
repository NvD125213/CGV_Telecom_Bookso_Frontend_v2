import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useSelector } from "react-redux";
import { FiEye, FiRefreshCw } from "react-icons/fi";
import { GiConfirmed } from "react-icons/gi";
import { MdOutlineCancel } from "react-icons/md";
import Swal from "sweetalert2";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import ReusableTable from "../../../components/common/ReusableTable";
import ResponsiveFilterWrapper from "../../../components/common/FlipperWrapper";
import EmptyState from "../../../components/EmptyData";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import AutocompleteMultiple, {
  Option as AutocompleteOption,
} from "../../../components/ui/autocomplete/auto-complete";
import Pagination from "../../../components/pagination/pagination";
import TableMobile, {
  ActionButton,
  LabelValueItem,
} from "../../../mobiles/TableMobile";
import { useScreenSize } from "../../../hooks/useScreenSize";
import {
  useConfirmDeploymentOrder,
  useDenyRejectDeploymentOrder,
  useDeploymentOrderList,
  useRejectDeploymentOrder,
} from "../../../hooks/api-hooks/v3/useDeploymentOrder";
import { useCustomerList } from "../../../hooks/api-hooks/v3/useCustomer";
import { getCustomers } from "../../../services/customer";
import { getDeploymentOrderById } from "../../../services/deploymentOrder";
import { formatDate } from "../../../helper/formatDateToISOString";
import { users } from "../../../constants/user";
import { RootState } from "../../../store";
import type { ICustomer } from "../../../types/customer";
import type {
  DeploymentOrderStatus,
  IDeploymentOrder,
  IDeploymentOrderItem,
  IDeploymentOrderListParams,
} from "../../../types/deploymentOrder";
import DeployOrderDetailModal from "./DeployOrderDetailModal";
import { buildDeployOrderPhonesHtml } from "./deployOrderSwal";

type DeployOrderRow = IDeploymentOrder & {
  status_label: string;
  created_at_display: string;
  expires_at_display: string;
  reject_request_display: string;
  reject_reason_display: string;
  item_count_display: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Chờ duyệt hủy", value: "reject_requested" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Từ chối", value: "rejected" },
  { label: "Đã hủy", value: "cancelled" },
];

const STATUS_BADGE_BASE =
  "inline-flex max-w-fit shrink-0 items-center whitespace-nowrap px-2.5 py-0.5 justify-center rounded-full font-medium text-theme-xs";

const normalizeStatus = (status?: string) => String(status || "").toLowerCase();

const isPending = (status?: string) => normalizeStatus(status) === "pending";

const isRejectRequested = (status?: string) =>
  normalizeStatus(status) === "reject_requested";

const getStatusLabel = (status?: string) => {
  switch (normalizeStatus(status)) {
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
      return status?.trim() || "—";
  }
};

const getStatusBadgeClass = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "pending":
      return `${STATUS_BADGE_BASE} bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300`;
    case "reject_requested":
      return `${STATUS_BADGE_BASE} bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300`;
    case "confirmed":
      return `${STATUS_BADGE_BASE} bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500`;
    case "rejected":
      return `${STATUS_BADGE_BASE} bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400`;
    case "cancelled":
      return `${STATUS_BADGE_BASE} bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400`;
    default:
      return `${STATUS_BADGE_BASE} bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400`;
  }
};

const EMPTY_DISPLAY = "—";

const formatDt = (value?: string | null) => {
  if (!value) return EMPTY_DISPLAY;
  try {
    return formatDate(value);
  } catch {
    return value || EMPTY_DISPLAY;
  }
};

const formatActorDt = (at?: string | null, by?: string | null) => {
  if (!at && !by?.trim()) return EMPTY_DISPLAY;
  const dt = formatDt(at);
  const actor = by?.trim();
  return actor ? `${dt} · ${actor}` : dt;
};

const parsePage = (params: URLSearchParams) => {
  const page = Number(params.get("page"));
  return page >= 1 ? page : DEFAULT_PAGE;
};

const parseSize = (params: URLSearchParams) => {
  const size = Number(params.get("size"));
  return size >= 1 ? size : DEFAULT_SIZE;
};

const toCustomerIdOption = (customer: ICustomer): AutocompleteOption | null => {
  const customerId = Number(customer.customer_id);
  if (!customerId) return null;
  const name = customer.customer_name?.trim();
  return {
    label: `${name}`,
    value: String(customerId),
  };
};

const toContractIdOption = (customer: ICustomer): AutocompleteOption | null => {
  const contractId = Number(customer.contract_id);
  if (!contractId) return null;
  const contract = customer.contract_number?.trim();
  return {
    label: contract,
    value: String(contractId),
  };
};

const uniqueOptionsByValue = (
  items: AutocompleteOption[],
): AutocompleteOption[] => {
  const map = new Map<string, AutocompleteOption>();
  items.forEach((item) => {
    if (!item.value || map.has(item.value)) return;
    map.set(item.value, item);
  });
  return Array.from(map.values());
};

const ListDeployOrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((state: RootState) => state.auth?.user);
  const saleUsername = String(user?.sub || "");
  const { isMobile } = useScreenSize();

  const [page, setPage] = useState(() => parsePage(searchParams));
  const [size, setSize] = useState(() => parseSize(searchParams));
  const [status, setStatus] = useState(() => searchParams.get("status") || "");
  const [sale, setSale] = useState(() => searchParams.get("sale") || "");
  const initialCustomerId = Number(searchParams.get("customer_id") || 0);
  const initialContractId = Number(searchParams.get("contract_id") || 0);
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<
    AutocompleteOption[]
  >(() =>
    initialCustomerId > 0
      ? [
          {
            label: `KH #${initialCustomerId}`,
            value: String(initialCustomerId),
          },
        ]
      : [],
  );
  const [selectedContractFilter, setSelectedContractFilter] = useState<
    AutocompleteOption[]
  >(() =>
    initialContractId > 0
      ? [
          {
            label: `HĐ #${initialContractId}`,
            value: String(initialContractId),
          },
        ]
      : [],
  );
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  const isAdmin = Number(user?.role) === 1;
  const confirmMutation = useConfirmDeploymentOrder();
  const rejectMutation = useRejectDeploymentOrder();
  const denyRejectMutation = useDenyRejectDeploymentOrder();
  const actionBusy =
    confirmMutation.isPending ||
    rejectMutation.isPending ||
    denyRejectMutation.isPending;

  const customerIdFilter = useMemo(() => {
    const id = Number(selectedCustomerFilter[0]?.value);
    return id > 0 ? id : undefined;
  }, [selectedCustomerFilter]);

  const contractIdFilter = useMemo(() => {
    const id = Number(selectedContractFilter[0]?.value);
    return id > 0 ? id : undefined;
  }, [selectedContractFilter]);

  const customerListParams = useMemo(
    () => ({
      sale: user?.role === 1 ? undefined : saleUsername || undefined,
    }),
    [user?.role, saleUsername],
  );

  const { data: customerData } = useCustomerList({
    ...customerListParams,
    customer_id: customerIdFilter,
  });

  const customerFilterOptions = useMemo(
    () =>
      uniqueOptionsByValue(
        (customerData?.items ?? [])
          .map(toCustomerIdOption)
          .filter((item): item is AutocompleteOption => Boolean(item)),
      ),
    [customerData?.items],
  );

  const contractFilterOptions = useMemo(
    () =>
      uniqueOptionsByValue(
        (customerData?.items ?? [])
          .map(toContractIdOption)
          .filter((item): item is AutocompleteOption => Boolean(item)),
      ),
    [customerData?.items],
  );

  useEffect(() => {
    if (!customerData?.items?.length) return;

    if (customerIdFilter) {
      const matchedCustomer = customerData.items.find(
        (item) => Number(item.customer_id) === customerIdFilter,
      );
      const customerOption = matchedCustomer
        ? toCustomerIdOption(matchedCustomer)
        : null;
      if (customerOption) {
        setSelectedCustomerFilter((prev) => {
          if (
            prev[0]?.value === customerOption.value &&
            prev[0]?.label === customerOption.label
          ) {
            return prev;
          }
          return [customerOption];
        });
      }
    }

    if (contractIdFilter) {
      const matchedContract = customerData.items.find(
        (item) => Number(item.contract_id) === contractIdFilter,
      );
      const contractOption = matchedContract
        ? toContractIdOption(matchedContract)
        : null;
      if (contractOption) {
        setSelectedContractFilter((prev) => {
          if (
            prev[0]?.value === contractOption.value &&
            prev[0]?.label === contractOption.label
          ) {
            return prev;
          }
          return [contractOption];
        });
      }
    }
  }, [customerIdFilter, contractIdFilter, customerData?.items]);

  const listParams = useMemo((): Partial<IDeploymentOrderListParams> => {
    const params: Partial<IDeploymentOrderListParams> = { page, size };
    if (status) params.status = status as DeploymentOrderStatus;
    if (user?.role === 1 && sale.trim()) params.sale = sale.trim();
    if (customerIdFilter) params.customer_id = customerIdFilter;
    if (contractIdFilter) params.contract_id = contractIdFilter;
    return params;
  }, [
    page,
    size,
    status,
    sale,
    user?.role,
    customerIdFilter,
    contractIdFilter,
  ]);

  const {
    data: listData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useDeploymentOrderList(listParams);

  const { rows, totalPages, totalResults } = useMemo(() => {
    const items = listData?.items ?? [];
    const mapped: DeployOrderRow[] = items.map((item) => ({
      ...item,
      status_label: getStatusLabel(item.status),
      created_at_display: formatDt(item.created_at),
      expires_at_display: formatDt(item.expires_at),
      reject_request_display: formatActorDt(
        item.reject_requested_at,
        item.reject_requested_by,
      ),
      reject_reason_display: item.reject_reason?.trim() || EMPTY_DISPLAY,
      item_count_display: String(item.item_count ?? item.items?.length ?? 0),
    }));
    const total = listData?.total ?? 0;
    const pageSize = listData?.size || size;
    return {
      rows: mapped,
      totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
      totalResults: total,
    };
  }, [listData, size]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(page));
        next.set("size", String(size));
        if (status) next.set("status", status);
        else next.delete("status");
        if (user?.role === 1 && sale) next.set("sale", sale);
        else next.delete("sale");
        if (customerIdFilter) next.set("customer_id", String(customerIdFilter));
        else next.delete("customer_id");
        if (contractIdFilter) next.set("contract_id", String(contractIdFilter));
        else next.delete("contract_id");
        return next;
      },
      { replace: true },
    );
  }, [
    page,
    size,
    status,
    sale,
    user?.role,
    customerIdFilter,
    contractIdFilter,
    setSearchParams,
  ]);

  useEffect(() => {
    setPage(1);
  }, [status, sale, customerIdFilter, contractIdFilter]);

  const fetchCustomerIdOptions = useCallback(
    async (query: string) => {
      const result = await getCustomers({
        ...customerListParams,
        q: query.trim() || undefined,
      });
      return uniqueOptionsByValue(
        (result.items ?? [])
          .map(toCustomerIdOption)
          .filter((item): item is AutocompleteOption => Boolean(item)),
      );
    },
    [customerListParams],
  );

  const fetchContractIdOptions = useCallback(
    async (query: string) => {
      const result = await getCustomers({
        ...customerListParams,
        customer_id: customerIdFilter,
        q: query.trim() || undefined,
      });
      return uniqueOptionsByValue(
        (result.items ?? [])
          .map(toContractIdOption)
          .filter((item): item is AutocompleteOption => Boolean(item)),
      );
    },
    [customerListParams, customerIdFilter],
  );

  const handleCustomerFilterChange = (value: AutocompleteOption[]) => {
    setSelectedCustomerFilter(value.slice(-1));
    setPage(1);
  };

  const handleContractFilterChange = (value: AutocompleteOption[]) => {
    setSelectedContractFilter(value.slice(-1));
    setPage(1);
  };

  const saleOptions = useMemo(
    () => [
      { label: "Tất cả sale", value: "" },
      ...users.map((name) => ({ label: name, value: name })),
    ],
    [],
  );

  const columns = useMemo(
    () => [
      { key: "created_by", label: "Người tạo" },
      { key: "sale_username", label: "Sale" },
      { key: "created_at_display", label: "Ngày tạo" },
      { key: "customer_name", label: "Khách hàng" },
      { key: "contract_number", label: "Số HĐ" },
      { key: "item_count_display", label: "Số lượng" },
      {
        key: "status_label",
        label: "Trạng thái",
        type: "span",
        cellClassName: "min-w-[120px]",
        render: (item: DeployOrderRow) => ({
          text: getStatusLabel(item.status),
          classname: getStatusBadgeClass(item.status),
        }),
      },
      { key: "expires_at_display", label: "Hạn xử lý" },
    ],
    [],
  );

  const openDetailById = (id: number) => {
    setDetailOrderId(id);
    setOpenDetail(true);
  };

  const resolveOrderItems = async (
    order: IDeploymentOrder,
  ): Promise<{ detail: IDeploymentOrder; items: IDeploymentOrderItem[] }> => {
    const existing = order.items ?? [];
    if (existing.length > 0) {
      return { detail: order, items: existing };
    }
    Swal.fire({
      title: "Đang tải danh sách số...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const detail = await getDeploymentOrderById(order.id);
      Swal.close();
      return { detail, items: detail.items ?? [] };
    } catch (err) {
      Swal.close();
      throw err;
    }
  };

  const handleRefreshStatus = async () => {
    try {
      await refetch();
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        err?.response?.data?.detail || "Không kiểm tra được trạng thái đơn.",
        "error",
      );
    }
  };

  const handleConfirm = async (order: IDeploymentOrder) => {
    if (!isAdmin) return;
    if (!isPending(order.status)) return;

    let detail = order;
    let items: IDeploymentOrderItem[] = order.items ?? [];
    try {
      const resolved = await resolveOrderItems(order);
      detail = resolved.detail;
      items = resolved.items;
    } catch {
      Swal.fire("Oops...", "Không tải được danh sách số trong đơn.", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Xác nhận đơn triển khai?",
      html: buildDeployOrderPhonesHtml(detail, items),
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
      refetch();
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        err?.response?.data?.detail || "Không thể xác nhận đơn.",
        "error",
      );
    }
  };

  /** Sale xin hủy (pending) / Sale rút yêu cầu (reject_requested) / Admin duyệt hủy / Admin hủy trực tiếp */
  const handleReject = async (order: IDeploymentOrder) => {
    const pending = isPending(order.status);
    const rejectRequested = isRejectRequested(order.status);

    // Sale rút yêu cầu hủy qua nút reject (không còn dropdown)
    if (rejectRequested && !isAdmin) {
      await handleDenyReject(order);
      return;
    }

    if (pending) {
      // Sale bắt buộc reason; admin có thể hủy trực tiếp (reason tùy chọn)
      const reasonRequired = !isAdmin;
      let detail = order;
      let items: IDeploymentOrderItem[] = order.items ?? [];
      try {
        const resolved = await resolveOrderItems(order);
        detail = resolved.detail;
        items = resolved.items;
      } catch {
        Swal.fire("Oops...", "Không tải được danh sách số trong đơn.", "error");
        return;
      }

      const result = await Swal.fire({
        title: isAdmin ? "Từ chối đơn triển khai?" : "Xin hủy đơn triển khai?",
        html: buildDeployOrderPhonesHtml(detail, items),
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
        refetch();
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

    if (rejectRequested && isAdmin) {
      let detail = order;
      let items: IDeploymentOrderItem[] = order.items ?? [];
      try {
        const resolved = await resolveOrderItems(order);
        detail = resolved.detail;
        items = resolved.items;
      } catch {
        Swal.fire("Oops...", "Không tải được danh sách số trong đơn.", "error");
        return;
      }

      const reasonNote = detail.reject_reason
        ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280"><b>Lý do sale xin hủy:</b> ${String(detail.reject_reason).replace(/</g, "&lt;")}</p>`
        : "";
      const result = await Swal.fire({
        title: "Duyệt hủy đơn?",
        html: `${buildDeployOrderPhonesHtml(detail, items)}${reasonNote}`,
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
        refetch();
      } catch (err: any) {
        Swal.fire(
          "Oops...",
          err?.response?.data?.detail || "Không thể duyệt hủy đơn.",
          "error",
        );
      }
    }
  };

  /** Admin từ chối yêu cầu hủy / Sale rút yêu cầu */
  const handleDenyReject = async (order: IDeploymentOrder) => {
    if (!isRejectRequested(order.status)) return;

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
      refetch();
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        err?.response?.data?.detail || "Không thể xử lý yêu cầu hủy.",
        "error",
      );
    }
  };

  const canRejectOrder = (order: IDeploymentOrder) => {
    if (isPending(order.status)) return true;
    // Admin duyệt hủy; sale rút yêu cầu hủy
    if (isRejectRequested(order.status)) return true;
    return false;
  };

  const canDenyRejectOrder = (order: IDeploymentOrder) =>
    isRejectRequested(order.status);

  const convertToMobileData = (): LabelValueItem[][] =>
    rows.map((item) => [
      { label: "ID", value: String(item.id), hidden: true },
      { label: "Khách hàng", value: item.customer_name || EMPTY_DISPLAY },
      { label: "Số HĐ", value: item.contract_number || EMPTY_DISPLAY },
      { label: "Sale", value: item.sale_username || EMPTY_DISPLAY },
      { label: "Số lượng", value: item.item_count_display },
      { label: "Trạng thái", value: getStatusLabel(item.status) },
      { label: "Hạn xử lý", value: item.expires_at_display },
      { label: "Xin hủy lúc", value: item.reject_request_display },
      { label: "Lý do hủy", value: item.reject_reason_display },
      { label: "Ngày tạo", value: item.created_at_display },
    ]);

  const findOrderById = (id: string) =>
    rows.find((row) => Number(row.id) === Number(id));

  const mobileActions: ActionButton[] = [
    {
      icon: <FiEye />,
      label: "Chi tiết",
      onClick: (id) => openDetailById(Number(id)),
      color: "primary",
    },
    ...(isAdmin
      ? [
          {
            icon: <GiConfirmed />,
            label: "Xác nhận",
            onClick: (id: string) => {
              const order = findOrderById(id);
              if (order) handleConfirm(order);
            },
            color: "success" as const,
            disabled: (id: string) => !isPending(findOrderById(id)?.status),
          },
        ]
      : []),
    {
      icon: <MdOutlineCancel />,
      label: isAdmin ? "Từ chối / Duyệt hủy" : "Xin hủy",
      onClick: (id) => {
        const order = findOrderById(id);
        if (order) handleReject(order);
      },
      color: "error",
      disabled: (id) => {
        const order = findOrderById(id);
        return !order || !canRejectOrder(order);
      },
    },
    {
      icon: <MdOutlineCancel />,
      label: isAdmin ? "Từ chối yêu cầu hủy" : "Rút yêu cầu hủy",
      onClick: (id) => {
        const order = findOrderById(id);
        if (order) handleDenyReject(order);
      },
      color: "warning",
      disabled: (id) => {
        const order = findOrderById(id);
        return !order || !canDenyRejectOrder(order);
      },
    },
  ];

  const paginationOffset = page - 1;
  const showPagination = totalResults > 0;
  const errorMessage = isError
    ? (error as any)?.response?.data?.detail ||
      (error as Error)?.message ||
      "Không tải được danh sách đơn triển khai."
    : "";

  const handlePageChange = (newSize: number, newOffset: number) => {
    setSize(newSize);
    setPage(newOffset + 1);
  };

  const handleLimitChange = (newSize: number) => {
    setSize(newSize);
    setPage(1);
  };

  const filterBlock = (
    <ResponsiveFilterWrapper drawerTitle="Bộ lọc đơn triển khai">
      <div
        className={`grid grid-cols-1 gap-4 lg:grid-cols-2 ${
          isAdmin ? "xl:grid-cols-5" : "xl:grid-cols-4"
        }`}>
        <div>
          <Label>Trạng thái</Label>
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => setStatus(value)}
            placeholder="Chọn trạng thái"
            className="dark:bg-black dark:text-white"
          />
        </div>
        {isAdmin ? (
          <div>
            <Label>Sale</Label>
            <Select
              options={saleOptions}
              value={sale}
              onChange={(value) => setSale(value)}
              placeholder="Chọn sale..."
              className="dark:bg-black dark:text-white"
            />
          </div>
        ) : null}
        <div>
          <Label>Khách hàng</Label>
          <AutocompleteMultiple
            options={customerFilterOptions}
            value={selectedCustomerFilter}
            onChange={handleCustomerFilterChange}
            fetchOptions={fetchCustomerIdOptions}
            placeholder="Tìm theo khách hàng..."
            className="dark:bg-black dark:text-white"
          />
        </div>
        <div>
          <Label>Hợp đồng</Label>
          <AutocompleteMultiple
            options={contractFilterOptions}
            value={selectedContractFilter}
            onChange={handleContractFilterChange}
            fetchOptions={fetchContractIdOptions}
            placeholder="Tìm theo số hợp đồng..."
            className="dark:bg-black dark:text-white"
          />
        </div>
        <div className="flex flex-col">
          <Label className="invisible select-none">Thao tác</Label>
          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={isLoading || isFetching || actionBusy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Kiểm tra lại trạng thái đơn">
            <FiRefreshCw
              className={`shrink-0 text-base ${isFetching ? "animate-spin" : ""}`}
            />
            <span className="truncate">Kiểm tra lại trạng thái</span>
          </button>
        </div>
      </div>
    </ResponsiveFilterWrapper>
  );

  return (
    <>
      {isMobile ? null : <PageBreadcrumb pageTitle="Đơn triển khai" />}
      <div className="space-y-6">
        {isMobile ? (
          <div className="space-y-4">
            {filterBlock}
            {rows.length === 0 && !isLoading ? <EmptyState /> : null}
            {rows.length > 0 ? (
              <TableMobile
                pageTitle="Đơn triển khai"
                disabledReset={true}
                data={convertToMobileData()}
                actions={mobileActions}
                showAllData={true}
                hidePagination={true}
                useTailwindStyling={true}
                hideCheckbox={true}
              />
            ) : null}
            {showPagination ? (
              <Pagination
                limit={size}
                offset={paginationOffset}
                totalPages={totalPages}
                totalResults={totalResults}
                changeLimitOptions={[10, 20, 50]}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            ) : null}
          </div>
        ) : (
          <ComponentCard>
            {filterBlock}
            {rows.length === 0 && !isLoading && !isFetching ? (
              <EmptyState />
            ) : null}
            {rows.length > 0 || isLoading || isFetching ? (
              <ReusableTable
                disabledReset={true}
                disabled={true}
                showId={false}
                role={user?.role}
                title="Danh sách đơn triển khai"
                data={rows}
                columns={columns}
                isLoading={isLoading || isFetching || actionBusy}
                error={errorMessage}
                onDetail={(item) => openDetailById(Number(item.id))}
                {...(isAdmin
                  ? {
                      onConfirm: (item: DeployOrderRow) => handleConfirm(item),
                      canConfirm: (item: DeployOrderRow) =>
                        isPending(item.status),
                    }
                  : {})}
                onReject={(item) => handleReject(item)}
                canReject={(item) => canRejectOrder(item)}
              />
            ) : null}
            {showPagination ? (
              <div className="mt-4 px-2 pb-2">
                <Pagination
                  limit={size}
                  offset={paginationOffset}
                  totalPages={totalPages}
                  totalResults={totalResults}
                  changeLimitOptions={[10, 20, 50]}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            ) : null}
          </ComponentCard>
        )}
      </div>

      <DeployOrderDetailModal
        isOpen={openDetail}
        orderId={detailOrderId}
        onClose={() => {
          setOpenDetail(false);
          setDetailOrderId(null);
        }}
        onSuccess={() => refetch()}
      />
    </>
  );
};

export default ListDeployOrderPage;
