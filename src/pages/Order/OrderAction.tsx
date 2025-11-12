import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { FormControlLabel, Switch } from "@mui/material";
import StatusSwitch from "../../components/autoCompleteSwitch/SwitchLabel";

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
  isDetail?: boolean;
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
  isDetail,
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
                  disabled={isDetail}
                  className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0">
                  <IoIosRemove size={20} />
                </button>

                <div className="flex-1 min-w-0">
                  <Select
                    options={routeOptions}
                    value={route.key}
                    disabledWhite={isDetail}
                    onChange={(val) => handleChange(index, "key", val)}
                  />
                </div>

                <div className="w-36 flex-shrink-0">
                  <Input
                    type="text"
                    value={route.value}
                    disabledWhite={isDetail}
                    onChange={(e) =>
                      handleChange(index, "value", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
            {!isDetail && (
              <button
                type="button"
                onClick={handleAdd}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mt-2">
                <IoIosAdd size={20} />
                Thêm tuyến Outbound
              </button>
            )}
          </div>
        </div>
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

  const isHavingID = Boolean(id);
  const [form, setForm] = useState<OrderForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Xây dựng trạng thái route

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
      if (!isHavingID || !id) return null;
      return await orderServices.getByID(Number(id));
    }, [id, isHavingID]);

  // Khi có dữ liệu detail (trường hợp update)
  useEffect(() => {
    if (isHavingID && dataOrderDetail) {
      setForm({
        ...defaultForm,
        ...dataOrderDetail.data,
      });
      handleCurrencyChange("total_minute", dataOrderDetail.data?.total_minute);
      handleCurrencyChange("total_users", dataOrderDetail.data?.total_users);
      handleCurrencyChange("total_price", dataOrderDetail.data?.total_price);
    } else if (!isHavingID) {
      // Reset form khi không phải update
      setForm(defaultForm);
    }
  }, [isHavingID, dataOrderDetail]);

  const [totalPrice, setTotalPrice] = useState(0);
  // console.log("outbound_did_by_route", form.outbound_did_by_route);

  // Thêm useEffect để validate giá ngay lập tức
  useEffect(() => {
    const total_cid = Object.values(form.outbound_did_by_route).reduce(
      (acc, val) => acc + (Number(val) || 0),
      0
    );

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

    // ✅ THÊM: Kiểm tra và cảnh báo ngay
    if (form.total_price && form.total_price < total) {
      setFormErrors((prev) => ({
        ...prev,
        total_price: `Giá không được thấp hơn ${new Intl.NumberFormat(
          "vi-VN"
        ).format(total)}₫`,
      }));
    } else {
      // Xóa lỗi nếu hợp lệ
      setFormErrors((prev) => {
        const { total_price, ...rest } = prev;
        return rest;
      });
    }

    // Không tự động ghi đè giá user đã nhập
    // setForm((prev) => ({ ...prev, total_price: total })); // ❌ XÓA DÒNG NÀY
  }, [
    form.quantity,
    form.total_minute,
    form.total_users,
    form.outbound_did_by_route,
    form.total_price, // ✅ THÊM dependency này
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

      // ✅ THÊM: Validate giá trước khi submit
      const finalPrice = form.total_price || totalPrice;
      if (finalPrice < totalPrice) {
        errors.total_price = `Giá không được thấp hơn ${new Intl.NumberFormat(
          "vi-VN"
        ).format(totalPrice)}₫`;
        Swal.fire("Lỗi", errors.total_price, "error");
      }

      // --- Nếu có lỗi thì dừng lại ---
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setLoading(false);
        return; // ✅ DỪNG NGAY, KHÔNG CHO SUBMIT
      }

      // Nếu hợp lệ
      setFormErrors({});

      const newForm = { ...form };

      // Nếu chưa nhập giá thì tự gán giá hệ thống tính
      if (!form.total_price) {
        newForm.total_price = totalPrice;
      }

      // ❌ XÓA phần cảnh báo này vì đã validate ở trên
      // if (form.total_price < totalPrice) {
      //   Swal.fire("Cảnh báo", "...", "warning");
      //   setLoading(false);
      //   return;
      // }

      if (isHavingID && isEdit) {
        if (form.status == 1) {
          const result = await Swal.fire({
            title: "Xác nhận",
            text: `Bạn có muốn triển khai order cho ${form.customer_name} không?`,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Triển khai",
            cancelButtonText: "Hủy",
          });

          // Nếu người dùng bấm "Có"
          if (result.isConfirmed) {
            const res = await orderServices.update(Number(id), newForm as any);
            if (res.status == 200) {
              Swal.fire(
                "Thành công",
                "Triển khai order thành công!",
                "success"
              );
            }
          }
          return;
        }

        // Nếu form.status != 1
        const res = await orderServices.update(Number(id), newForm as any);
        if (res.status == 200) {
          Swal.fire("Thành công", "Cập nhật order thành công!", "success");
        }
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

  // Trạng thái
  const isEdit = location.pathname.includes(`/order/edit/${id}`);
  const isDetail = location.pathname.includes(`/order/detail/${id}`);
  const isCreate = location.pathname.includes("/order/create");

  return (
    <>
      <PageBreadcrumb
        pageTitle={isHavingID ? "Cập nhật thông tin order" : "Order mới"}
      />

      <ComponentCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Tên khách hàng</Label>
            <Input
              value={form.customer_name}
              onChange={(e) => handleChange("customer_name", e.target.value)}
              placeholder="Nhập tên khách hàng"
              disabledWhite={isDetail}
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
              disabledWhite={isDetail}
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
              disabledWhite={isDetail}
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
              disabledWhite={isDetail}
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
              disabledWhite={isDetail}
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
              disabledWhite={isDetail}
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
          {user.role == 1 && isEdit && (
            <div>
              <Label>Trạng thái</Label>

              <Select
                className="mt-1"
                value={String(form.status)}
                disabledWhite={isDetail}
                options={[
                  { label: "Đang chờ", value: "2" },
                  { label: "Triển khai", value: "1" },
                ]}
                onChange={(value) => handleChange("status", Number(value))}
              />
            </div>
          )}
          <OutboundDidForm
            value={form.outbound_did_by_route}
            onChange={(updated) =>
              handleChange("outbound_did_by_route", updated)
            }
            isDetail={isDetail}
            meta={form.meta}
            onMetaChange={(updated) => handleChange("meta", updated)}
          />
          {formErrors.outbound_did_by_route && (
            <p className="text-red-500 text-sm mt-1">
              {formErrors.outbound_did_by_route}
            </p>
          )}
        </div>

        {/* --- Outbound DID routes --- */}

        {/* --- Submit --- */}
        <div className="flex justify-end gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => navigate("/order")}
            className="w-28"
            disabled={loading}>
            Trở lại
          </Button>

          {!isDetail && (
            <Button
              onClick={handleSubmit}
              disabled={loading} // isDetail bỏ ra để vẫn nhấn được
              className="bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-50 w-28">
              {loading
                ? "Đang lưu..."
                : isCreate
                ? "Tạo"
                : isEdit
                ? "Cập nhật"
                : "Lưu"}
            </Button>
          )}
        </div>
      </ComponentCard>
    </>
  );
};
