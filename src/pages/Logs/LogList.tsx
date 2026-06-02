import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ResponsiveFilterWrapper from "../../components/common/FlipperWrapper";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { logPackageService } from "../../services/log";
import { useQuerySync } from "../../hooks/useQueryAsync";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { debounce } from "lodash";
import { CustomLogTable, prepareLogTableRows } from "./LogTable";
import { useNavigate } from "react-router";
import { Pagination } from "../../components/common/Pagination";
import Select from "../../components/form/Select";
import { useIsMobile } from "../../hooks/useScreenSize";
import { CardLogMobileList } from "../../components/common/CardLogMobile";
import { formatCurrency } from "../../helper/formatCurrency";

interface Logs {
  id: number;
  name_plan: string;
  name_sale: string;
  customer_name: string;
  contract_code: string;
  tax_code: string;
  total_cid: number;
  total_minutes: string;
  phone_numbers: string[];
  total_users: number;
  price_per_user: number;
  price_per_minute: number;
  price_phone_numbers: string;
  total_price: string;
  is_subscription_items: boolean;
  is_subscription: boolean;
  is_order: boolean;
  created_at?: string;
  children?: Record<string, any>[];
}

interface LogQuery {
  page: number;
  size: number;
  order_by?: string;
  order_dir?: string;
  customer_name?: string;
  contract_code?: string;
  tax_code?: string;
  name_sale?: string;
  q?: string;
  name_plan?: string;
  phone?: string;
  is_subscription?: boolean;
  is_subscription_items?: boolean;
  is_order?: boolean;
  created_from?: string;
  created_to?: string;
  month_year?: string;
}

