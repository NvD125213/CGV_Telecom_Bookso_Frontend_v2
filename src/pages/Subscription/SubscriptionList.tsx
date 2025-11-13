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
import { subscriptionService, getQuota } from "../../services/subcription";
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
import { min } from "lodash";
import { CheckCircle } from "@mui/icons-material";
import { BsXCircle } from "react-icons/bs";

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
  is_payment?: boolean;
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
      minWidth: "min-w-[150px]",
    },
    { key: "total_did", label: "Tổng CID" },
    { key: "total_minutes", label: "Phút gọi" },
    { key: "username", label: "Sale" },
    { key: "root_plan_id", label: "Gói chính" },
    { key: "total_price", label: "Tổng giá" },
    {
      key: "is_payment",
      label: "Thanh toán",
    },
    {
      key: "list_sub_plan",
      label: "Số gói phụ",
    },
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

  return (
    <div className="space-y-4">
      {/* Total Price Display - Top Right */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gray-200 bg-white/50 backdrop-blur-sm dark:bg-transparent">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            TỔNG DOANH THU:
          </span>
          <span className="text-base font-bold text-blue-600">
            {isLoadingTotalPrice
              ? "..."
              : formatCurrency(dataTotalPrice?.data.total_price) ?? "0 đ"}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="max-h-[800px] overflow-y-auto dark:bg-black min-w-[1000px] mb-4">
              <Table className="dark:text-white">
                {/* Table Header */}
                <TableHeader>
                  <TableRow>
                    {columns.map((col, idx) => (
                      <TableCell
                        key={`${col.key}-${idx}`}
                        isHeader
                        className={`px-5 ${col.minWidth || ""} ${
                          isManyColumns ? "text-[12px]" : "text-sm"
                        } dark:text-gray-300 py-3 text-base font-semibold text-gray-500 text-start`}>
                        {col.label}
                      </TableCell>
                    ))}
                    <TableCell
                      isHeader
                      className={`px-5 flex justify-center min-w-[150px] ${
                        isManyColumns ? "text-[13px]" : "text-sm"
                      } dark:text-gray-300 py-5 text-base font-semibold text-gray-500 text-start`}>
                      Lưu lượng
                    </TableCell>
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
                            ) : col.key === "is_payment" ? (
                              <div className="flex items-center px-1">
                                {item[col.key] ? (
                                  <>
                                    <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                                  </>
                                ) : (
                                  <>
                                    <BsXCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                                  </>
                                )}
                              </div>
                            ) : col.key === "total_price" ? (
                              formatCurrency(item[col.key])
                            ) : col.key === "total_minutes" ? (
                              formatNumberVN(item[col.key])
                            ) : (
                              item[col.key] || "-"
                            )}
                          </TableCell>
                        ))}
                        <TableCell
                          className={`px-5 dark:text-gray-300 py-3 min-w-[200px] ${
                            isManyColumns ? "text-[13px]" : "text-sm"
                          }`}>
                          {item.currentProgress > 0 ? (
                            <DualProgress
                              barClassName="h-4"
                              labelClassName="text-xs"
                              total={item.totalProgress}
                              current={item.currentProgress}
                            />
                          ) : (
                            <span className="text-gray-400 flex justify-center dark:text-gray-500 text-xs">
                              Chưa thêm mã trượt
                            </span>
                          )}
                        </TableCell>
                        {hasActionColumn && (
                          <TableCell
                            className={`px-5 py-3 min-w-[120px] ${
                              isManyColumns ? "text-[13px]" : "text-sm"
                            }  bg-white dark:bg-black`}>
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
  is_payment?: boolean;
}

const SubsciptionList = () => {
  const navigate = useNavigate();
  const [subscriptions, setsubscriptions] = useState<SubcriptionData[]>([]);
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

  function toLocalISOString(date: Date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localTime = new Date(date.getTime() - tzOffset);
    return localTime.toISOString().slice(0, 16);
  }

  const [query, setQuery] = useQuerySync<SubscriptionQuery>({
    page: 1,
    size: 10,
    order_by: "created_at",
    order_dir: "desc",
    expired_from: toLocalISOString(startOfMonth),
    expired_to: toLocalISOString(endOfMonth),
  });

  useEffect(() => {
    if (query.expired_from) setExpiredFrom(query.expired_from);
    if (query.expired_to) setExpiredTo(query.expired_to);
  }, [query.expired_from, query.expired_to]);

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

  const queryKey = useMemo(() => {
    return `${query.page}_${query.size}_${query.order_by}_${query.order_dir}_${
      query.search || ""
    }_${query.status || ""}_${query.root_plan_id || ""}_${
      query.expired_from || ""
    }_${query.expired_to || ""}_${query.auto_renew ?? ""}_${
      query.is_payment ?? ""
    }`;
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
    query.is_payment, // ✅ thêm dòng này
  ]);

  // ✅ FIX: Dùng state thay vì ref để trigger useEffect
  const [quotaBody, setQuotaBody] = useState<any[]>([]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const result = await subscriptionService.get(query);
      setsubscriptions(result.data?.items || []);

      const listAccount =
        result.data?.items
          ?.filter((sub: any) => (sub.slide_users?.length || 0) > 0)
          ?.map((item: any) => ({
            sub_Id: item.id,
            list_account: item.slide_users || [],
          })) || [];

      // ✅ FIX: Set vào state để trigger useEffect quota
      setQuotaBody(listAccount);

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
    if (prevQueryKeyRef.current === queryKey) {
      return;
    }

    fetchSubscriptions();
    prevQueryKeyRef.current = queryKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // Lấy danh sách plans
  const { data: plansData, isLoading: isLoadingPlans } = useApi(() =>
    planService.get({})
  );

  // Map plan name
  const planMap =
    plansData?.data?.items?.reduce((acc: Record<number, string>, plan: any) => {
      acc[plan.id] = plan.name;
      return acc;
    }, {}) || {};

  // Map plan price
  const planPriceMap =
    plansData?.data?.items?.reduce((acc: Record<number, number>, plan: any) => {
      acc[plan.id] = plan.price_vnd || 0;
      return acc;
    }, {}) || {};

  //  FIX: useMemo để tránh tạo object mới mỗi lần render
  const processedData = useMemo(() => {
    return (
      subscriptions?.map((item: SubcriptionData) => {
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
          status: item.status,
          total_did: item.total_did || "-",
          total_minutes: item.total_minutes || "-",
        };
      }) || []
    );
  }, [subscriptions, planMap, planPriceMap]);

  const handleDelete = async (id: string | number) => {
    const data = subscriptions.find((item) => item.id === id);

    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc chắn muốn xóa hợp đồng book gói của khách hàng "${data?.customer_name}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const res = await subscriptionService.delete(Number(id));
        if (res.status === 200) {
          Swal.fire("Đã xóa!", `Hợp đồng book gói đã được xóa.`, "success");
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

  const handleConfirmPayment = async (id: any) => {
    Swal.fire({
      title: "Xác nhận thanh toán",
      text: `Bạn có chắc chắn muốn xác nhận thanh toán cho hợp đồng book gói này không?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await subscriptionService.update(id, {
            is_payment: true,
          });
          if (res.status === 200) {
            Swal.fire(
              "Đã xác nhận!",
              `Thanh toán thành công cho hợp đồng book gói.`,
              "success"
            );
            navigate("/subscriptions");
          } else {
            Swal.fire("Lỗi", "Không thể xác nhận thanh toán.", "error");
          }
        } catch (error: any) {
          Swal.fire(
            "Lỗi",
            error?.response?.data?.detail || "Xảy ra lỗi",
            "error"
          );
        }
      }
    });
  };

  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  }, []);

  const [quotaData, setQuotaData] = useState<any[]>([]);

  // ✅ FIX: Giờ quotaBody đã là state nên useEffect sẽ chạy đúng
  useEffect(() => {
    const fetchQuota = async () => {
      if (!quotaBody || quotaBody.length === 0) return;
      try {
        const data = await getQuota(quotaBody, currentMonth);
        const filtered = (data.data || []).filter(
          (q: any) =>
            (q.total_call_out || 0) > 0 ||
            (q.total_call_in || 0) > 0 ||
            (q.total_sms || 0) > 0
        );
        setQuotaData(filtered);
      } catch (err) {
        console.error(err);
      }
    };
    fetchQuota();
  }, [quotaBody, currentMonth]);

  // ✅ FIX: useMemo để tránh tạo array mới mỗi lần render
  const mapData = useMemo(() => {
    // 1. Kiểm tra và Tạo Map (Sửa lỗi plansData.items)
    if (!subscriptions.length || !plansData?.data.items) return [];

    // console.log("planData", plansData?.data.items);

    const plansMap: Map<number, any> = new Map();
    plansData.data.items.forEach((plan: any) => {
      plansMap.set(plan.id, plan);
    });

    return processedData.map((sub: any) => {
      const quota = quotaData?.find((q: any) => q.sub_Id === sub.id);
      const planIds = sub.items.map((item: any) => item.plan_id);
      const plans = planIds
        .map((id: number) => plansMap.get(id))
        .filter(Boolean);
      let totalPlanMinutes = 0;
      let totalPlanDidCount = 0;
      const planNames: string[] = [];

      plans.forEach((plan: any) => {
        totalPlanMinutes += plan.minutes || 0;
        totalPlanDidCount += plan.did_count || 0;
        planNames.push(plan.name);
      });

      return {
        ...sub,
        // ...planDetails, // <-- Thêm chi tiết plan tại đây
        totalProgress: (sub.total_minutes || 0) + totalPlanMinutes,
        currentProgress: quota?.total_call_out || 0,
        total_price: sub.total_price || 0,
        // Cộng dồn minutes và did_count từ plan
        total_minutes: (sub.total_minutes || 0) + totalPlanMinutes,
        list_sub_plan: planNames.length,
        total_did: totalPlanDidCount + sub.total_did,
      };
    });
  }, [processedData, quotaData, subscriptions.length, plansData]);

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
            {/* Trạng thái thanh toán */}
            <div className="w-full">
              <Label>Trạng thái thanh toán</Label>
              <Select
                options={[
                  { label: "Tất cả", value: "" },
                  { label: "Đã thanh toán", value: "true" },
                  { label: "Chưa thanh toán", value: "false" },
                ]}
                onChange={(value) =>
                  setQuery({
                    ...query,
                    is_payment: value === "" ? undefined : value === "true",
                  })
                }
                placeholder="Trạng thái thanh toán"
              />
            </div>

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
                data={mapData}
                isLoading={loading || isLoadingPlans}
                role={user.role}
                onEdit={(item) => {
                  navigate(`/subscriptions/edit/${item.id}`);
                }}
                onConfirm={(item) => handleConfirmPayment(item)}
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
