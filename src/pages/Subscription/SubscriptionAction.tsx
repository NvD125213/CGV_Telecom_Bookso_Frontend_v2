import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import ComponentCard from "../../components/common/ComponentCard";
import { subscriptionService } from "../../services/subcription";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { PlanData } from "../../components/pricing-card/pricing-card";
import { useLocation } from "react-router-dom";
import ReusableTable from "../../components/common/ReusableTable";
import { planService } from "../../services/plan";
import { useApi } from "../../hooks/useApi";
import PricingCard from "../../components/pricing-card/pricing-card";
import { useScrollPagination } from "../../hooks/useScrollPagination";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import { Pagination } from "../../components/common/Pagination";
import PaginationComponent from "../../components/pagination/pagination";
import SubscriptionItemAction, {
  SubscriptionItem,
} from "./SubscriptionItemAction";
import {
  subscriptionItemService,
  getDetailCombo,
} from "../../services/subcription";
import CustomModal from "../../components/common/CustomModal";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import DualProgress from "../../components/progress-bar/DualProgress";
import { OutboundDidDisplay } from "./OutboundDidDisplay";
import { normalizeOutboundDidByRoute } from "../Plan/interfaces/Outbound";
import { useIsMobile } from "../../hooks/useScreenSize";
import TableMobile, {
  ActionButton,
  LabelValueItem,
} from "../../mobiles/TableMobile";
import { PencilIcon } from "../../icons";
import { RiDeleteBinLine } from "react-icons/ri";
import { GiConfirmed } from "react-icons/gi";

export interface PhoneNumber {
  phone_number: string;
  status: string;
  provider_name: string;
  type_name: string;
  id: number;
}

export interface SubcriptionData {
  id: number;
  customer_name: string;
  tax_code: string;
  contract_code: string;
  username: string;
  slide_users: Record<any, any>;
  root_plan_id: number | null;
  total_minutes: number;
  total_did: number;
  auto_renew: boolean;
  status: number;
  created_at: string;
  updated_at: string;
  expired: string;
  phone_numbers: PhoneNumber[];
  is_payment?: boolean;
  items: SubscriptionItem[];
}

export interface CidsData {
  cid: string;
  description: string;
  mb: number;
  name: string;
  ot: number;
  vn: number;
  vt: number;
}

export interface QuotaData {
  call_out: number;
  datemon: string;
}

export interface ComboDetailData {
  cids_data: CidsData[];
  quota_data: QuotaData[];
  cids_mb: number;
  cids_ot: number;
  cids_vn: number;
  cids_vt: number;
  total_call_out: number;
}

interface SlideFormProps {
  value: string[]; // thay vì Record
  onChange: (value: string[]) => void;
}

export const SlideForm = ({ value, onChange }: SlideFormProps) => {
  const [items, setItems] = useState<string[]>(value || []);
  const [input, setInput] = useState("");

  useEffect(() => {
    setItems(value || []);
  }, [value]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-indigo-500">
        {/* Tags */}
        {items.map((item, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
            <span>{item}</span>
          </div>
        ))}

        {/* Input */}
      </div>
    </div>
  );
};

const CardWrapper = ({
  children,
  className = "",
  isMobile,
}: {
  children: ReactNode;
  className?: string;
  isMobile: boolean;
}) => {
  return isMobile ? (
    <div className={className}>{children}</div>
  ) : (
    <ComponentCard className={className}>{children}</ComponentCard>
  );
};