const parseSummaryAmount = (value?: string) => {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  const parsed = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const LogList = () => {
  const [logs, setLogs] = useState<Logs[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorData, setErrorData] = useState("");
  const [total_revenue, setTotalRevenue] = useState("");
  const [total_unpaid, setTotalUnpaid] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const isMobile = useIsMobile(768);

  const [query, setQuery] = useQuerySync<LogQuery>({
    page: 1,
    size: 10,
  });

  const [pagination, setPagination] = useState({
    page: query.page,
    size: query.size,
    total: 0,
    pages: 1,
  });

  const [search, setSearch] = useState({
    q: "",
    customer_name: "",
    contract_code: "",
    tax_code: "",
    name_sale: "",
    name_plan: "",
    phone: "",
  });

  const fetchLogs = useCallback(async (filters: LogQuery) => {
    try {
      setLoading(true);
      const res = await logPackageService.get(filters);
      const data: Logs[] = res.data?.items || [];

      setLogs(
        data.map((item) => ({
          ...item,
          type: item.is_subscription
            ? "Gói chính"
            : item.is_subscription_items
              ? "Gói phụ"
              : item.is_order
                ? "Order"
                : "Không xác định",
          price_phone_numbers: JSON.stringify(item.price_phone_numbers),
        })),
      );

      setPagination(res.data?.meta);
      setTotalRevenue(res.data?.total_revenue);
      setTotalUnpaid(res.data?.total_unpaid);
    } catch (error: any) {
      console.error("Lỗi khi lấy log:", error);
      setErrorData(
        error.response?.data?.message || "Không thể tải dữ liệu log",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const debounced = debounce(() => {
      setQuery((prev) => ({
        ...prev,
        ...search,
        page: 1,
      }));
    }, 500);
    debounced();
    return () => debounced.cancel();
  }, [search, setQuery]);

  useEffect(() => {
    fetchLogs(query);
  }, [query, fetchLogs]);

  const handleInputChange = (key: keyof LogQuery, value: string) => {
    setQuery({ ...query, [key]: value, page: 1 });
  };

  const handlePaginationChange = (page: number, size: number) => {
    setQuery({ ...query, page, size });
  };

  const handleTypeChange = (value: string) => {
    const newQuery = { ...query, page: 1 };

    delete newQuery.is_subscription;
    delete newQuery.is_subscription_items;
    delete newQuery.is_order;

    if (value === "subscription") {
      newQuery.is_subscription = true;
    } else if (value === "subscription_item") {
      newQuery.is_subscription_items = true;
    } else if (value === "order") {
      newQuery.is_order = true;
    }

    setQuery(newQuery);
  };

  const getTypeValue = () => {
    if (query.is_subscription) return "subscription";
    if (query.is_subscription_items) return "subscription_item";
    if (query.is_order) return "order";
    return "";
  };

  const mappedLogs = useMemo(() => prepareLogTableRows(logs), [logs]);

  const handleDetail = useCallback(
    (item: { id: number | string }) => {
      navigate(`/logs/${item.id}`, {
        state: logs.find((log) => String(log.id) === String(item.id)),
      });
    },
    [navigate, logs],
  );

  const summaryBlock = (total_revenue || total_unpaid) && (
    <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:justify-end">
      {total_revenue != null && total_revenue !== "" && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 dark:bg-green-500/10 sm:justify-start">
          <span className="text-xs font-semibold text-green-600 dark:text-green-400">
            Tổng doanh thu
          </span>
          <span className="text-sm font-bold text-green-700 dark:text-green-400">
            {formatCurrency(parseSummaryAmount(total_revenue))}
          </span>
        </div>
      )}
      {total_unpaid != null && total_unpaid !== "" && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 dark:bg-red-500/10 sm:justify-start">
          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
            Chưa thanh toán
          </span>
          <span className="text-sm font-bold text-red-700 dark:text-red-400">
            {formatCurrency(parseSummaryAmount(total_unpaid))}
          </span>
        </div>
      )}
    </div>
  );

  const filterBlock = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <Label>Tìm kiếm</Label>
          <Input
            placeholder="Tìm theo tên KH, hợp đồng, MST, sale, tên gói,..."
            value={search.q || ""}
            onChange={(e) => setSearch({ ...search, q: e.target.value })}
          />
        </div>
        <div className="min-w-0">
          <Label>Chọn gói</Label>
          <Input
            placeholder="Tìm theo tên gói, gói phụ hoặc order"
            value={search.name_plan || ""}
            onChange={(e) =>
              setSearch({ ...search, name_plan: e.target.value })
            }
          />
        </div>
        <div className="min-w-0">
          <Label>Tháng tạo</Label>
          <Input
            type="month"
            value={query.month_year || ""}
            onChange={(e) =>
              setQuery({
                ...query,
                month_year: e.target.value || undefined,
                page: 1,
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="min-w-0">
          <Label>Loại</Label>
          <Select
            value={getTypeValue()}
            onChange={handleTypeChange}
            options={[
              { value: "", label: "Tất cả" },
              { value: "subscription", label: "Gói cố định" },
              { value: "order", label: "Gói trả trước" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <Label>Tên khách hàng</Label>
          <Input
            placeholder="Tìm kiếm theo tên khách hàng"
            value={search.customer_name}
            onChange={(e) =>
              setSearch({ ...search, customer_name: e.target.value })
            }
          />
        </div>
        <div className="min-w-0">
          <Label>Mã hợp đồng</Label>
          <Input
            placeholder="Tìm kiếm theo mã hợp đồng"
            value={search.contract_code || ""}
            onChange={(e) =>
              setSearch({ ...search, contract_code: e.target.value })
            }
          />
        </div>
        <div className="min-w-0">
          <Label>Mã số thuế</Label>
          <Input
            placeholder="Tìm kiếm theo mã số thuế"
            value={search.tax_code || ""}
            onChange={(e) =>
              setSearch({ ...search, tax_code: e.target.value })
            }
          />
        </div>
        <div className="min-w-0">
          <Label>Nhân viên sale</Label>
          <Input
            placeholder="Tìm kiếm theo nhân viên bán"
            value={query.name_sale || ""}
            onChange={(e) => handleInputChange("name_sale", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const ListWrapper = ({
    children,
    className = "",
  }: {
    children: ReactNode;
    className?: string;
  }) =>
    isMobile ? (
      <div className={className}>{children}</div>
    ) : (
      <ComponentCard className={className}>{children}</ComponentCard>
    );

  const listBody = isMobile ? (
    <div className="mt-1">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
        </div>
      ) : mappedLogs.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Không tìm thấy dữ liệu phù hợp
        </div>
      ) : (
        <>
          <CardLogMobileList items={mappedLogs} onDetail={handleDetail} />
          <div className="mt-4 px-1 pb-2">
            <Pagination data={pagination} onChange={handlePaginationChange} />
          </div>
        </>
      )}
    </div>
  ) : (
    <>
      <CustomLogTable
        rawData={logs}
        isLoading={loading}
        role={user.role}
        total_revenue={total_revenue}
        total_unpaid={total_unpaid}
        onDetail={(item) => {
          navigate(`/logs/${item.id}`, { state: item });
        }}
      />
      <Pagination data={pagination} onChange={handlePaginationChange} />
    </>
  );

  return (
    <>
      {!isMobile && (
        <PageBreadcrumb pageTitle="Danh sách lịch sử combo/order" />
      )}

      <ListWrapper className={isMobile ? "border-0 bg-transparent shadow-none" : ""}>
        {isMobile && (
          <h1 className="mb-2 px-1 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Danh sách lịch sử combo/order
          </h1>
        )}

        <ResponsiveFilterWrapper drawerTitle="Bộ lọc lịch sử combo/order">
          {filterBlock}
        </ResponsiveFilterWrapper>

        {errorData && (
          <div className="mb-4 px-1 text-red-500">{errorData}</div>
        )}

        {isMobile && summaryBlock}

        {listBody}
      </ListWrapper>
    </>
  );
};

export default LogList;
