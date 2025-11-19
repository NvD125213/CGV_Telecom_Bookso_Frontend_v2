import { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import { getProviders } from "../../services/provider";
import {
  RouteEntry,
  MetaEntry,
  OutboundDidFormProps,
} from "./interfaces/Outbound";
import {
  parseNumberFromFormatted,
  formatNumberWithCommas,
} from "./helpers/parseNumberFormat";
import Label from "../../components/form/Label";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";

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
        </div>
      </div>
    </div>
  );
};
