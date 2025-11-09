import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import { useApi } from "../../hooks/useApi";
import { getProviders } from "../../services/provider";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { orderServices } from "../../services/order";
import { useCurrencyFields } from "../../hooks/useCurrencyField";
import { getPriceForRange, PriceOrderConfig } from "./PriceConfig";

type RouteEntry = {
  key: string;
  value: string | number;
};

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

const formatNumberWithCommas = (value: string) => {
  // Xóa các ký tự không phải số
  const numericValue = value.replace(/\D/g, "");
  // Thêm dấu phẩy phân cách hàng nghìn
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parseNumberFromFormatted = (value: string) => {
  return Number(value.replace(/,/g, ""));
};

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
    const obj = Object.fromEntries(
      list.map((r) => [r.key, parseNumberFromFormatted(r.value as any)])
    );
    onChange(obj);
  };

  const updateMetaParent = (list: MetaEntry[]) => {
    const obj = Object.fromEntries(list.map((r) => [r.key, r.value]));
    onMetaChange(obj);
  };

  // Outbound handlers
  const handleAdd = () => {
    const newRoutes = [...routes, { key: "", value: "" }];
    setRoutes(newRoutes);
  };

  const handleRemove = (index: number) => {
    const newRoutes = routes.filter((_, i) => i !== index);
    setRoutes(newRoutes);
    updateParent(newRoutes);
  };

  const handleChange = (index: number, field: "key" | "value", val: any) => {
    const newRoutes = [...routes];

    if (field === "value") {
      // Chỉ cho phép nhập số, có phẩy
      const formatted = formatNumberWithCommas(val);
      newRoutes[index] = { ...newRoutes[index], value: formatted as any };
    } else {
      newRoutes[index] = { ...newRoutes[index], key: val };
    }

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
        ? Object.entries(value).map(([key, val]) => ({
            key,
            value: formatNumberWithCommas(val.toString()),
          }))
        : []
    );
  }, [value]);

  useEffect(() => {
    setMetaRoutes(
      Object.entries(meta).map(([key, val]) => ({ key, value: val }))
    );
  }, [meta]);
  return (
    <div>
      <div className="grid grid-cols-1 gap-8">
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

                <div className="w-36 flex-shrink-0">
                  <Input
                    type="text"
                    value={route.value}
                    onChange={(e) =>
                      handleChange(index, "value", e.target.value)
                    }
                    placeholder="0"
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
        {/* <div>
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
                    placeholder="Nhập key"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Input
                    type="text"
                    value={route.value}
                    onChange={(e) =>
                      handleMetaChange(index, "value", e.target.value)
                    }
                    placeholder="Nhập value"
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
        </div> */}
      </div>
    </div>
  );
};

export interface OrderForm {
  customer_name: string;
  tax_code: string;
  contract_code: string;
  quantity: number;
  total_users: number;
  total_minute: number;
  outbound_did_by_route: Record<any, any>;
  total_price: number;
  status?: number;
  meta: Record<any, any>;
}

const defaultForm: OrderForm = {
  customer_name: "",
  tax_code: "",
  contract_code: "",
  quantity: 1,
  total_users: 0,
  total_minute: 0,
  total_price: 0,
  outbound_did_by_route: {},
  meta: {},
};

