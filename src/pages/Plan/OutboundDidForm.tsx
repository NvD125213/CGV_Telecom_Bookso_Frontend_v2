import { useState, useEffect, useMemo } from "react";
import { useApi } from "../../hooks/useApi";
import { getProviders } from "../../services/provider";
import { useBrandNameList } from "../../hooks/api-hooks/v3/useBrandname";
import { useDebounce } from "../../hooks/useDebounce";
import AutoSelect from "../../components/autoCompleteSwitch/AutoSelect";
import {
  RouteEntry,
  MetaEntry,
  OutboundDidFormProps,
  OutboundRouteItem,
  normalizeOutboundDidByRoute,
} from "./interfaces/Outbound";
import {
  parseNumberFromFormatted,
  formatNumberWithCommas,
} from "./helpers/parseNumberFormat";
import Label from "../../components/form/Label";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import { IProvider } from "../../types/provider";

const createRouteId = () =>
  `route-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const valueToRoutes = (
  value: OutboundRouteItem[],
  prev: RouteEntry[] = [],
): RouteEntry[] => {
  if (!value.length) return [];

  return value.map((item, index) => ({
    id: prev[index]?.id ?? createRouteId(),
    provider: item.provider ?? "",
    brandname_id: item.brandname_id != null ? String(item.brandname_id) : "",
    quantity:
      item.quantity != null
        ? formatNumberWithCommas(String(item.quantity))
        : "",
  }));
};

const routesToValue = (list: RouteEntry[]): OutboundRouteItem[] =>
  list.map((r) => ({
    brandname_id: r.brandname_id ? Number(r.brandname_id) : null,
    provider: r.provider.trim() ? r.provider.trim() : null,
    quantity: r.quantity.trim() ? parseNumberFromFormatted(r.quantity) : null,
  }));

export const OutboundDidForm = ({
  value,
  onChange,
  meta,
  onMetaChange,
  hide,
}: OutboundDidFormProps) => {
  const normalizedValue = useMemo(
    () => normalizeOutboundDidByRoute(value),
    [value],
  );

  const { data: dataProviders, isLoading, error } = useApi(getProviders);

  const [routes, setRoutes] = useState<RouteEntry[]>(() =>
    valueToRoutes(normalizedValue),
  );
  const [metaRoutes, setMetaRoutes] = useState<MetaEntry[]>(
    Object.entries(meta).map(([key, val]) => ({ key, value: val })),
  );

  const providerOptions = isLoading
    ? [{ label: "Đang tải...", value: "" }]
    : error
      ? [{ label: "Lỗi tải dữ liệu", value: "" }]
      : ((dataProviders as IProvider[] | undefined)?.map((p) => ({
          label: p.name,
          value: p.name,
        })) ?? []);

  const [brandSearch, setBrandSearch] = useState("");
  const [brandSelectOpen, setBrandSelectOpen] = useState(false);
  const debouncedBrandSearch = useDebounce(brandSearch, 300);

  const {
    data: brandNameListData,
    isLoading: isBrandLoading,
    isError: isBrandError,
  } = useBrandNameList(
    {
      page: 1,
      size: 20,
      is_active: true,
      search: debouncedBrandSearch.trim() || undefined,
      order_by: "created_at",
      order_dir: "desc",
    },
    { enabled: brandSelectOpen },
  );

  const brandOptions = useMemo(() => {
    if (isBrandError) {
      return [{ label: "Lỗi tải dữ liệu", value: "" }];
    }

    const fromApi = (brandNameListData?.items ?? []).map((brand) => ({
      label: brand.name,
      value: String(brand.id),
    }));

    const selectedIds = routes
      .map((r) => r.brandname_id)
      .filter((id) => id && !fromApi.some((o) => o.value === id));

    const fromSaved = selectedIds.map((id) => ({
      label: `Brand #${id}`,
      value: id,
    }));

    return [...fromApi, ...fromSaved];
  }, [brandNameListData, isBrandError, routes]);

  const updateParent = (list: RouteEntry[]) => {
    onChange(routesToValue(list));
  };

  const updateMetaParent = (list: MetaEntry[]) => {
    const obj = Object.fromEntries(list.map((r) => [r.key, r.value]));
    onMetaChange(obj);
  };

  const handleAdd = () => {
    setRoutes([
      ...routes,
      {
        id: createRouteId(),
        provider: "",
        brandname_id: "",
        quantity: "",
      },
    ]);
  };

  const handleRemove = (index: number) => {
    const newRoutes = routes.filter((_, i) => i !== index);
    setRoutes(newRoutes);
    updateParent(newRoutes);
  };

  const handleChange = (
    index: number,
    field: "provider" | "brandname_id" | "quantity",
    val: string,
  ) => {
    const newRoutes = [...routes];

    if (field === "quantity") {
      newRoutes[index] = {
        ...newRoutes[index],
        quantity: formatNumberWithCommas(val),
      };
    } else {
      newRoutes[index] = { ...newRoutes[index], [field]: val };
    }

    setRoutes(newRoutes);
    updateParent(newRoutes);
  };

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
    val: string,
  ) => {
    const newRoutes = [...metaRoutes];
    newRoutes[index] = {
      ...newRoutes[index],
      [field]: val,
    };
    setMetaRoutes(newRoutes);
    updateMetaParent(newRoutes);
  };

  useEffect(() => {
    setRoutes((prev) => valueToRoutes(normalizedValue, prev));
  }, [normalizedValue]);

  useEffect(() => {
    setMetaRoutes(
      Object.entries(meta).map(([key, val]) => ({ key, value: val })),
    );
  }, [meta]);

  const showOutbound = hide !== "outbound";
  const showMeta = hide !== "meta";

  return (
    <div>
      <div
        className={`grid ${
          showOutbound && showMeta ? "grid-cols-2" : "grid-cols-1"
        } gap-8`}>
        {showOutbound && (
          <div>
            <Label>Cấu hình Outbound CID</Label>
            <div className="flex flex-col gap-3 mt-3">
              {routes.map((route, index) => (
                <div key={route.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0">
                    <IoIosRemove size={20} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <Select
                      options={providerOptions}
                      value={route.provider}
                      onChange={(val) => handleChange(index, "provider", val)}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <AutoSelect
                      options={brandOptions}
                      value={route.brandname_id}
                      placeholder="Chọn brandname..."
                      loading={brandSelectOpen && isBrandLoading}
                      onOpenChange={setBrandSelectOpen}
                      onSearchChange={setBrandSearch}
                      onChange={(val) =>
                        handleChange(index, "brandname_id", val)
                      }
                    />
                  </div>

                  <div className="w-24 flex-shrink-0">
                    <Input
                      type="text"
                      value={route.quantity}
                      onChange={(e) =>
                        handleChange(index, "quantity", e.target.value)
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
        )}

        {showMeta && (
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
        )}
      </div>
    </div>
  );
};
