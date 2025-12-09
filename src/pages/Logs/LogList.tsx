import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useCallback, useEffect, useRef, useState } from "react";
import { logPackageService } from "../../services/log";
import { useQuerySync } from "../../hooks/useQueryAsync";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { debounce } from "lodash";
import { CustomLogTable } from "./LogTable";
import { useNavigate } from "react-router";
import { Pagination } from "../../components/common/Pagination";

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
  type?: string;
  created_from?: string;
  created_to?: string;
}

const LogList = () => {
  const [logs, setLogs] = useState<Logs[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorData, setErrorData] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

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
      const { type, ...filter } = filters;

      if (type === "subscription") filter.is_subscription = true;
      else if (type === "subscription_item")
        filter.is_subscription_items = true;
      else if (type === "order") filter.is_order = true;

      const res = await logPackageService.get(filter);
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
        }))
      );

      setPagination(res.data?.meta);
    } catch (error: any) {
      console.error("Lỗi khi lấy log:", error);
      setErrorData(
        error.response?.data?.message || "Không thể tải dữ liệu log"
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

  return (
    <>
      <PageBreadcrumb pageTitle="Danh sách lịch sử combo/order" />
      <ComponentCard>
        {/* Filters Section */}
        <div className="space-y-4 mb-6">
          {/* Search Row */}
          <div className="grid gap-4 grid-cols-2">
            <div>
              <Label>Tìm kiếm</Label>
              <Input
                placeholder="Tìm theo tên KH, hợp đồng, MST, sale, tên gói,..."
                value={search.q || ""}
                onChange={(e) => setSearch({ ...search, q: e.target.value })}
              />
            </div>
            <div>
              <Label>Chọn gói</Label>
              <Input
                placeholder="Tìm theo tên gói, gói phụ hoặc order"
                value={search.name_plan || ""}
                onChange={(e) =>
                  setSearch({ ...search, name_plan: e.target.value })
                }
              />
            </div>
          </div>

          {/* Advanced Filters Row */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Tên khách hàng</Label>
              <Input
                placeholder="Tìm kiếm theo tên khách hàng"
                value={search.customer_name}
                onChange={(e) =>
                  setSearch({ ...search, customer_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Mã hợp đồng</Label>
              <Input
                placeholder="Tìm kiếm theo mã hợp đồng"
                value={search.contract_code || ""}
                onChange={(e) =>
                  setSearch({ ...search, contract_code: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Mã số thuế</Label>
              <Input
                placeholder="Tìm kiếm theo mã số thuế"
                value={search.tax_code || ""}
                onChange={(e) =>
                  setSearch({ ...search, tax_code: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Nhân viên sale</Label>
              <Input
                placeholder="Tìm kiếm theo nhân viên bán"
                value={query.name_sale || ""}
                onChange={(e) => handleInputChange("name_sale", e.target.value)}
              />
            </div>
          </div>
        </div>

        <>
          <CustomLogTable
            rawData={logs}
            isLoading={loading}
            role={user.role}
            onDetail={(item) => {
              navigate(`/logs/${item.id}`, { state: item });
            }}
          />
          <Pagination data={pagination} onChange={handlePaginationChange} />
        </>
      </ComponentCard>
    </>
  );
};

export default LogList;
