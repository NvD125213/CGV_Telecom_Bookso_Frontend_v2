import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
// import TableMobile from "../../mobiles/TableMobile";
import { useIsMobile } from "../../hooks/useScreenSize";
import { subscriptionService } from "../../services/subcription";
import { useApi } from "../../hooks/useApi";
import { useQuerySync } from "../../hooks/useQueryAsync";
import { planService } from "../../services/plan";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Pagination } from "../../components/common/Pagination";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import DualProgress from "../../components/progress-bar/DualProgress";
import { formatCurrency } from "../../helper/formatCurrency";
import ActionMenu from "./ActionMenu";

interface SubcriptionData {
  id: number;
  customer_name: string;
  tax_code: string;
  contract_code: string;
  username: string;
  slide_users: Record<any, any>;
  root_plan_id: number | null;
  auto_renew: boolean;
  expired: Date;
  status: number;
  total_did: number;
  total_minutes: number;
  total_price?: number;
  items?: any[];
}

// Component để hiển thị status với màu sắc
const StatusBadge = ({ status }: { status: number }) => {
  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 1:
        return {
          text: "active",
          classname:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
        };
      case 2:
        return {
          text: "Pending",
          classname:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
        };
      case 0:
        return {
          text: "expired",
          classname:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
        };
      default:
        return {
          text: "Không xác định",
          classname:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-500",
        };
    }
  };

  const statusDisplay = getStatusDisplay(status);
  return <span className={statusDisplay.classname}>{statusDisplay.text}</span>;
};