export const OrderActionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth?.user);

  const isUpdate = Boolean(id);
  const [form, setForm] = useState<OrderForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = <K extends keyof OrderForm>(
    field: K,
    value: OrderForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors({});
  };

  const { currencyFields, handleCurrencyChange } = useCurrencyFields<OrderForm>(
    { quantity: "", total_minute: "", total_users: "" },
    handleChange
  );

  // Lấy dữ liệu chi tiết đơn hàng (nếu có id)
  const { data: dataOrderDetail, isLoading: isDetailLoading } =
    useApi(async () => {
      if (!isUpdate || !id) return null;
      return await orderServices.getByID(Number(id));
    }, [id, isUpdate]);

  // Khi có dữ liệu detail (trường hợp update)
  useEffect(() => {
    if (isUpdate && dataOrderDetail) {
      setForm({
        ...defaultForm,
        ...dataOrderDetail.data,
      });
      handleCurrencyChange("total_minute", dataOrderDetail.data?.total_minute);
      handleCurrencyChange("total_users", dataOrderDetail.data?.total_users);
      handleCurrencyChange("total_price", dataOrderDetail.data?.total_price);
    } else if (!isUpdate) {
      // Reset form khi không phải update
      setForm(defaultForm);
    }
  }, [isUpdate, dataOrderDetail]);

  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const objValues = Object.values(form.outbound_did_by_route);

    const total_cid = objValues.reduce((a, b) => {
      return a + b;
    }, 0);

    const minutePrice = getPriceForRange(
      form.total_minute,
      PriceOrderConfig.minutes
    );
    const userPrice = getPriceForRange(form.total_users, PriceOrderConfig.user);
    const cidPrice = getPriceForRange(total_cid, PriceOrderConfig.cid);
    const total =
      (form.total_minute * minutePrice +
        form.total_users * userPrice +
        total_cid * cidPrice) *
      form.quantity;

    setTotalPrice(total);
    setForm((prev) => ({ ...prev, total_price: total })); // gắn vào form để gửi API
  }, [
    form.quantity,
    form.total_minute,
    form.total_users,
    form.outbound_did_by_route,
  ]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const errors: Record<string, string> = {};

      // --- Validate cơ bản ---
      if (!form.customer_name?.trim())
        errors.customer_name = "Tên khách hàng không được để trống";
      if (!form?.total_minute)
        errors.total_minute = "Tổng số phút không được để trống";
      if (!form?.total_users)
        errors.total_users = "Tổng số user không được để trống";
      if (form.outbound_did_by_route.length == 0) {
        errors.outbound_did_by_route = "Lựa chọn 1 nhà cung cấp để đặt số";
      }

      // --- Nếu có lỗi thì dừng lại ---
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setLoading(false);
        return;
      }

      // --- Nếu hợp lệ ---
      setFormErrors({});

      const newForm = { ...form };

      // Nếu chưa nhập giá thì tự gán giá hệ thống tính
      if (!form.total_price) {
        newForm.total_price = totalPrice;
      }

      if (form.total_price < totalPrice) {
        Swal.fire(
          "Cảnh báo",
          "Mức giá bạn nhập vào nhỏ hơn mức giá được gợi ý ban đầu!",
          "warning"
        );
        setLoading(false);
        return;
      }

      if (isUpdate) {
        await orderServices.update(Number(id), newForm as any);
        Swal.fire("Thành công", "Cập nhật order thành công!", "success");
      } else {
        const result = await orderServices.create(newForm as any);
        if (result.status === 201) {
          Swal.fire("Thành công", "Tạo order thành công", "success");
          navigate("/order");
        }
      }
    } catch (error: any) {
      console.error("Order action failed:", error);
      const message =
        error?.response?.data?.detail || "Đã xảy ra lỗi không xác định";
      Swal.fire("Lỗi", message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xác nhận triển khai
  const handleReleased = (item: any) => {
    Swal.fire({
      title: "Xác nhận triển khai?",
      text: `Order của ${item.user_name} với khách hàng ${item.customer_name}`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Triển khai",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const updatedForm = { ...item, status: 1 };
          const result = await orderServices.update(item.id, updatedForm);
          if (result.status == 200) {
            Swal.fire(
              "Thành công",
              "Cập nhật trạng thái order thành công!",
              "success"
            );
            navigate("/order");
          }
        } catch (error: any) {
          if (error?.response?.data?.detail) {
            Swal.fire("Lỗi", error?.response?.data?.detail, "error");
          } else {
            Swal.fire("Lỗi", "Không thể cập nhật trạng thái!", "error");
            console.error(error);
          }
        }
      }
    });
  };

  return (
    <>
      <PageBreadcrumb
        pageTitle={isUpdate ? "Cập nhật thông tin order" : "Order mới"}
      />

      <ComponentCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Tên khách hàng</Label>
            <Input
              value={form.customer_name}
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
            <Label>Mã số thuế</Label>
            <Input
              value={form.tax_code}
              onChange={(e) => handleChange("tax_code", e.target.value)}
              placeholder="Nhập mã số thuế"
            />

            {formErrors.tax_code && (
              <p className="text-red-500 text-sm mt-1">{formErrors.tax_code}</p>
            )}
          </div>
          <div>
            <Label>Mã hợp đồng</Label>
            <Input
              value={form.contract_code}
              onChange={(e) => handleChange("contract_code", e.target.value)}
              placeholder="Nhập mã hợp đồng"
            />

            {formErrors.contract_code && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.contract_code}
              </p>
            )}
          </div>
          {/* <div>
            <Label>Số đầu số</Label>
            <Input
              type="text"
              value={currencyFields.quantity}
              placeholder="Nhập số đầu số"
              onChange={(e) => handleCurrencyChange("quantity", e)}
            />
          </div> */}

          <div>
            <Label>Số phút gọi</Label>
            <Input
              type="text"
              value={currencyFields.total_minute}
              placeholder="Nhập số phút gọi"
              onChange={(e) => handleCurrencyChange("total_minute", e)}
            />
            {formErrors.total_minute && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.total_minute}
              </p>
            )}
          </div>

          <div>
            <Label>Số user</Label>
            <Input
              type="text"
              value={currencyFields.total_users}
              placeholder="Nhập số user"
              onChange={(e) => handleCurrencyChange("total_users", e)}
            />
          </div>

          <div>
            <Label className="flex gap-2 items-center">
              Giá đặt đơn{" "}
              <p className="text-red-500 text-sm font-medium">
                (Giá bạn nhập vào không được thấp hơn{" "}
                {new Intl.NumberFormat("vi-VN").format(totalPrice)}₫)
              </p>
            </Label>
            <Input
              type="text"
              value={currencyFields.total_price}
              placeholder="Nhập tổng giá tiền"
              onChange={(e) => handleCurrencyChange("total_price", e)}
            />
            {/* <div className="mt-2">
              <p className="text-gray-500 text-sm">
                *Tự động tính giá gợi ý theo số lượng đầu số, phút gọi và user.
                Lưu ý nếu bạn bỏ trống cột này, mức giá được lấy sẽ là giá hệ
                thống đã gợi ý
              </p>
            </div> */}
          </div>
        </div>

        {/* --- Outbound DID routes --- */}
        <div>
          <div className="grid grid-cols-1 gap-4 mt-2">
            <OutboundDidForm
              value={form.outbound_did_by_route}
              onChange={(updated) =>
                handleChange("outbound_did_by_route", updated)
              }
              meta={form.meta}
              onMetaChange={(updated) => handleChange("meta", updated)}
            />
            {formErrors.outbound_did_by_route && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.outbound_did_by_route}
              </p>
            )}
          </div>
        </div>

        {/* --- Submit --- */}
        <div className="flex justify-end gap-3 mt-8 ">
          <Button
            variant="outline"
            onClick={() => navigate("/order")}
            disabled={loading}>
            Trở lại
          </Button>
          {user.role == 1 && (
            <Button
              variant="primary"
              onClick={() => handleReleased(form)}
              disabled={loading}>
              Xác nhận triển khai
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className=" bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Đang lưu..." : isUpdate ? "Cập nhật" : "Tạo"}
          </Button>
        </div>
      </ComponentCard>
    </>
  );
};