export const SubcriptionActionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const location = useLocation();
  const plan = location.state as PlanData | null;
  // const user = useSelector((state: RootState) => state.auth.user);

  // Các mode
  const isEdit = location.pathname.includes(`/subscriptions/edit/${id}`)
    ? true
    : false;
  const isDetail = location.pathname.includes(`/subscriptions/detail/${id}`)
    ? true
    : false;
  const isCreate = location.pathname.includes(`/subscriptions/create`)
    ? true
    : false;

  const isHavingID = Boolean(id);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [form, setForm] = useState<SubcriptionData>({
    id: 0,
    customer_name: "",
    tax_code: "",
    contract_code: "",
    username: "",
    slide_users: [],
    root_plan_id: null,
    total_minutes: 0,
    total_did: 0,
    auto_renew: false,
    status: 0,
    created_at: "",
    updated_at: "",
    expired: "",
    phone_numbers: [],
    items: [],
  });

  useEffect(() => {
    if (!isHavingID) {
      // Kiểm tra nếu không có plan data và đang tạo mới
      if (!plan) {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo",
          text: "Vui lòng chọn gói cước trước khi tạo thông tin",
          confirmButtonText: "Quay lại",
        }).then(() => {
          navigate("/subscriptions");
        });
        return;
      }

      // Nếu đang tạo mới và có plan data, set root_plan_id
      setForm({
        id: 0,
        customer_name: "",
        tax_code: "",
        contract_code: "",
        username: "",
        slide_users: [],
        root_plan_id: plan.id,
        total_minutes: 0,
        total_did: 0,
        auto_renew: false,
        status: 0,
        created_at: "",
        updated_at: "",
        expired: "",
        phone_numbers: [],
        items: [],
      });
    }
  }, [isHavingID, plan, navigate]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);

  // State cho danh sách subscription items
  const [items, setItems] = useState<SubscriptionItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // State cho tab active
  const [activeTab, setActiveTab] = useState<"phones" | "items">("items");

  // State cho phân trang của phones
  const [phonePagination, setPhonePagination] = useState({
    limit: 20,
    offset: 0,
    totalPages: 1,
  });

  // State cho edit/delete subscription items
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null);
  const [itemFormData, setItemFormData] = useState<SubscriptionItem>({
    subscription_id: form.id || 0,
    plan_id: 0,
    quantity: 1,
    price_override_vnd: 0,
    note: "",
  });
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemErrors, setItemErrors] = useState<
    Partial<Record<keyof SubscriptionItem, string>>
  >({});

  // Cập nhật subscription_id trong itemFormData khi form.id thay đổi
  useEffect(() => {
    setItemFormData((prev) => ({
      ...prev,
      subscription_id: form.id || 0,
    }));
  }, [form.id]);

  // State cho danh sách plans
  const [planQuery, setPlanQuery] = useState({
    page: 1,
    size: 10,
    order_by: "created_at",
    order_dir: "desc",
    is_root: "False",
  });
  const [planPagination, setPlanPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 1,
  });

  // Fetch plans với useApi
  const {
    data: plansData,
    isLoading: isLoadingPlans,
    refetch: refetchChildPlans,
  } = useApi<any>(
    () =>
      form?.root_plan_id
        ? planService.getChildren(form.root_plan_id)
        : Promise.resolve(null),
    [form?.root_plan_id],
  );

  const { scrollRef, canScrollLeft, canScrollRight, scroll } =
    useScrollPagination<PlanData>([]);

  // Cập nhật pagination khi plansData thay đổi
  useEffect(() => {
    if (plansData?.data?.meta) {
      setPlanPagination(plansData.data.meta);
    }
  }, [plansData]);

  // Kiểm tra nút cuộn sau khi plans load xong
  useEffect(() => {
    if (!isLoadingPlans && plansData?.data?.items) {
      setTimeout(() => {
        const el = scrollRef.current;
        if (el) {
          const { scrollWidth, clientWidth } = el;
          if (scrollWidth > clientWidth) {
            el.scrollLeft = 0;
          }
          el.dispatchEvent(new Event("scroll"));
        }
      }, 100);
    }
  }, [isLoadingPlans, plansData, scrollRef]);

  /** --- Load data if update mode --- */
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const res = await subscriptionService.getById(Number(id));
        if (res?.data) {
          setForm(res.data);
          // Fetch thông tin plan nếu có root_plan_id
          if (res.data.root_plan_id) {
            try {
              const planRes = await planService.getById(res.data.root_plan_id);
              if (planRes?.data) {
                setPlanData(planRes.data);
              }
            } catch (err) {
              console.error("Không thể tải thông tin gói cước:", err);
            }
          }
        }
      } catch {
        Swal.fire("Lỗi", "Không thể tải thông tin hợp đồng", "error");
      } finally {
        setLoading(false);
      }
    };

    if (!isHavingID) return;
    fetchSubscription();
  }, [id, isHavingID]);

  /** --- Load subscription items --- */
  useEffect(() => {
    if (!isHavingID || !id || !form.id || form.id === 0 || loading) return;

    const fetchItems = async () => {
      try {
        setItemsLoading(true);
        const response = await subscriptionItemService.get({
          subscription_id: form.id,
        });
        setItems(response.data?.items || []);
      } catch (error: any) {
        console.error("Lỗi khi tải subscription items:", error);
      } finally {
        setItemsLoading(false);
      }
    };

    fetchItems();
  }, [isHavingID, id, form.id, loading]); // Thêm các dependency để kiểm soát tốt hơn

  // Set tháng/năm mặc định là tháng hiện tại
  useEffect(() => {
    if (
      isHavingID &&
      form.slide_users &&
      (form.slide_users as string[]).length > 0
    ) {
      const now = new Date();
      const currentMonth = String(now.getMonth() + 1);
      const currentYear = String(now.getFullYear());

      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }
  }, [isHavingID, form.slide_users]);

  // Cập nhật tổng số trang cho phones khi phone_numbers thay đổi
  useEffect(() => {
    if (form.phone_numbers && form.phone_numbers.length > 0) {
      const totalPages = Math.ceil(
        form.phone_numbers.length / phonePagination.limit,
      );
      setPhonePagination((prev) => ({ ...prev, totalPages }));
    }
  }, [form.phone_numbers, phonePagination.limit]);

  // Handler cho pagination
  const handlePlanPaginationChange = (page: number, size: number) => {
    setPlanQuery({ ...planQuery, page, size });
  };

  // Handler cho phone pagination
  const handlePhonePaginationChange = (_limit: number, offset: number) => {
    setPhonePagination((prev) => ({ ...prev, offset }));
  };

  const handlePhoneLimitChange = (_limit: number) => {
    // Không cần thay đổi limit, giữ cố định 20
  };

  /** --- Handle changes --- */
  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** --- Submit --- */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      setFormErrors({}); // clear lỗi cũ nếu hợp lệ
      setLoading(true);

      if (isHavingID) {
        await subscriptionService.update(Number(id), form as any);
        Swal.fire("Thành công", "Cập nhật hợp đồng thành công!", "success");
        navigate("/subscriptions");
      } else {
        const errors: string[] = [];

        if (!form.customer_name?.trim())
          errors.push("Tên khách hàng không được để trống");
        if (!form.contract_code?.trim())
          errors.push("Mã hợp đồng không được để trống");

        if (errors.length > 0) {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: errors.join("\n"),
          });
          return;
        }

        const result = await subscriptionService.create(form as any);
        if (result.status == 200) {
          Swal.fire(
            "Thành công",
            "Tạo thông tin gói book thành công",
            "success",
          );
          navigate("/subscriptions");
        }
      }
    } catch (error: any) {
      if (error) {
        Swal.fire("Lỗi", error.response.data.detail, "error");
        console.error(
          "Subscription action failed:",
          error.response.data.detail,
        );
      } else {
        Swal.fire("Lỗi", "Lỗi không xác định", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return "Chưa có";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  // Handle item form changes
  const handleItemFormChange = (field: keyof SubscriptionItem, value: any) => {
    setItemFormData((prev) => ({ ...prev, [field]: value }));
    setItemErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Validate item form
  const validateItemForm = (): boolean => {
    const newErrors: Partial<Record<keyof SubscriptionItem, string>> = {};

    if (!itemFormData.plan_id || itemFormData.plan_id === 0) {
      newErrors.plan_id = "Vui lòng chọn gói cước";
    }

    if (!itemFormData.quantity || itemFormData.quantity <= 0) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (itemFormData.price_override_vnd < 0) {
      newErrors.price_override_vnd = "Giá không hợp lệ";
    }

    setItemErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle edit item
  const handleEditItem = (item: SubscriptionItem) => {
    setEditingItem(item);
    setItemFormData({
      ...item, // Copy toàn bộ item, bao gồm plan
      plan: item.plan, // Đảm bảo plan được set
    });
    setIsItemModalOpen(true);
    setItemErrors({});
  };

  // Handle delete item
  const handleDeleteItem = (id: number) => {
    Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc chắn muốn xóa gói bổ sung này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await subscriptionItemService.delete(id);
          Swal.fire("Thành công", "Đã xóa gói bổ sung", "success");
          // Refresh items
          if (form.id && form.id > 0) {
            const response = await subscriptionItemService.get({
              subscription_id: form.id,
            });
            setItems(response.data?.items || []);
          }
        } catch (error: any) {
          Swal.fire(
            "Lỗi",
            error.response?.data?.detail || "Không thể xóa gói bổ sung",
            "error",
          );
        }
      }
    });
  };

  // Handle submit item
  const handleSubmitItem = async () => {
    if (!validateItemForm()) return;

    try {
      if (editingItem && editingItem.id) {
        // Update
        await subscriptionItemService.update(editingItem.id, itemFormData);
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Cập nhật gói bổ sung thành công!",
        });
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
      // Refresh items
      if (form.id && form.id > 0) {
        const response = await subscriptionItemService.get({
          subscription_id: form.id,
        });
        setItems(response.data?.items || []);
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.response?.data?.detail || "Có lỗi xảy ra",
      });
    }
  };

  const phoneStatusBadgeClass =
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500";

  const getItemColumns = () => [
    { key: "plan_name", label: "Gói bổ sung" },
    { key: "quantity", label: "Số lượng" },
    { key: "price_override_vnd", label: "Giá (VND)" },
    { key: "note", label: "Ghi chú" },
    {
      key: "status",
      label: "Trạng thái",
      render: (item: any) => {
        return item.status === 1
          ? {
              text: "Hoạt động",
              classname:
                "inline-flex items-center justify-center gap-1 px-4 py-1 rounded-full font-medium text-xs bg-success-50 text-success-600 dark:bg-success-500/15 min-w-[80px]",
            }
          : item.status === 2
            ? {
                text: "Đang chờ",
                classname:
                  "inline-flex items-center justify-center gap-1 px-4 py-1 rounded-full font-medium text-xs bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400 min-w-[80px]",
              }
            : {
                text: "Hết hạn",
                classname:
                  "inline-flex items-center justify-center gap-1 px-4 py-1 rounded-full font-medium text-xs bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500 min-w-[80px]",
              };
      },
    },
    { key: "is_payment", label: "Thanh toán" },
  ];

  const getItemStatusLabel = (status?: number) => {
    if (status === 1) return "Hoạt động";
    if (status === 2) return "Đang chờ";
    return "Hết hạn";
  };

  const paginatedPhones = useMemo(
    () =>
      (form.phone_numbers ?? []).slice(
        phonePagination.offset,
        phonePagination.offset + phonePagination.limit,
      ),
    [form.phone_numbers, phonePagination.offset, phonePagination.limit],
  );

  const convertItemsToMobileData = (
    data: SubscriptionItem[],
  ): LabelValueItem[][] =>
    data.map((item) => [
      { label: "id", value: item.id ?? 0, hidden: true },
      {
        label: "Gói bổ sung",
        value: item.plan?.name || "-",
        hideLabel: true,
      },
      {
        label: "Số lượng",
        value: item.quantity?.toLocaleString("vi-VN") ?? "-",
      },
      {
        label: "Giá (VND)",
        value: (
          item.price_override_vnd ??
          item.plan?.price_vnd ??
          0
        ).toLocaleString("vi-VN"),
      },
      { label: "Ghi chú", value: item.note || "-" },
      { label: "Trạng thái", value: getItemStatusLabel(item.status) },
      {
        label: "Thanh toán",
        value: item.is_payment ? "Đã thanh toán" : "Chưa thanh toán",
      },
    ]);

  const [modal, setModal] = useState<boolean>(false);
  const [selectedDataSubItem, setSelectedDataSubItem] = useState<any | null>(
    null,
  );
  const onSelectModalSubmit = async (
    plan: PlanData,
    subscription_id: number,
  ) => {
    setSelectedDataSubItem({
      data: plan,
      subscription_id: subscription_id,
    });
    setModal(true);
  };

  const handleDeleteChildPlan = async (plan: PlanData) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc chắn muốn xóa gói "${plan.name}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await planService.delete(plan.id);
      if (res.status === 200) {
        Swal.fire("Đã xóa!", `Gói "${plan.name}" đã được xóa.`, "success");
        await refetchChildPlans();
      } else {
        Swal.fire("Lỗi", "Không thể xóa gói này.", "error");
      }
    } catch (error: any) {
      Swal.fire("Lỗi", error?.response?.data?.detail || "Xảy ra lỗi", "error");
    }
  };

  // State cho combo detail
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [comboDetailData, setComboDetailData] = useState<ComboDetailData>({
    cids_data: [],
    quota_data: [],
    cids_mb: 0,
    cids_ot: 0,
    cids_vn: 0,
    cids_vt: 0,
    total_call_out: 0,
  });
  const [comboLoading, setComboLoading] = useState(false);

  // Tạo danh sách tháng và năm
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  // Tạo monthYear từ selectedMonth và selectedYear
  const monthYear =
    selectedYear && selectedMonth
      ? `${selectedYear}-${selectedMonth.padStart(2, "0")}`
      : "";

  // Fetch combo detail
  useEffect(() => {
    if (
      !isHavingID ||
      !selectedMonth ||
      !selectedYear ||
      !form.slide_users ||
      (form.slide_users as string[]).length === 0
    ) {
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setComboLoading(true);

        const list_account = JSON.stringify(form.slide_users);
        const monthYearValue = `${selectedYear}-${selectedMonth.padStart(
          2,
          "0",
        )}`;

        const response = await getDetailCombo(list_account, monthYearValue);
        if (response?.data) {
          setComboDetailData({
            ...response.data,
            cids_mb: response.data.cids_mb || 0,
            cids_ot: response.data.cids_ot || 0,
            cids_vn: response.data.cids_vn || 0,
            cids_vt: response.data.cids_vt || 0,
            total_call_out: response.data.total_call_out || 0,
          });
        }
      } catch (error: any) {
        console.error("Lỗi khi tải combo detail:", error);
      } finally {
        setComboLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [isHavingID, selectedMonth, selectedYear, form.slide_users]);

  const formatQuotaAxisValue = (val: number) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return String(val);
    if (Math.abs(n) >= 1_000_000) {
      return `${(n / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(n) >= 1_000) {
      return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    }
    return n.toLocaleString("vi-VN");
  };

  // Tạo chart options cho quota data
  const getQuotaChartOptions = useCallback(
    (compact = false): ApexOptions => {
      const dates = comboDetailData.quota_data.map((item) => {
        const date = new Date(item.datemon);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });

      const axisFontSize = compact ? "10px" : "12px";

      return {
        chart: {
          type: "line",
          toolbar: {
            show: !compact,
            tools: {
              download: !compact,
              selection: false,
              zoom: !compact,
              zoomin: !compact,
              zoomout: !compact,
              pan: false,
              reset: !compact,
            },
          },
          fontFamily: "'Roboto', 'Arial', sans-serif",
        },
        stroke: {
          curve: "smooth",
          width: compact ? 1.5 : 2,
        },
        colors: ["#465FFF"],
        grid: {
          padding: {
            left: compact ? 4 : 12,
            right: compact ? 8 : 16,
          },
        },
        xaxis: {
          categories: dates,
          tickAmount: compact
            ? Math.min(6, Math.max(dates.length - 1, 1))
            : undefined,
          title: {
            text: compact ? "" : "Thời gian",
            style: { fontSize: axisFontSize },
          },
          labels: {
            rotate: compact && dates.length > 4 ? -45 : 0,
            hideOverlappingLabels: true,
            style: { fontSize: axisFontSize },
          },
        },
        yaxis: {
          tickAmount: compact ? 4 : 6,
          forceNiceScale: true,
          min: 0,
          title: {
            text: compact ? "" : "Gọi ra",
            style: { fontSize: axisFontSize },
          },
          labels: {
            formatter: (val) =>
              compact ? formatQuotaAxisValue(val) : val.toLocaleString("vi-VN"),
            style: { fontSize: axisFontSize },
          },
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: false,
        },
        tooltip: {
          y: {
            formatter: (val: number) => val.toLocaleString("vi-VN"),
          },
        },
      };
    },
    [comboDetailData.quota_data],
  );

  const getQuotaChartSeries = () => {
    return [
      {
        name: "Call Out",
        data: comboDetailData.quota_data.map((item) => item.call_out),
      },
    ];
  };

  // Column cho bảng cids_data - động theo dữ liệu tổng
  const cidsColumns = [
    { key: "cid", label: "CID" },
    { key: "name", label: "Tên" },
    { key: "description", label: "Mô tả" },
    {
      key: "vt",
      label: `VT (${comboDetailData.cids_vt})`,
    },
    {
      key: "mb",
      label: `MB (${comboDetailData.cids_mb})`,
    },
    {
      key: "vn",
      label: `VN (${comboDetailData.cids_vn})`,
    },
    {
      key: "ot",
      label: `OT (${comboDetailData.cids_ot})`,
    },
  ];

  // Phân trang cho bảng cids_data
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const totalItems = comboDetailData.cids_data?.length || 0;
  const cids = comboDetailData.cids_data.map((item) => item.cid);
  const cidString = cids.join(",");
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [searchTerm, setSearchTerm] = useState("");

  // Lọc dữ liệu theo từ khóa tìm kiếm (ví dụ tìm theo cid, name, hoặc bất kỳ trường nào)
  const filteredData =
    comboDetailData.cids_data?.filter((item) =>
      Object.values(item)
        .join(" ") // nối tất cả giá trị thành chuỗi
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    ) || [];

  // Sau đó phân trang dữ liệu filteredData thay vì comboDetailData.cids_data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Xử lý xác nhận số
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
          const res = await subscriptionItemService.update(item.id, {
            is_payment: true,
          });
          if (res.status === 200) {
            Swal.fire(
              "Đã xác nhận!",
              `Thanh toán thành công cho hợp đồng book gói.`,
              "success",
            );
            navigate("/subscriptions");
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
      }
    });
  };

  const itemMobileActions: ActionButton[] = useMemo(
    () => [
      {
        icon: <PencilIcon className="h-4 w-4" />,
        label: "Chỉnh sửa",
        onClick: (id) => {
          const originalItem = items.find((i) => String(i.id) === String(id));
          if (originalItem) handleEditItem(originalItem);
        },
        color: "primary",
      },
      {
        icon: <RiDeleteBinLine className="h-4 w-4" />,
        label: "Xóa",
        onClick: (id) => handleDeleteItem(Number(id)),
        color: "error",
      },
      {
        icon: <GiConfirmed className="h-4 w-4" />,
        label: "Xác nhận thanh toán",
        onClick: (id) => {
          const originalItem = items.find((i) => String(i.id) === String(id));
          if (originalItem) {
            handleConfirmPayment({
              ...originalItem,
              customer_name: form.customer_name,
            });
          }
        },
        color: "success",
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, form.customer_name],
  );

  // Tính tổng minutes từ plan gốc + các subscription items
  const totalMinutes = useMemo(() => {
    // Minutes từ plan gốc
    const rootMinutes = form?.total_minutes || 0;

    // Tổng minutes từ các subscription items
    const itemsMinutes = items.reduce((sum, item) => {
      const planMinutes = item.plan?.minutes || 0; // Dùng trực tiếp từ item.plan
      return sum + planMinutes * item.quantity;
    }, 0);

    return rootMinutes + itemsMinutes;
  }, [form?.total_minutes, items]); // Loại bỏ allPlans

  const totalAddOnPrice = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    items.forEach((item) => {
      const plan = item.plan; // Dùng trực tiếp từ item.plan
      const price = item.price_override_vnd ?? plan?.price_vnd ?? 0;
      const totalPrice = price * item.quantity;
      if (item.is_payment) {
        paid += totalPrice;
      } else {
        unpaid += totalPrice;
      }
    });
    return { paid, unpaid };
  }, [items]);

  const outboundDidRoutes = useMemo(
    () =>
      normalizeOutboundDidByRoute(
        plan?.outbound_did_by_route ?? planData?.outbound_did_by_route,
      ),
    [plan?.outbound_did_by_route, planData?.outbound_did_by_route],
  );

  const isMobile = useIsMobile();

  const quotaChartOptions = useMemo(
    () => getQuotaChartOptions(isMobile),
    [getQuotaChartOptions, isMobile],
  );

  const quotaChartHeight = isMobile ? 220 : 350;

  return (
    <>
      {isMobile ? null : (
        <PageBreadcrumb
          pageTitle={
            isEdit ? "Chỉnh sửa thông tin book gói" : "Thông tin book gói"
          }
        />
      )}

      {/* Hiển thị thông tin gói cước đã chọn */}
      {((!isHavingID && plan) || (isHavingID && planData)) && (
        <CardWrapper className="mb-6" isMobile={isMobile}>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Gói cước đã chọn
            </h3>
            <table className="min-w-full text-sm text-left text-blue-600 dark:text-blue-300">
              <thead>
                <tr className="border-b border-blue-200 dark:border-blue-700">
                  <th className="px-4 py-2 font-medium text-blue-700 dark:text-blue-300">
                    Tên gói
                  </th>
                  <th className="px-4 py-2 font-medium text-blue-700 dark:text-blue-300">
                    Số phút
                  </th>
                  <th className="px-4 py-2 font-medium text-blue-700 dark:text-blue-300">
                    Số CID
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">
                    {(plan || planData)?.name || "N/A"}
                  </td>
                  <td className="px-4 py-2">
                    {(plan || planData)?.minutes || 0}
                  </td>
                  <td className="px-4 py-2">
                    {(plan || planData)?.did_count || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardWrapper>
      )}

      <CardWrapper isMobile={isMobile}>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label>Tên khách hàng</Label>
            <Input
              type="text"
              value={form.customer_name}
              disabledWhite={isDetail}
              onChange={(e) => handleChange("customer_name", e.target.value)}
              placeholder="Nhập tên khách hàng"
            />
            {formErrors.customer_name && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.customer_name}
              </p>
            )}
          </div>
          <div>
            <Label>Gói cước đã chọn</Label>
            <Input
              type="text"
              value={(plan || planData)?.name}
              disabledWhite={isDetail || isEdit || isCreate}
            />
          </div>
          <div>
            <Label>Mã số thuế</Label>
            <Input
              type="text"
              value={form.tax_code}
              disabledWhite={isDetail}
              onChange={(e) => handleChange("tax_code", e.target.value)}
              placeholder="Nhập mã số thuế"
              disabled={loading}
            />
          </div>
          <div>
            <Label>Mã hợp đồng</Label>
            <Input
              type="text"
              value={form.contract_code}
              disabledWhite={isDetail}
              onChange={(e) => handleChange("contract_code", e.target.value)}
              placeholder="Nhập mã hợp đồng"
              disabled={loading}
            />
          </div>
          {isHavingID && (
            <>
              <div>
                <Label>Tổng số phút</Label>
                <Input
                  type="number"
                  value={form.total_minutes}
                  onChange={(e) =>
                    handleChange("total_minutes", Number(e.target.value))
                  }
                  className="text-gray-900 bg-gray-200 cursor-not-allowed border border-gray-300"
                  disabledWhite={isDetail}
                />
              </div>

              <div>
                <Label>Tổng số CID</Label>
                <Input
                  type="number"
                  value={form.total_did}
                  onChange={(e) =>
                    handleChange("total_did", Number(e.target.value))
                  }
                  disabledWhite={isDetail}
                  className="text-gray-900 bg-gray-200 cursor-not-allowed border border-gray-300"
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Ngày tạo</Label>
                <Input
                  type="text"
                  value={formatDate(form.created_at)}
                  placeholder="Ngày tạo"
                  disabledWhite={isDetail || isEdit}
                  className="text-gray-900 bg-gray-200 cursor-not-allowed border border-gray-300"
                />
              </div>

              <div>
                <Label>Ngày hết hạn</Label>
                <Input
                  type="text"
                  value={formatDate(form.expired)}
                  placeholder="Ngày hết hạn"
                  disabledWhite={isDetail || isEdit}
                  className="text-gray-900 bg-gray-200 cursor-not-allowed border border-gray-300"
                />
              </div>
            </>
          )}
          {/* Hiển thị Outbound CID Configuration */}
          {outboundDidRoutes.length > 0 && isHavingID && (
            <div>
              <OutboundDidDisplay
                value={outboundDidRoutes}
                title="Cấu hình Outbound CID"
              />
            </div>
          )}
          {isDetail && form.slide_users?.length > 0 && (
            <div>
              <Label>Danh sách mã trượt</Label>
              <SlideForm
                value={form.slide_users as string[]}
                onChange={(updated) => handleChange("slide_users", updated)}
              />
            </div>
          )}
          {isHavingID && form.slide_users.length > 0 && (
            <div>
              <DualProgress
                total={totalMinutes}
                current={comboDetailData.total_call_out}
                label="Số phút gọi"
              />
            </div>
          )}
        </div>

        {/* --- Submit --- */}
        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => navigate("/subscriptions")}
            disabled={loading}>
            Trở lại
          </Button>
          {(isCreate || isEdit) && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 font-semibold text-base">
              {loading
                ? "Đang lưu..."
                : isHavingID
                  ? "Xác nhận thông tin"
                  : "Xác nhận thông tin"}
            </button>
          )}
        </div>
      </CardWrapper>

      {isHavingID &&
        ((form.phone_numbers && form.phone_numbers.length > 0) ||
          (items && items.length > 0)) && (
          <CardWrapper className="mt-6" isMobile={isMobile}>
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <nav className="-mb-px flex gap-4 overflow-x-auto pb-1 sm:gap-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab("items")}
                    className={`shrink-0 border-b-2 px-1 py-3 text-xs font-medium whitespace-nowrap sm:py-4 sm:text-sm ${
                      activeTab === "items"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}>
                    Gói bổ sung ({items.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("phones")}
                    className={`shrink-0 border-b-2 px-1 py-3 text-xs font-medium whitespace-nowrap sm:py-4 sm:text-sm ${
                      activeTab === "phones"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}>
                    Số điện thoại ({form.phone_numbers?.length || 0})
                  </button>
                </nav>

                <div className="grid grid-cols-1 gap-2 text-right text-xs text-gray-600 sm:grid-cols-2 sm:gap-6 sm:text-sm dark:text-gray-400 lg:shrink-0">
                  <p className="sm:col-start-2">
                    Đã thanh toán:{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {totalAddOnPrice.paid.toLocaleString()} VND
                    </span>
                  </p>
                  <p className="sm:col-start-2">
                    Chưa thanh toán:{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {totalAddOnPrice.unpaid.toLocaleString()} VND
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {activeTab === "phones" &&
              form.phone_numbers &&
              form.phone_numbers.length > 0 && (
                <>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Danh sách số điện thoại
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full min-w-[28rem] text-left text-xs sm:text-sm">
                        <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                          <tr>
                            <th className="whitespace-nowrap px-3 py-2 font-medium">
                              Số điện thoại
                            </th>
                            <th className="whitespace-nowrap px-3 py-2 font-medium">
                              Provider
                            </th>
                            <th className="whitespace-nowrap px-3 py-2 font-medium">
                              Type
                            </th>
                            <th className="whitespace-nowrap px-3 py-2 font-medium">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {loading ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                                Đang tải...
                              </td>
                            </tr>
                          ) : paginatedPhones.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                                Không có dữ liệu
                              </td>
                            </tr>
                          ) : (
                            paginatedPhones.map((phone) => (
                              <tr
                                key={phone.id}
                                className="text-gray-700 dark:text-gray-300">
                                <td className="whitespace-nowrap px-3 py-2 font-medium">
                                  {phone.phone_number || "-"}
                                </td>
                                <td className="px-3 py-2">
                                  {phone.provider_name || "-"}
                                </td>
                                <td className="px-3 py-2">
                                  {phone.type_name || "-"}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={phoneStatusBadgeClass}>
                                    {phone.status || "-"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {form.phone_numbers.length > phonePagination.limit && (
                    <div className="mt-4">
                      <PaginationComponent
                        limit={phonePagination.limit}
                        offset={phonePagination.offset}
                        totalPages={phonePagination.totalPages}
                        onPageChange={handlePhonePaginationChange}
                        onLimitChange={handlePhoneLimitChange}
                        showLimitSelector={false}
                      />
                    </div>
                  )}
                </>
              )}

            {activeTab === "items" && items && items.length > 0 && (
              <>
                {isMobile ? (
                  itemsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
                    </div>
                  ) : (
                    <TableMobile
                      data={convertItemsToMobileData(items)}
                      actions={itemMobileActions}
                      hideCheckbox
                      hidePagination
                      showAllData
                      disabled
                      disabledReset
                      useTailwindStyling
                      labelClassNames={{
                        "Gói bổ sung": "text-base font-extrabold uppercase",
                      }}
                      valueClassNames={{
                        "Gói bổ sung": `
                          text-base font-semibold
                          bg-blue-50 text-blue-800
                          dark:bg-blue-900 dark:text-blue-100
                          px-4 py-2 rounded-lg
                          border border-blue-200 dark:border-blue-700
                          text-center shadow-sm font-sans
                        `,
                      }}
                    />
                  )
                ) : (
                  <div className="overflow-x-auto">
                    <ReusableTable
                      title="Danh sách gói bổ sung"
                      data={items.map((item) => ({
                        ...item,
                        id: item.id || 0,
                        plan_name: item.plan?.name || "-",
                        price_override_vnd:
                          item.price_override_vnd?.toLocaleString("vi-VN"),
                        note: item.note || "-",
                        quantity: item.quantity?.toLocaleString("vi-VN"),
                        is_payment: item.is_payment
                          ? "Đã thanh toán"
                          : "Chưa thanh toán",
                      }))}
                      columns={getItemColumns()}
                      isLoading={itemsLoading}
                      error=""
                      disabled={true}
                      disabledReset={true}
                      onConfirm={(item) => handleConfirmPayment(item)}
                      role={1}
                      onEdit={(item) => {
                        const originalItem = items.find(
                          (i) => i.id === (item as any).id,
                        );
                        if (originalItem) {
                          handleEditItem(originalItem);
                        }
                      }}
                      onDelete={(id) => handleDeleteItem(Number(id))}
                      showId={false}
                    />
                  </div>
                )}
              </>
            )}

            {(activeTab === "phones" &&
              (!form.phone_numbers || form.phone_numbers.length === 0)) ||
            (activeTab === "items" && (!items || items.length === 0)) ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Không có dữ liệu
              </div>
            ) : null}
          </CardWrapper>
        )}

      {/* Hiển thị combo detail */}
      {isHavingID &&
        form.slide_users &&
        (form.slide_users as string[]).length > 0 && (
          <CardWrapper className="mt-6" isMobile={isMobile}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Chi tiết combo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Chọn năm</Label>
                <Select
                  placeholder="Chọn năm"
                  options={years}
                  value={selectedYear}
                  onChange={(value) => setSelectedYear(value)}
                />
              </div>
              <div>
                <Label>Chọn tháng</Label>
                <Select
                  placeholder="Chọn tháng"
                  options={months}
                  value={selectedMonth}
                  onChange={(value) => setSelectedMonth(value)}
                />
              </div>
            </div>

            {comboLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            )}
            {/* Biểu đồ Quota */}
            {comboDetailData.quota_data?.length > 0 && (
              <div>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 sm:text-md dark:text-gray-300">
                    Biểu đồ sử dụng (call_out)
                  </h4>
                  <div className="text-xs sm:text-sm">
                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                      Tổng:{" "}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {comboDetailData.total_call_out.toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-2 sm:p-4 dark:border-gray-700 dark:bg-gray-800">
                  <Chart
                    key={
                      isMobile ? "quota-chart-mobile" : "quota-chart-desktop"
                    }
                    options={quotaChartOptions}
                    series={getQuotaChartSeries()}
                    type="line"
                    height={quotaChartHeight}
                    width="100%"
                  />
                </div>
              </div>
            )}

            {!comboLoading && selectedMonth && selectedYear && monthYear && (
              <>
                {/* Bảng CIDs */}
                {comboDetailData.cids_data?.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-3">
                      <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">
                        Thông tin CID ({totalItems} mục)
                      </h4>

                      {/* Thanh tìm kiếm */}
                      <input
                        type="text"
                        placeholder="Tìm kiếm CID..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1); // reset về trang đầu khi tìm kiếm
                        }}
                        className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200"
                      />
                    </div>

                    {/* Chỉ overflow ở đây */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-y-auto">
                      <ReusableTable
                        title=""
                        data={paginatedData.map((item, index) => ({
                          ...item,
                          id: index + 1 + (currentPage - 1) * itemsPerPage, // đảm bảo id duy nhất theo trang
                        }))}
                        columns={cidsColumns}
                        isLoading={false}
                        error=""
                        classname="!overflow-visible"
                        disabled={true}
                        disabledReset={true}
                        showId={false}
                      />
                    </div>

                    {/* Pagination controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-4 gap-2">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((prev) => prev - 1)}
                          className={`px-3 py-1 border rounded ${
                            currentPage === 1
                              ? "text-gray-400 border-gray-300 cursor-not-allowed"
                              : "text-indigo-600 border-indigo-400 hover:bg-indigo-50"
                          }`}>
                          Trước
                        </button>
                        <span className="px-2 py-1 text-sm text-gray-600 dark:text-gray-300">
                          Trang {currentPage}/{totalPages}
                        </span>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          className={`px-3 py-1 border rounded ${
                            currentPage === totalPages
                              ? "text-gray-400 border-gray-300 cursor-not-allowed"
                              : "text-indigo-600 border-indigo-400 hover:bg-indigo-50"
                          }`}>
                          Sau
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Không có dữ liệu */}
                {comboDetailData.cids_data?.length === 0 &&
                  comboDetailData.quota_data?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Không có dữ liệu cho tháng/năm đã chọn
                    </div>
                  )}
              </>
            )}
          </CardWrapper>
        )}

      {/* Hiển thị danh sách plans để thêm vào subscription */}
      {isHavingID && (
        <CardWrapper className="mt-6" isMobile={isMobile}>
          <h3 className="mb-3 text-base font-semibold text-gray-800 sm:mb-4 sm:text-lg dark:text-gray-200">
            Chọn gói bổ sung
          </h3>

          <div
            className={`relative ${
              (plansData?.data?.children?.length ?? 0) > 1
                ? "px-9 sm:px-10"
                : ""
            }`}>
            {!isLoadingPlans &&
              (plansData?.data?.children?.length ?? 0) > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Gói trước"
                    disabled={!canScrollLeft}
                    className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 sm:h-9 sm:w-9"
                    onClick={() => scroll("left")}>
                    <FiChevronLeft
                      size={18}
                      className="text-gray-700 dark:text-white"
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Gói sau"
                    disabled={!canScrollRight}
                    className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 sm:h-9 sm:w-9"
                    onClick={() => scroll("right")}>
                    <FiChevronRight
                      size={18}
                      className="text-gray-700 dark:text-white"
                    />
                  </button>
                </>
              )}

            <div
              ref={scrollRef}
              className="hide-scrollbar flex w-full snap-x snap-mandatory items-start justify-start gap-3 overflow-x-auto scroll-smooth pb-1 sm:gap-6">
              {isLoadingPlans ? (
                Array.from({ length: isMobile ? 1 : 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full max-w-md shrink-0 snap-start self-start rounded-xl border border-gray-200 bg-white p-3 shadow animate-pulse dark:border-gray-700 dark:bg-gray-800 sm:p-4">
                    <Skeleton
                      height={isMobile ? 140 : 180}
                      className="mb-3 rounded-lg sm:mb-4"
                    />
                    <Skeleton
                      count={3}
                      height={16}
                      className="mb-2 rounded-md"
                    />
                    <Skeleton height={36} className="mt-3 rounded-md sm:mt-4" />
                  </div>
                ))
              ) : !plansData?.data?.children ||
                plansData.data.children.length === 0 ? (
                <div className="flex w-full items-center justify-center py-10 sm:py-12">
                  <div className="text-center">
                    <p className="mb-1 text-base text-gray-500 sm:mb-2 sm:text-lg dark:text-gray-400">
                      Không có gói cước phù hợp
                    </p>
                    <p className="text-xs text-gray-400 sm:text-sm dark:text-gray-500">
                      Không tìm thấy gói cước bổ sung cho hợp đồng này
                    </p>
                  </div>
                </div>
              ) : (
                plansData.data.children.map((plan: PlanData) => (
                  <div
                    key={plan.id}
                    className="w-full max-w-md shrink-0 snap-start self-start">
                    <PricingCard
                      data={plan}
                      showBadge={false}
                      className="w-full items-start! justify-start! p-0!"
                      onSelect={() => onSelectModalSubmit(plan, form.id)}
                      onDelete={handleDeleteChildPlan}
                      onDetail={() => navigate(`/plans/edit/${plan.id}`)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {plansData?.data?.children && plansData.data.children.length > 0 && (
            <div className="mt-3 sm:mt-4">
              <Pagination
                data={planPagination}
                onChange={handlePlanPaginationChange}
              />
            </div>
          )}
          <SubscriptionItemAction
            subscriptionId={form.id}
            plan={plan}
            externalModalState={modal}
            onExternalModalClose={() => {
              setModal(false);
              setSelectedDataSubItem(null);
            }}
            preSelectedPlan={selectedDataSubItem?.data}
            onRefreshItems={async () => {
              if (form.id && form.id > 0) {
                try {
                  setItemsLoading(true);
                  const response = await subscriptionItemService.get({
                    subscription_id: form.id,
                  });
                  setItems(response.data?.items || []);
                } catch (error: any) {
                  console.error("Lỗi khi tải subscription items:", error);
                } finally {
                  setItemsLoading(false);
                }
              }
            }}
          />
        </CardWrapper>
      )}

      {/* Modal edit subscription item */}
      <CustomModal
        isOpen={isItemModalOpen}
        title="Cập nhật gói bổ sung"
        fields={[
          {
            name: "plan_id",
            label: "Gói cước",
            type: "text",
            value: itemFormData.plan?.name || "-", // Hiển thị tên từ plan object
            disabled: true,
            onChange: () => {},
            error: itemErrors.plan_id,
          },
          {
            name: "quantity",
            label: "Số lượng",
            type: "number",
            value: itemFormData.quantity,
            onChange: (value) =>
              handleItemFormChange("quantity", Number(value)),
            error: itemErrors.quantity,
          },
          {
            name: "price_override_vnd",
            label: "Giá thay đổi (VND)",
            type: "number",
            value: itemFormData.price_override_vnd,
            onChange: (value) =>
              handleItemFormChange("price_override_vnd", Number(value)),
            error: itemErrors.price_override_vnd,
          },
          {
            name: "note",
            label: "Ghi chú",
            type: "textarea",
            value: itemFormData.note,
            onChange: (value) => handleItemFormChange("note", value as string),
            error: itemErrors.note,
          },
        ]}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
          setItemErrors({});
        }}
        onSubmit={handleSubmitItem}
        submitText="Cập nhật"
      />
    </>
  );
};