const CustomSubscriptionTable = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onDetail,
  onConfirm,
  role,
  totalProgress,
  currentProgress,
  totalPriceAll,
}: {
  data: any[];
  isLoading: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (id: string | number) => void;
  onDetail?: (item: any) => void;
  onConfirm?: (id: string | number) => void;
  role?: number;
  totalProgress: number;
  currentProgress: number;
  totalPriceAll: number;
}) => {
  const columns = [
    {
      key: "customer_name",
      label: "Tên khách hàng",
      minWidth: "min-w-[200px]",
    },
    { key: "total_did", label: "Tổng CID", minWidth: "min-w-[100px]" },
    { key: "total_minutes", label: "Phút gọi", minWidth: "min-w-[100px]" },
    { key: "username", label: "Sale", minWidth: "min-w-[100px]" },
    { key: "root_plan_id", label: "Gói", minWidth: "min-w-[100px]" },
    { key: "total_price", label: "Tổng giá", minWidth: "min-w-[100px]" },
    { key: "status", label: "Trạng thái", minWidth: "min-w-[50px]" },
  ];

  const hasActionColumn = onEdit || onDelete;
  const totalColumnCount = columns.length + 1 + (hasActionColumn ? 1 : 0);
  const isManyColumns = totalColumnCount > 8;
  const formatNumberVN = (value: number) => {
    if (value == null) return "";
    return value.toLocaleString("vi-VN");
  };

  return (
    <div className="space-y-4">
      {/* Total Price Display - Top Right */}
      {/* <div className="flex items-center justify-end gap-3 text-white">
        <div className="flex items-center gap-2  px-4 py-2 rounded-xl shadow-md bg-gradient-to-r from-blue-500 to-indigo-600 ">
          <span className="text-sm font-semibold">TỔNG DOANH THU:</span>
          <span className="text-lg font-bold">
            {formatCurrency(totalPriceAll)}
          </span>
        </div>
      </div> */}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="max-h-[800px] overflow-y-auto dark:bg-black min-w-[900px]">
              <Table className="dark:text-white">
                {/* Table Header */}
                <TableHeader>
                  <TableRow>
                    {columns.map((col, idx) => (
                      <TableCell
                        key={`${col.key}-${idx}`}
                        isHeader
                        className={`px-5 ${col.minWidth || ""} ${
                          isManyColumns ? "text-[13px]" : "text-sm"
                        } dark:text-gray-300 py-3 text-base font-semibold text-gray-500 text-start`}>
                        {col.label}
                      </TableCell>
                    ))}
                    {/* <TableCell
                      isHeader
                      className={`px-5 flex justify-center min-w-[150px] ${
                        isManyColumns ? "text-[13px]" : "text-sm"
                      } dark:text-gray-300 py-5 text-base font-semibold text-gray-500 text-start`}>
                      Lưu lượng
                    </TableCell> */}
                    {hasActionColumn && (
                      <TableCell
                        isHeader
                        className={`px-5 min-w-[100px] ${
                          isManyColumns ? "text-[13px]" : "text-sm"
                        } dark:text-gray-300 py-3 text-base font-semibold text-gray-500 text-center`}>
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
                            }`}>
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
                    data.map((item) => (
                      <TableRow key={item.id}>
                        {columns.map((col) => (
                          <TableCell
                            key={col.key}
                            className={`px-5 py-3 ${
                              col.minWidth || ""
                            } text-sm text-gray-500 dark:text-gray-300 ${
                              isManyColumns ? "text-[13px]" : "text-sm"
                            }`}>
                            {col.key === "status" ? (
                              <StatusBadge status={item.status} />
                            ) : col.key === "total_price" ? (
                              formatCurrency(item[col.key])
                            ) : col.key === "total_minutes" ? (
                              formatNumberVN(item[col.key])
                            ) : (
                              item[col.key] || "-"
                            )}
                          </TableCell>
                        ))}
                        {/* <TableCell
                          className={`px-5 dark:text-gray-300 py-3 min-w-[200px] ${
                            isManyColumns ? "text-[13px]" : "text-sm"
                          }`}>
                          <DualProgress
                            barClassName="h-4"
                            labelClassName="text-xs"
                            total={totalProgress}
                            current={currentProgress}
                          />
                        </TableCell> */}
                        {hasActionColumn && (
                          <TableCell
                            className={`px-5 py-3 min-w-[120px] ${
                              isManyColumns ? "text-[13px]" : "text-sm"
                            }`}>
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

export interface SubscriptionQuery {
  page: number;
  size: number;
  order_by: string;
  order_dir: string;
  search?: string;
  status?: string;
  root_plan_id?: number;
  expired_from?: string;
  expired_to?: string;
  auto_renew?: boolean;
  customer_name?: string;
  tax_code?: string;
  contract_code?: string;
  username?: string;
}

const SubsciptionList = () => {
  const navigate = useNavigate();
  const [subsciptions, setSubsciptions] = useState<SubcriptionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile(768);
  const user = useSelector((state: RootState) => state.auth.user);

  const [expiredFrom, setExpiredFrom] = useState<string>("");
  const [expiredTo, setExpiredTo] = useState<string>("");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const [query, setQuery] = useQuerySync<SubscriptionQuery>({
    page: 1,
    size: 10,
    order_by: "created_at",
    order_dir: "desc",
    expired_from: startOfMonth.toISOString(),
    expired_to: endOfMonth.toISOString(),
  });

  const [pagination, setPagination] = useState({
    page: query.page,
    size: query.size,
    total: 0,
    pages: 1,
  });

  const handlePaginationChange = (page: number, size: number) => {
    setQuery({ ...query, page, size });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== query.search) {
        setQuery({ ...query, search: searchInput, page: 1 });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, query, setQuery]);

  // Tạo một query string ổn định để so sánh
  const queryKey = useMemo(() => {
    return `${query.page}_${query.size}_${query.order_by}_${query.order_dir}_${
      query.search || ""
    }_${query.status || ""}_${query.root_plan_id || ""}_${
      query.expired_from || ""
    }_${query.expired_to || ""}_${query.auto_renew ?? ""}`;
  }, [
    query.page,
    query.size,
    query.order_by,
    query.order_dir,
    query.search,
    query.status,
    query.root_plan_id,
    query.expired_from,
    query.expired_to,
    query.auto_renew,
  ]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const result = await subscriptionService.get(query);
      setSubsciptions(result.data?.items || []);
      setPagination(
        result.data?.meta || { page: 1, size: 10, total: 0, pages: 1 }
      );
    } catch (err: any) {
      console.error("Fetch subscriptions failed:", err.response?.data);
      setError(err.response?.data?.detail || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const prevQueryKeyRef = useRef<string>("");

  useEffect(() => {
    // Chỉ fetch khi query key thay đổi
    if (prevQueryKeyRef.current === queryKey) {
      return;
    }

    fetchSubscriptions();
    prevQueryKeyRef.current = queryKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // Lấy danh sách tất cả plans để map với root_plan_id
  const { data: plansData, isLoading: isLoadingPlans } = useApi(() =>
    planService.get({})
  );

  // Tạo map để tra cứu plan name từ plan id
  const planMap =
    plansData?.data?.items?.reduce((acc: Record<number, string>, plan: any) => {
      acc[plan.id] = plan.name;
      return acc;
    }, {}) || {};

  // Tạo map để tra cứu plan price từ plan id
  const planPriceMap =
    plansData?.data?.items?.reduce((acc: Record<number, number>, plan: any) => {
      acc[plan.id] = plan.price_vnd || 0;
      return acc;
    }, {}) || {};

  // Xử lý dữ liệu để hiển thị đúng format
  const processedData =
    subsciptions?.map((item: SubcriptionData) => {
      // Tính total_price cả gói con
      const planPrice = item.root_plan_id
        ? planPriceMap[item.root_plan_id] || 0
        : 0;
      const items = item.items || [];
      const itemsTotal = items.reduce((sum: number, item: any) => {
        const price = item.price_override_vnd || 0;
        return sum + price;
      }, 0);
      const totalPrice = planPrice + itemsTotal;

      return {
        ...item,
        customer_name: item.customer_name || "-",
        tax_code: item.tax_code || "-",
        contract_code: item.contract_code || "-",
        username: item.username || "-",
        slide_users:
          item.slide_users && typeof item.slide_users === "object"
            ? Object.values(item.slide_users).join(", ") || "-"
            : "-",
        root_plan_id: item.root_plan_id
          ? planMap[item.root_plan_id] || `ID: ${item.root_plan_id}`
          : "-",
        total_price: totalPrice,
        auto_renew: item.auto_renew ? "Có" : "Không",
        status: item.status, // Giữ nguyên giá trị số để StatusBadge xử lý
        total_did: item.total_did || "-",
        total_minutes: item.total_minutes || "-",
      };
    }) || [];

  const handleDelete = async (id: string | number) => {
    // Tìm item chính để lấy thông tin hiển thị
    const data = subsciptions.find((item) => item.id === id);
    const contractCode = data?.contract_code || id;

    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc chắn muốn xóa mã hợp đồng "${contractCode}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const res = await subscriptionService.delete(Number(id)); // gọi API xóa
        if (res.status === 200) {
          Swal.fire(
            "Đã xóa!",
            `Mã hợp đồng "${contractCode}" đã được xóa.`,
            "success"
          );
          fetchSubscriptions();
        } else {
          Swal.fire("Lỗi", "Không thể xóa gói này.", "error");
        }
      } catch (error: any) {
        Swal.fire(
          "Lỗi",
          error?.response?.data?.detail || "Xảy ra lỗi",
          "error"
        );
      }
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Danh sách đăng ký gói" />

      <ComponentCard>
        <div className="max-w-7xl mx-auto">
          {/* --- Bộ lọc query --- */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8 p-4">
            <div className="w-full">
              <Label>Tìm kiếm</Label>
              <Input
                type="text"
                placeholder="Tìm theo tên khách hàng, mst..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md"
              />
            </div>
            {/* Ngày hết hạn từ */}
            <div className="w-full col-span-1 sm:col-span-3">
              <div className="grid grid-cols-2 gap-6">
                {/* Ngày hết hạn từ */}
                <div>
                  <Label>Ngày hết hạn từ</Label>
                  <Input
                    type="datetime-local"
                    value={expiredFrom}
                    onChange={(e) => {
                      setExpiredFrom(e.target.value);
                      setQuery({ ...query, expired_from: e.target.value });
                    }}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md"
                  />
                </div>

                {/* Ngày hết hạn đến */}
                <div>
                  <Label>Ngày hết hạn đến</Label>
                  <Input
                    type="datetime-local"
                    value={expiredTo}
                    onChange={(e) => {
                      setExpiredTo(e.target.value);
                      setQuery({ ...query, expired_to: e.target.value });
                    }}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md"
                  />
                </div>
              </div>
            </div>
            {/* Tìm kiếm */}

            {/* Trạng thái */}
            <div className="w-full">
              <Label>Trạng thái</Label>
              <Select
                options={[
                  { label: "Tất cả", value: "" },
                  { label: "Hoạt động", value: "1" },
                  { label: "Pending", value: "2" },
                  { label: "Hết hạn", value: "0" },
                ]}
                onChange={(value) => setQuery({ ...query, status: value })}
                placeholder="Trạng thái"
              />
            </div>

            {/* Gói chính */}
            <div className="w-full">
              <Label>Gói chính</Label>
              <Select
                options={[
                  { label: "Tất cả gói", value: "" },
                  ...(plansData?.data?.items?.map((plan: any) => ({
                    label: plan.name,
                    value: plan.id.toString(),
                  })) || []),
                ]}
                onChange={(value) =>
                  setQuery({
                    ...query,
                    root_plan_id: value ? Number(value) : undefined,
                  })
                }
                placeholder="Chọn gói"
              />
            </div>

            {/* Thứ tự */}
            <div className="w-full">
              <Label>Thứ tự</Label>
              <Select
                options={[
                  { label: "Tăng dần", value: "asc" },
                  { label: "Giảm dần", value: "desc" },
                ]}
                onChange={(value) => setQuery({ ...query, order_dir: value })}
                placeholder="Thứ tự"
              />
            </div>

            {/* Sắp xếp theo */}
            <div className="w-full">
              <Label>Sắp xếp theo</Label>
              <Select
                options={[
                  { label: "Ngày tạo", value: "created_at" },
                  { label: "Ngày cập nhật", value: "updated_at" },
                  { label: "Tên khách hàng", value: "customer_name" },
                  { label: "Trạng thái", value: "status" },
                  { label: "Ngày hết hạn", value: "expired" },
                ]}
                value={query.order_by}
                onChange={(value) => setQuery({ ...query, order_by: value })}
                placeholder="Chọn cách sắp xếp"
              />
            </div>
          </div>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          {isMobile ? (
            <div className="text-center text-gray-500">
              Chế độ mobile chưa được hỗ trợ cho bảng này
            </div>
          ) : (
            <>
              <CustomSubscriptionTable
                data={processedData}
                isLoading={loading || isLoadingPlans}
                role={user.role}
                onEdit={(item) => {
                  navigate(`/subscriptions/edit/${item.id}`);
                }}
                totalProgress={100}
                currentProgress={20}
                totalPriceAll={23000000}
                onDetail={(item) =>
                  navigate(`/subscriptions/detail/${item.id}`)
                }
                onDelete={(id) => handleDelete(id)}
              />
              <Pagination data={pagination} onChange={handlePaginationChange} />
            </>
          )}
        </div>
      </ComponentCard>
    </>
  );
};

export default SubsciptionList;
