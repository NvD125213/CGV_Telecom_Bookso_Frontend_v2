import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useSelector } from "react-redux";
import { FiEye } from "react-icons/fi";
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
  item_count_display: string;
  no_charge_display: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Từ chối", value: "rejected" },
  { label: "Đã hủy", value: "cancelled" },
];

const STATUS_BADGE_BASE =
  "inline-flex max-w-fit shrink-0 items-center whitespace-nowrap px-2.5 py-0.5 justify-center rounded-full font-medium text-theme-xs";

const isPending = (status?: string) =>
  String(status || "").toLowerCase() === "pending";

const getStatusLabel = (status?: string) => {
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
      return status?.trim() || "—";
  }
};

const getStatusBadgeClass = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return `${STATUS_BADGE_BASE} bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300`;
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

const formatDt = (value?: string | null) => {
  if (!value) return "—";
  try {
    return formatDate(value);
  } catch {
    return value;
  }
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

  const confirmMutation = useConfirmDeploymentOrder();
  const rejectMutation = useRejectDeploymentOrder();
  const actionBusy = confirmMutation.isPending || rejectMutation.isPending;

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
      item_count_display: String(item.item_count ?? item.items?.length ?? 0),
      no_charge_display: item.no_charge ? "Có" : "Không",
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
      { key: "customer_name", label: "Khách hàng" },
      { key: "contract_number", label: "Số HĐ" },
      { key: "sale_username", label: "Sale" },
      { key: "item_count_display", label: "Số lượng" },
      {
        key: "status_label",
        label: "Trạng thái",
        type: "span",
        cellClassName: "min-w-[110px]",
        render: (item: DeployOrderRow) => ({
          text: getStatusLabel(item.status),
          classname: getStatusBadgeClass(item.status),
        }),
      },
      { key: "created_by", label: "Người tạo" },
      { key: "created_at_display", label: "Ngày tạo" },
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

  const handleConfirm = async (order: IDeploymentOrder) => {
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

  const handleReject = async (order: IDeploymentOrder) => {
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
      title: "Từ chối đơn triển khai?",
      html: buildDeployOrderPhonesHtml(detail, items),
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
      refetch();
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        err?.response?.data?.detail || "Không thể từ chối đơn.",
        "error",
      );
    }
  };

  const convertToMobileData = (): LabelValueItem[][] =>
    rows.map((item) => [
      { label: "ID", value: String(item.id), hidden: true },
      { label: "Khách hàng", value: item.customer_name || "—" },
      { label: "Số HĐ", value: item.contract_number || "—" },
      { label: "Sale", value: item.sale_username || "—" },
      { label: "Số lượng", value: item.item_count_display },
      { label: "Trạng thái", value: getStatusLabel(item.status) },
      { label: "Ngày tạo", value: item.created_at_display },
    ]);

  const isOrderPendingById = (id: string) => {
    const order = rows.find((row) => Number(row.id) === Number(id));
    return isPending(order?.status);
  };

  const mobileActions: ActionButton[] = [
    {
      icon: <FiEye />,
      label: "Chi tiết",
      onClick: (id) => openDetailById(Number(id)),
      color: "primary",
    },
    {
      icon: <GiConfirmed />,
      label: "Xác nhận",
      onClick: (id) => {
        const order = rows.find((row) => Number(row.id) === Number(id));
        if (order) handleConfirm(order);
      },
      color: "success",
      disabled: (id) => !isOrderPendingById(id),
    },
    {
      icon: <MdOutlineCancel />,
      label: "Từ chối",
      onClick: (id) => {
        const order = rows.find((row) => Number(row.id) === Number(id));
        if (order) handleReject(order);
      },
      color: "error",
      disabled: (id) => !isOrderPendingById(id),
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
        {user?.role === 1 ? (
          <div>
            <Label>Sale</Label>
            <Select
              options={saleOptions}
              value={sale}
              onChange={(value) => setSale(value)}
              placeholder="Tất cả sale"
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
                onConfirm={(item) => handleConfirm(item)}
                onReject={(item) => handleReject(item)}
                canConfirm={(item) => isPending(item.status)}
                canReject={(item) => isPending(item.status)}
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
