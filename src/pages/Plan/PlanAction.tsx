import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import ComponentCard from "../../components/common/ComponentCard";
import { planService } from "../../services/plan";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import { useApi } from "../../hooks/useApi";
import { getProviders } from "../../services/provider";
import { validateForm } from "../../validate/plan";
import PricingCard, {
  PlanData,
} from "../../components/pricing-card/pricing-card";
import { useScrollPagination } from "../../hooks/useScrollPagination";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface RouteEntry {
  key: string;
  value: number;
}

interface MetaEntry {
  key: string;
  value: string;
}

interface OutboundDidFormProps {
  value: Record<string, number>;
  meta: Record<string, string>;
  onChange: (value: Record<string, number>) => void;
  onMetaChange: (meta: Record<string, string>) => void;
}

export const OutboundDidForm = ({
  value,
  onChange,
  meta,
  onMetaChange,
}: OutboundDidFormProps) => {
  const { data: dataProviders, isLoading, error } = useApi(getProviders);

  const [routes, setRoutes] = useState<RouteEntry[]>(
    Object.keys(value).length > 0
      ? Object.entries(value).map(([key, val]) => ({ key, value: val }))
      : []
  );
  const [metaRoutes, setMetaRoutes] = useState<MetaEntry[]>(
    Object.entries(meta).map(([key, val]) => ({ key, value: val }))
  );

  const routeOptions = isLoading
    ? [{ label: "Đang tải...", value: "" }]
    : error
    ? [{ label: "Lỗi tải dữ liệu", value: "" }]
    : dataProviders?.map((p: any) => ({
        label: p.name,
        value: p.name,
      })) ?? [];

  const updateParent = (list: RouteEntry[]) => {
    const obj = Object.fromEntries(list.map((r) => [r.key, r.value]));
    onChange(obj);
  };

  const updateMetaParent = (list: MetaEntry[]) => {
    const obj = Object.fromEntries(list.map((r) => [r.key, r.value]));
    onMetaChange(obj);
  };

  // Outbound handlers
  const handleAdd = () => {
    const newRoutes = [...routes, { key: "", value: 0 }];
    setRoutes(newRoutes);
  };

  const handleRemove = (index: number) => {
    const newRoutes = routes.filter((_, i) => i !== index);
    setRoutes(newRoutes);
    updateParent(newRoutes);
  };

  const handleChange = (index: number, field: "key" | "value", val: any) => {
    const newRoutes = [...routes];
    newRoutes[index] = {
      ...newRoutes[index],
      [field]: field === "value" ? Number(val) : val,
    };
    setRoutes(newRoutes);
    updateParent(newRoutes);
  };

  // Meta handlers
  const handleMetaAdd = () => {
    const newRoutes = [...metaRoutes, { key: "", value: "" }];
    setMetaRoutes(newRoutes);
  };

  const handleMetaRemove = (index: number) => {
    const newRoutes = metaRoutes.filter((_, i) => i !== index);
    setMetaRoutes(newRoutes);
    updateMetaParent(newRoutes);
  };

  const handleMetaChange = (
    index: number,
    field: "key" | "value",
    val: any
  ) => {
    const newRoutes = [...metaRoutes];
    newRoutes[index] = {
      ...newRoutes[index],
      [field]: val,
    };
    setMetaRoutes(newRoutes);
    updateMetaParent(newRoutes);
  };

  // Cập nhật thay đổi khi vào mode edit
  useEffect(() => {
    setRoutes(
      Object.keys(value).length > 0
        ? Object.entries(value).map(([key, val]) => ({ key, value: val }))
        : []
    );
  }, [value]);

  useEffect(() => {
    setMetaRoutes(
      Object.entries(meta).map(([key, val]) => ({ key, value: val }))
    );
  }, [meta]);
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Outbound DID Section */}

        <div>
          <Label>Cấu hình Outbound CID</Label>
          <div className="flex flex-col gap-3 mt-3">
            {routes.map((route, index) => (
              <div key={index} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0">
                  <IoIosRemove size={20} />
                </button>

                <div className="flex-1 min-w-0">
                  <Select
                    options={routeOptions}
                    value={route.key}
                    onChange={(val) => handleChange(index, "key", val)}
                  />
                </div>

                <div className="w-24 flex-shrink-0">
                  <Input
                    type="number"
                    value={route.value}
                    onChange={(e) =>
                      handleChange(index, "value", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mt-2">
              <IoIosAdd size={20} />
              Thêm tuyến Outbound
            </button>
          </div>
        </div>

        {/* Meta Section */}
        <div>
          <Label>Cấu hình Meta</Label>
          <div className="flex flex-col gap-3 mt-3">
            {metaRoutes.map((route, index) => (
              <div key={index} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMetaRemove(index)}
                  className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0">
                  <IoIosRemove size={20} />
                </button>

                <div className="flex-1 min-w-0">
                  <Input
                    type="text"
                    value={route.key}
                    onChange={(val) =>
                      handleMetaChange(index, "key", val.target.value)
                    }
                    placeholder="Nhập giá trị key"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Input
                    type="text"
                    value={route.value}
                    onChange={(e) =>
                      handleMetaChange(index, "value", e.target.value)
                    }
                    placeholder="Nhập giá trị value"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleMetaAdd}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mt-2">
              <IoIosAdd size={20} />
              Thêm tuyến Meta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface PlanForm {
  name: string;
  parent_id: number | null;
  minutes: number;
  did_count: number;
  price_vnd: number;
  outbound_did_by_route: Record<any, any>;
  total_users: number;
  meta: Record<any, any>;
  is_active: boolean;
  status: number;
  expiration_time: string;
  expiration_time_package: number;
}

export const PlanActionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.auth.user);

  const isUpdate = Boolean(id);
  const [form, setForm] = useState<PlanForm>({
    name: "",
    parent_id: null,
    minutes: 0,
    did_count: 0,
    price_vnd: 0,
    outbound_did_by_route: {},
    total_users: 1,
    meta: {},
    is_active: true,
    status: 1,
    expiration_time: new Date().toISOString(),
    expiration_time_package: 3,
  });

  useEffect(() => {
    if (!isUpdate) {
      // Nếu đang tạo mới, reset form
      setForm({
        name: "",
        parent_id: null,
        minutes: 0,
        did_count: 0,
        price_vnd: 0,
        outbound_did_by_route: {},
        total_users: 1,
        meta: {},
        is_active: true,
        status: 1,
        expiration_time: new Date().toISOString(),
        expiration_time_package: 3,
      });
    }
  }, [isUpdate]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);

  const { data: dataPlans, isLoading: isLoadingPlans } = useApi(() =>
    planService.get({
      page: 1,
      size: 20,
      order_by: "created_at",
      order_dir: "desc",
      is_root: "true",
    })
  );

  /** --- Load data if update mode --- */
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const res = await planService.getById(Number(id));
        if (res?.data) setForm(res.data);
      } catch {
        Swal.fire("Lỗi", "Không thể tải thông tin gói cước", "error");
      } finally {
        setLoading(false);
      }
    };

    if (!isUpdate) return;
    fetchPlan();
  }, [id, isUpdate]);

  /** --- Handle changes --- */
  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** --- Submit --- */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const newErrors = validateForm(form);
      if (Object.keys(newErrors).length > 0) {
        const errorMessage = Object.entries(newErrors)
          .map(([_field, message]) => ` ${message}`)
          .join("\n");

        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: errorMessage,
        });

        setFormErrors(newErrors);
        return;
      }

      setFormErrors({}); // clear lỗi cũ nếu hợp lệ
      setLoading(true);

      if (isUpdate) {
        await planService.update(Number(id), form as any);
        Swal.fire("Thành công", "Cập nhật gói cước thành công!", "success");
        navigate("/plans");
      } else {
        const errors: string[] = [];

        if (!form.name?.trim()) errors.push("Tên gói không được để trống");

        const result = await planService.create(form as any);
        if (result.status == 200) {
          Swal.fire("Thành công", "Tạo gói thành công", "success");
          navigate("/plans");
        }
      }
    } catch (error: any) {
      if (error) {
        Swal.fire("Lỗi", error.response.data.detail, "error");
        console.error("Plan action failed:", error.response.data.detail);
      } else {
        Swal.fire("Lỗi", "Lỗi không xác định", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const [currency, setCurrency] = useState("");
  const handleCurrency = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, ""); // chỉ giữ số
    if (!rawValue) {
      setCurrency("");
      handleChange("price_vnd", 0);
      return;
    }

    const formattedValue = new Intl.NumberFormat("vi-VN").format(
      Number(rawValue)
    );
    setCurrency(formattedValue);
    handleChange("price_vnd", Number(rawValue));
  };

  // Cập nhật tiền về string khi vào
  useEffect(() => {
    if (isUpdate && form.price_vnd) {
      const formattedValue = new Intl.NumberFormat("vi-VN").format(
        Number(form.price_vnd)
      );
      setCurrency(formattedValue);
    }
  }, [form.price_vnd, isUpdate]);

  // Gọi dữ liệu con của gói
  const [children, setChildren] = useState<PlanData[]>([]);

  const {
    data: dataChildren,
    isLoading: isLoadingChildrenPlan,
    refetch,
  } = useApi(() => {
    if (!isUpdate || !id) {
      return Promise.resolve(null);
    }
    return planService.getChildren(Number(id));
  }, [id, isUpdate]);

  // Khi dataChildren thay đổi → cập nhật children state
  useEffect(() => {
    if (dataChildren?.data) {
      // Kiểm tra cấu trúc data từ API
      const childrenData =
        dataChildren.data.children || dataChildren.data || [];

      // Đảm bảo childrenData là một mảng
      const validChildren = Array.isArray(childrenData) ? childrenData : [];
      setChildren(validChildren);
    } else {
      // Nếu không có data hoặc data rỗng, reset children về mảng rỗng
      setChildren([]);
    }
  }, [dataChildren]);

  // Reset children ngay khi id thay đổi
  useEffect(() => {
    setChildren([]);
  }, [id]);

  const { scrollRef, canScrollLeft, canScrollRight, scroll } =
    useScrollPagination<PlanData>([]);

  const handleDelete = async (data: PlanData) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc chắn muốn xóa gói "${data.name}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const res = await planService.delete(data.id); // gọi API xóa
        if (res.status === 200) {
          Swal.fire("Đã xóa!", `Gói "${data.name}" đã được xóa.`, "success");
          refetch();
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
      <PageBreadcrumb
        pageTitle={isUpdate ? "Cập nhật gói cước" : "Thêm gói cước mới"}
      />

      <ComponentCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Tên gói</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nhập tên gói"
            />

            {formErrors.name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <Label>Chọn gói chính (Bỏ trống nếu bạn định thêm gói chính)</Label>
            <Select
              options={
                isLoadingPlans
                  ? [{ label: "Đang tải...", value: null }]
                  : [
                      { label: "Gói chính", value: "null" },
                      ...(dataPlans?.data?.items?.map((item: any) => ({
                        label: item.name,
                        value: item.id,
                      })) ?? []),
                    ]
              }
              onChange={(val) => handleChange("parent_id", val)}
              value={String(form.parent_id)}
            />
          </div>

          <div>
            <Label>Số phút</Label>
            <Input
              type="number"
              value={form.minutes}
              onChange={(e) => handleChange("minutes", Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Số CID</Label>
            <Input
              type="number"
              value={form.did_count}
              onChange={(e) =>
                handleChange("did_count", Number(e.target.value))
              }
            />
          </div>

          <div>
            <Label>Giá tiền (VND)</Label>
            <Input
              type="text"
              value={currency}
              onChange={(e) => handleCurrency(e)}
            />
          </div>

          <div>
            <Label>Số người dùng</Label>
            <Input
              type="number"
              value={form.total_users}
              onChange={(e) =>
                handleChange("total_users", Number(e.target.value))
              }
            />
          </div>

          <div>
            <Label>Thời hạn gói</Label>
            <Input
              type="datetime-local"
              value={form.expiration_time?.slice(0, 16) || ""}
              onChange={(e) => handleChange("expiration_time", e.target.value)}
            />
          </div>

          <div>
            <Label>Thời hạn chờ xác nhận</Label>
            <Input
              type="number"
              value={form.expiration_time_package}
              onChange={(e) =>
                handleChange("expiration_time_package", Number(e.target.value))
              }
            />
          </div>
        </div>

        {/* --- Outbound DID routes --- */}
        {user.role == 1 && (
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-4 mt-2">
              <OutboundDidForm
                value={form.outbound_did_by_route}
                onChange={(updated) =>
                  handleChange("outbound_did_by_route", updated)
                }
                meta={form.meta}
                onMetaChange={(updated) => handleChange("meta", updated)}
              />
            </div>
          </div>
        )}

        {/* Gói con */}
        {/* --- Danh sách gói con (nếu có) --- */}
        {isUpdate && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4">Các gói con</h3>

            {isLoadingChildrenPlan ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">
                  Đang tải danh sách gói con...
                </p>
              </div>
            ) : children.length > 0 ? (
              <div className="relative">
                {/* Nút scroll trái */}
                {canScrollLeft && (
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                    onClick={() => scroll("left")}>
                    <FiChevronLeft size={20} />
                  </button>
                )}

                {/* Vùng scroll ngang */}
                <div
                  key={id}
                  ref={scrollRef}
                  className="flex w-full overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4 pb-4 hide-scrollbar">
                  {children.map((plan: any) => (
                    <div
                      key={plan.id}
                      className="flex-shrink-0 min-w-[40%] snap-start">
                      <PricingCard
                        data={plan}
                        buttonText="Chi tiết"
                        onDelete={handleDelete}
                        onSelect={() => navigate(`/plans/edit/${plan.id}`)}
                        onDetail={() => navigate(`/plans/edit/${plan.id}`)}
                        showBadge={false}
                      />
                    </div>
                  ))}
                </div>

                {/* Nút scroll phải */}
                {canScrollRight && (
                  <button
                    className="absolute right-[-40px] top-1/2 -translate-y-1/2 z-10 p-2 
              bg-white rounded-full shadow hover:bg-gray-100
              dark:bg-gray-800 dark:hover:bg-gray-700 dark:shadow-gray-900"
                    onClick={() => scroll("right")}>
                    <FiChevronRight
                      size={20}
                      className="text-gray-700 dark:text-white transition-colors duration-200"
                    />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Không có gói con nào</p>
              </div>
            )}
          </div>
        )}

        {/* --- Submit --- */}
        <div className="flex justify-end gap-3 mt-8 ">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => navigate("/plans")}
            disabled={loading}>
            Trở lại
          </Button>
          {user.role == 1 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50">
              {loading
                ? "Đang lưu..."
                : isUpdate
                ? "Cập nhật gói cước"
                : "Tạo gói cước"}
            </button>
          )}
        </div>
      </ComponentCard>
    </>
  );
};
