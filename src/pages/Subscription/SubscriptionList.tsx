import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useState, useEffect, useRef, useMemo } from "react";
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
import { CustomSubscriptionTable } from "./SubscriptionTable";
import ModalRenew from "./ModalRenew";
import Swal from "sweetalert2";

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
  created_month?: string;
}

const SubsciptionList = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<SubcriptionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile(768);
  const user = useSelector((state: RootState) => state.auth.user);

  // Tính tháng hiện tại cho created_at filter
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  };

  const [query, setQuery] = useQuerySync<SubscriptionQuery>({
    page: 1,
    size: 10,
    order_by: "created_at",
    order_dir: "desc",
    created_month: getCurrentMonth(), // Mặc định lọc theo created_at trong tháng hiện tại
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

  const queryKey = useMemo(() => {
    return `${query.page}_${query.size}_${query.order_by}_${query.order_dir}_${
      query.search || ""
    }_${query.status || ""}_${query.root_plan_id || ""}_${
      query.expired_from || ""
    }_${query.expired_to || ""}_${query.created_month || ""}_${
      query.auto_renew ?? ""
    }_${query.is_payment ?? ""}`;
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
    query.created_month,
    query.auto_renew,
    query.is_payment,
  ]);

  // FIX: Dùng state thay vì ref để trigger useEffect
  const [quotaBody, setQuotaBody] = useState<any[]>([]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const result = await subscriptionService.get(query);
      setSubscriptions(result.data?.items || []);

      const listAccount =
        result.data?.items
          ?.filter((sub: any) => (sub.slide_users?.length || 0) > 0)
          ?.map((item: any) => ({
            sub_Id: item.id,
            list_account: item.slide_users || [],
          })) || [];

      // FIX: Set vào state để trigger useEffect quota
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

  const { data: plansData, isLoading: isLoadingPlans } = useApi(() =>
    planService.get({
      size: 100,
      page: 1, // nếu API yêu cầu cả `page`
    })
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
        const itemsTotal = items
          .filter((i) => i.status == 1)
          .reduce((sum: number, item: any) => {
            const price = item.price_override_vnd || 0;
            return sum + price;
          }, 0);
        const totalPrice = planPrice + itemsTotal;

        return {
          ...item,
          customer_name: item.customer_name,
          tax_code: item.tax_code,
          contract_code: item.contract_code,
          username: item.username,
          sub_price: planPrice,
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
          total_did: item.total_did,
          total_minutes: item.total_minutes,
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

  const handleConfirmPayment = async (item: any) => {
    Swal.fire({
      title: "Xác nhận thanh toán",
      text: `Bạn có chắc chắn muốn xác nhận thanh toán gói cho khách hàng ${item.customer_name} không?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await subscriptionService.update(item.id, {
            is_payment: true,
          });
          if (res.status === 200) {
            Swal.fire(
              "Đã xác nhận!",
              `Thanh toán thành công cho hợp đồng book gói.`,
              "success"
            );
            fetchSubscriptions();
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

  const [quotaData, setQuotaData] = useState<any[]>([]);

  // FIX: Giờ quotaBody đã là state nên useEffect sẽ chạy đúng
  useEffect(() => {
    const fetchQuota = async () => {
      if (!quotaBody || quotaBody.length === 0) return;
      try {
        const data = await getQuota(
          quotaBody,
          query.created_month || getCurrentMonth()
        );
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
  }, [quotaBody, query.created_month]);

  // FIX: useMemo để tránh tạo array mới mỗi lần render
  const mapData = useMemo(() => {
    if (!subscriptions.length || !plansData?.data.items) return [];

    const plansMap: Map<number, any> = new Map();
    plansData.data.items.forEach((plan: any) => {
      plansMap.set(plan.id, plan);
    });

    return processedData.map((sub: any) => {
      const quota = quotaData?.find((q: any) => q.sub_Id === sub.id);

      let totalPlanMinutes = 0;
      let totalPlanDidCount = 0;

      const planDetails = sub.items
        .map((item: any) => {
          const plan = plansMap.get(item.plan_id);
          if (!plan) return null;

          return {
            id: item.id, // dùng sub item id để đảm bảo unique
            planId: plan.id,
            name: plan.name,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at,
            expired: item.expired,
            is_payment: item.is_payment,
            released_at: item.released_at,
            note: item.note,
            quantity: item.quantity,
            price: item.price_override_vnd,
            minutes: plan.minutes || 0, // Thêm minutes riêng cho từng plan
          };
        })
        .filter(Boolean);

      // Chỉ cộng minutes và did_count cho các sub có status == 1
      sub.items.forEach((item: any) => {
        if (item.status == 1) {
          const plan = plansMap.get(item.plan_id);
          if (plan) {
            totalPlanMinutes += plan.minutes || 0;
            totalPlanDidCount += plan.did_count || 0;
          }
        }
      });
      const mainSub = {
        id: sub.id,
        name: sub.root_plan_id,
        status: sub.status,
        created_at: sub.created_at,
        expired: sub.expired,
        updated_at: sub.updated_at,
        is_payment: sub.is_payment,
        released_at: sub.released_at,
        note: sub.note || null,
        price: sub.sub_price,
        quantity: sub.quantity || null,
        total_minutes: (sub.total_minutes || 0) + totalPlanMinutes,
        total_did: totalPlanDidCount + sub.total_did,
        contract_code: sub.contract_code,
        minutes: sub.total_minutes || 0, // Thêm minutes riêng cho main sub (root plan)
      };

      return {
        ...sub,
        totalProgress: (sub.total_minutes || 0) + totalPlanMinutes,
        currentProgress: quota?.total_call_out || 0,
        total_price: sub.total_price || 0,
        total_minutes: (sub.total_minutes || 0) + totalPlanMinutes,
        main_sub: mainSub,
        list_sub_plan: planDetails,
        total_did: totalPlanDidCount + sub.total_did,
      };
    });
  }, [processedData, quotaData, subscriptions.length, plansData]);

  // Xử lý phần gia hạn
  const [openModalRenew, setOpenModalRenew] = useState(false);
  const [renewData, setRenewData] = useState<any>(null);

  // State cho plans trong modal renew
  const [renewPlans, setRenewPlans] = useState<any[]>([]);
  const [renewCurrentPage, setRenewCurrentPage] = useState(1);
  const [renewTotalPages, setRenewTotalPages] = useState(1);
  const [renewLoading, setRenewLoading] = useState(false);

  // Load plans cho modal renew
  const loadRenewPlans = async (page: number) => {
    setRenewLoading(true);
    try {
      const response = await planService.get({
        page: page,
        size: 20,
        order_by: "created_at",
        order_dir: "desc",
        is_root: "true",
      });

      setRenewPlans(response.data?.items || []);
      setRenewCurrentPage(page);
      setRenewTotalPages(Math.ceil((response.data?.meta?.total || 0) / 20));
    } catch (error) {
      console.error("Error loading renew plans:", error);
      setRenewPlans([]);
    } finally {
      setRenewLoading(false);
    }
  };

  // Xử lý gia hạn gói
  const handleRenew = async (
    item: any,
    type: "renew" | "new",
    plan_id: number // Bắt buộc phải có plan_id
  ) => {
    try {
      const payload: any = {
        customer_name: item.customer_name || "",
        tax_code: item.tax_code || "",
        contract_code: item.contract_code || "",
        root_plan_id: plan_id, // Luôn có root_plan_id
      };

      const result = await Swal.fire({
        title: "Xác nhận gia hạn",
        text:
          type === "renew"
            ? "Bạn có chắc chắn muốn gia hạn gói cũ không?"
            : "Bạn có chắc chắn muốn chuyển sang gói mới không?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        const res = await subscriptionService.reNewSubcription(
          item.id,
          payload
        );

        if (res.status === 200) {
          await Swal.fire({
            icon: "success",
            title: "Gia hạn thành công!",
            text:
              type === "renew"
                ? "Gói cũ đã được gia hạn."
                : "Đã chuyển sang gói mới.",
            confirmButtonColor: "#3085d6",
          });

          // Refresh danh sách
          fetchSubscriptions();
          setOpenModalRenew(false);
        } else {
          Swal.fire("Lỗi", "Không thể gia hạn gói này.", "error");
        }
      }
    } catch (error: any) {
      Swal.fire(
        "Lỗi",
        error?.response?.data?.detail || "Xảy ra lỗi khi gia hạn",
        "error"
      );
    }
  };

  // Load plans ngay khi component mount
  useEffect(() => {
    loadRenewPlans(1);
  }, []);

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

            {/* Tháng tạo */}
            <div className="w-full">
              <Label>Thời gian tạo</Label>
              <Input
                type="month"
                value={query.created_month || ""}
                onChange={(e) =>
                  setQuery({
                    ...query,
                    created_month: e.target.value || undefined,
                  })
                }
                className="w-full border border-gray-300 px-3 py-2 rounded-md"
                placeholder="Chọn tháng"
              />
            </div>

            <div>
              <Label>Ngày hết hạn từ</Label>
              <Input
                type="datetime-local"
                value={query.expired_from}
                onChange={(e) => {
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
                value={query.expired_to}
                onChange={(e) => {
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

            {/* <div className="w-full">
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
            </div> */}
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
                onReload={() => {
                  return fetchSubscriptions();
                }}
                onRenew={(item) => {
                  setRenewData(item);
                  setOpenModalRenew(true);
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

      <ModalRenew
        open={openModalRenew}
        onClose={() => setOpenModalRenew(false)}
        item={renewData}
        onSubmit={(data) => {
          if (data.type === "renew") {
            // Tìm subscription gốc để lấy root_plan_id (number)
            const originalSub = subscriptions.find(
              (s) => s.id === renewData?.id
            );

            if (originalSub && originalSub.root_plan_id) {
              handleRenew(renewData, "renew", originalSub.root_plan_id);
            } else {
              console.error("Missing root_plan_id for renewal");
              Swal.fire(
                "Lỗi",
                "Không tìm thấy thông tin gói gốc để gia hạn",
                "error"
              );
            }
          } else if (data.type === "new" && data.planId) {
            handleRenew(renewData, "new", data.planId);
          }
        }}
        packages={renewPlans}
        currentPage={renewCurrentPage}
        totalPages={renewTotalPages}
        loading={renewLoading}
        onLoadPage={loadRenewPlans}
      />
    </>
  );
};

export default SubsciptionList;
