import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import { getProviders } from "../../../services/provider";
import Label from "../../../components/form/Label";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";

type RouteEntry = {
  key: string;
  value: string | number;
};

interface OutboundDidFormProps {
  value: Record<string, number>;
  meta: Record<string, string>;
  isDetail?: boolean;
  isEdit?: boolean;
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
  isDetail,
  isEdit,
}: OutboundDidFormProps) => {
  const { data: dataProviders, isLoading, error } = useApi(getProviders);

  const [routes, setRoutes] = useState<RouteEntry[]>(
    Object.keys(value).length > 0
      ? Object.entries(value).map(([key, val]) => ({ key, value: val }))
      : []
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

  return (
    <div>
      <div className="grid grid-cols-1 gap-8">
        {/* Outbound DID Section */}
        <div>
          {
            (!isDetail || !isEdit) && (
              <Label className="!mb-0">Cấu hình Outbound CID</Label>
            )
          }
          <div className="flex flex-col gap-3 mt-3">
            {routes.length === 0 && (isDetail) ? (
              // Empty state
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <p className="text-gray-600 font-medium mb-1">Chưa thiết lập Outbound CID</p>
                <p className="text-gray-500 text-sm">
                  {isDetail 
                    ? "Order này chưa có cấu hình Outbound CID"
                    : "Nhấn nút bên dưới để thêm tuyến Outbound đầu tiên"
                  }
                </p>
              </div>
            ) : (
              // Routes list
              routes.map((route, index) => (
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
              ))
            )}
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