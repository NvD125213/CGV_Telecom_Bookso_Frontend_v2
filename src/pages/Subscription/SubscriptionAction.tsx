import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import ComponentCard from "../../components/common/ComponentCard";
import { subscriptionService } from "../../services/subcription";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
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
import { useSelector } from "react-redux";
import { RootState } from "../../store";

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

  const updateParent = (list: string[]) => {
    onChange(list);
  };

  const handleAdd = () => setItems([...items, ""]);

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    updateParent(newItems);
  };

  const handleChange = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index] = val;
    setItems(newItems);
    updateParent(newItems);
  };

  useEffect(() => {
    setItems(value || []);
  }, [value]);

  return (
    <div>
      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0">
              <IoIosRemove size={20} />
            </button>

            <div className="flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Nhập giá trị"
                value={item}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mt-2">
          <IoIosAdd size={20} />
          Thêm mục
        </button>
      </div>
    </div>
  );
};

export const SubcriptionActionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const location = useLocation();
  const plan = location.state as PlanData | null;
  const user = useSelector((state: RootState) => state.auth.user);

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
  const { data: plansData, isLoading: isLoadingPlans } = useApi<any>(
    () =>
      form?.root_plan_id
        ? planService.getChildren(form.root_plan_id)
        : Promise.resolve(null),
    [form?.root_plan_id]
  );

  // Fetch all plans cho dropdown trong modal edit
  const { data: allPlansData } = useApi<any>(() => planService.get({}), []);
  const allPlans = allPlansData?.data?.items || [];

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
        Swal.fire("Lỗi", "Không thể tải danh sách gói bổ sung", "error");
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
        form.phone_numbers.length / phonePagination.limit
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
            "success"
          );
          navigate("/subscriptions");
        }
      }
    } catch (error: any) {
      if (error) {
        Swal.fire("Lỗi", error.response.data.detail, "error");
        console.error(
          "Subscription action failed:",
          error.response.data.detail
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
      subscription_id: form.id || 0,
      plan_id: item.plan_id,
      quantity: item.quantity,
      price_override_vnd: item.price_override_vnd,
      note: item.note || "",
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
            "error"
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

  // Phone numbers columns for ReusableTable
  const phoneColumns: {
    key: keyof PhoneNumber;
    label: string;
    type?: string;
    classname?: string;
  }[] = [
    { key: "phone_number", label: "Số điện thoại" },
    { key: "provider_name", label: "Provider" },
    { key: "type_name", label: "Type" },
    {
      key: "status",
      label: "Trạng thái",
      type: "span",
      classname:
        "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
    },
  ];

  // Subscription items columns for ReusableTable
  const itemColumns: {
    key: keyof SubscriptionItem;
    label: string;
  }[] = [
    { key: "plan_id", label: "Gói bổ sung" },
    { key: "quantity", label: "Số lượng" },
    { key: "price_override_vnd", label: "Giá (VND)" },
    { key: "note", label: "Ghi chú" },
  ];

  // Helper function để map plan_id thành tên plan
  const mapPlanIdToName = (planId: number): string => {
    const plan = allPlans.find((p: any) => p.id === planId);
    return plan ? plan.name : "-";
  };

  // Thêm subscription item
  const [modal, setModal] = useState<boolean>(false);
  const [selectedDataSubItem, setSelectedDataSubItem] = useState<any | null>(
    null
  );
  const onSelectModalSubmit = async (
    plan: PlanData,
    subscription_id: number
  ) => {
    setSelectedDataSubItem({
      data: plan,
      subscription_id: subscription_id,
    });
    setModal(true);
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
          "0"
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

  // Tạo chart options cho quota data
  const getQuotaChartOptions = (): ApexOptions => {
    const dates = comboDetailData.quota_data.map((item) => {
      const date = new Date(item.datemon);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    return {
      chart: {
        type: "line",
        height: 350,
        toolbar: {
          show: true,
        },
        fontFamily: "'Roboto', 'Arial', sans-serif", // font hỗ trợ tiếng Việt
      },

      stroke: {
        curve: "smooth",
        width: 2,
      },
      colors: ["#465FFF"],
      xaxis: {
        categories: dates,

        title: {
          text: "Thời gian",
          style: {
            fontSize: "14px",
          },
        },
      },
      yaxis: {
        title: {
          text: "Gọi ra",
          style: {
            fontSize: "14px",
          },
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
          formatter: (val: number) => `${val}`,
        },
      },
    };
  };

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
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [searchTerm, setSearchTerm] = useState("");

  // Lọc dữ liệu theo từ khóa tìm kiếm (ví dụ tìm theo cid, name, hoặc bất kỳ trường nào)
  const filteredData =
    comboDetailData.cids_data?.filter((item) =>
      Object.values(item)
        .join(" ") // nối tất cả giá trị thành chuỗi
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ) || [];

  // Sau đó phân trang dữ liệu filteredData thay vì comboDetailData.cids_data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <PageBreadcrumb
        pageTitle={
          isEdit ? "Chỉnh sửa thông tin book gói" : "Thông tin book gói"
        }
      />

      {/* Hiển thị thông tin gói cước đã chọn */}
      {((!isHavingID && plan) || (isHavingID && planData)) && (
        <ComponentCard className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Gói cước đã chọn
            </h3>
            <table className="min-w-full text-sm text-left text-blue-600">
              <thead>
                <tr className="border-b border-blue-200">
                  <th className="px-4 py-2 font-medium text-blue-700">
                    Tên gói
                  </th>
                  <th className="px-4 py-2 font-medium text-blue-700">
                    Số phút
                  </th>
                  <th className="px-4 py-2 font-medium text-blue-700">
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
        </ComponentCard>
      )}

      <ComponentCard>
        <div
          className={`grid gap-6 ${
            isHavingID ? "md:grid-cols-2 grid-cols-1" : "grid-cols-1"
          }`}>
          {" "}
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
              {user.role == 1 && isEdit && (
                <div>
                  <Label>Cấu hình mã trượt</Label>
                  <SlideForm
                    value={form.slide_users as string[]}
                    onChange={(updated) => handleChange("slide_users", updated)}
                  />
                </div>
              )}
            </>
          )}
        </div>
        {isHavingID && form.slide_users.length > 0 && (
          <div>
            <DualProgress
              total={planData?.minutes}
              current={comboDetailData.total_call_out}
              label="Số phút gọi"
            />
          </div>
        )}

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
      </ComponentCard>

      {isHavingID &&
        ((form.phone_numbers && form.phone_numbers.length > 0) ||
          (items && items.length > 0)) && (
          <ComponentCard className="mt-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("items")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "items"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}>
                  Gói bổ sung ({items.length})
                </button>
                <button
                  onClick={() => setActiveTab("phones")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "phones"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}>
                  Số điện thoại ({form.phone_numbers?.length || 0})
                </button>
              </nav>
            </div>

            {activeTab === "phones" &&
              form.phone_numbers &&
              form.phone_numbers.length > 0 && (
                <>
                  <ReusableTable
                    title="Danh sách số điện thoại"
                    data={form.phone_numbers.slice(
                      phonePagination.offset,
                      phonePagination.offset + phonePagination.limit
                    )}
                    columns={phoneColumns}
                    isLoading={loading}
                    error=""
                    disabled={true}
                    disabledReset={true}
                    showId={false}
                  />
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
              <ReusableTable
                title="Danh sách gói bổ sung"
                data={items.map((item) => ({
                  ...item,
                  id: item.id || 0,
                  plan_id: mapPlanIdToName(item.plan_id), // Map plan_id thành tên plan
                  price_override_vnd:
                    item.price_override_vnd?.toLocaleString("vi-VN"),
                  quantity: item.quantity?.toLocaleString("vi-VN"),
                }))}
                columns={itemColumns}
                isLoading={itemsLoading}
                error=""
                disabled={true}
                disabledReset={true}
                role={1}
                onEdit={(item) => {
                  // Khi edit, cần tìm lại item chính với plan_id là number
                  const originalItem = items.find(
                    (i) => i.id === (item as any).id
                  );
                  if (originalItem) {
                    handleEditItem(originalItem);
                  }
                }}
                onDelete={(id) => handleDeleteItem(Number(id))}
                showId={false}
              />
            )}

            {(activeTab === "phones" &&
              (!form.phone_numbers || form.phone_numbers.length === 0)) ||
            (activeTab === "items" && (!items || items.length === 0)) ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Không có dữ liệu
              </div>
            ) : null}
          </ComponentCard>
        )}

      {/* Hiển thị combo detail */}
      {isHavingID &&
        form.slide_users &&
        (form.slide_users as string[]).length > 0 && (
          <ComponentCard className="mt-6">
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
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">
                    Biểu đồ sử dụng (call_out)
                  </h4>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">
                        Tổng:
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {comboDetailData.total_call_out.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <Chart
                    options={getQuotaChartOptions()}
                    series={getQuotaChartSeries()}
                    type="line"
                    height={350}
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
          </ComponentCard>
        )}

      {/* Hiển thị danh sách plans để thêm vào subscription */}
      {isHavingID && (
        <ComponentCard className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Chọn gói bổ sung
          </h3>

          <div className="relative">
            {/* Nút scroll trái */}
            {canScrollLeft &&
              plansData?.data?.children &&
              plansData.data.children.length > 0 && (
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                  onClick={() => scroll("left")}>
                  <FiChevronLeft size={20} />
                </button>
              )}

            <div
              ref={scrollRef}
              className="flex w-full overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4 pb-4 hide-scrollbar">
              {isLoadingPlans ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 min-w-[40%] p-4 border border-gray-200 rounded-xl shadow animate-pulse snap-start bg-white dark:bg-gray-800">
                    <Skeleton height={180} className="mb-4 rounded-lg" />
                    <Skeleton
                      count={3}
                      height={20}
                      className="mb-2 rounded-md"
                    />
                    <Skeleton height={40} className="mt-4 rounded-md" />
                  </div>
                ))
              ) : !plansData?.data?.children ||
                plansData.data.children.length === 0 ? (
                <div className="w-full flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                      Không có gói cước phù hợp
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Không tìm thấy gói cước bổ sung cho hợp đồng này
                    </p>
                  </div>
                </div>
              ) : (
                plansData?.data?.children?.map((plan: PlanData) => (
                  <div
                    key={plan.id}
                    className="flex-shrink-0 min-w-[40%] snap-start">
                    <PricingCard
                      data={plan}
                      showBadge={false}
                      onSelect={() => onSelectModalSubmit(plan, form.id)}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Nút scroll phải */}
            {canScrollRight &&
              plansData?.data?.children &&
              plansData.data.children.length > 0 && (
                <button
                  className="absolute right-[-40px] top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:shadow-gray-900"
                  onClick={() => scroll("right")}>
                  <FiChevronRight
                    size={20}
                    className="text-gray-700 dark:text-white transition-colors duration-200"
                  />
                </button>
              )}
          </div>

          {plansData?.data?.children && plansData.data.children.length > 0 && (
            <Pagination
              data={planPagination}
              onChange={handlePlanPaginationChange}
            />
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
        </ComponentCard>
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
            value: (() => {
              const plan = allPlans.find(
                (p: any) => p.id === itemFormData.plan_id
              );
              return plan ? plan.name : "";
            })(),
            disabled: true,
            onChange: () => {}, // Không cho phép thay đổi
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
