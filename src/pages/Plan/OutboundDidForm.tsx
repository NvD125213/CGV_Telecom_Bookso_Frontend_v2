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
  const twoColumnLayout = showOutbound && showMeta;

  return (
    <div>
      <div
        className={`grid grid-cols-1 gap-6 ${
          twoColumnLayout ? "lg:grid-cols-2 lg:gap-8" : ""
        }`}>
        {showOutbound && (
          <div>
            <Label>Cấu hình Outbound CID</Label>
            <div className="mt-3 flex flex-col gap-3">
              {routes.map((route, index) => (
                <div
                  key={route.id}
                  className="rounded-xl border border-gray-200 p-3 dark:border-gray-700 sm:border-0 sm:p-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="self-end rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200 sm:self-auto">
                      <IoIosRemove size={20} />
                    </button>

                    <div className="w-full min-w-0 sm:flex-1">
                      <Select
                        options={providerOptions}
                        value={route.provider}
                        onChange={(val) =>
                          handleChange(index, "provider", val)
                        }
                      />
                    </div>

                    <div className="w-full min-w-0 sm:flex-1">
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

                    <div className="w-full flex-shrink-0 sm:w-24">
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
                </div>
              ))}

              <button
                type="button"
                onClick={handleAdd}
                className="mt-2 flex items-center gap-2 font-medium text-indigo-600 hover:text-indigo-800">
                <IoIosAdd size={20} />
                Thêm tuyến Outbound
              </button>
            </div>
          </div>
        )}

        {showMeta && (
          <div>
            <Label>Cấu hình Meta</Label>
            <div className="mt-3 flex flex-col gap-3">
              {metaRoutes.map((route, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 p-3 dark:border-gray-700 sm:border-0 sm:p-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleMetaRemove(index)}
                      className="self-end rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200 sm:self-auto">
                      <IoIosRemove size={20} />
                    </button>

                    <div className="w-full min-w-0 sm:flex-1">
                      <Input
                        type="text"
                        value={route.key}
                        onChange={(val) =>
                          handleMetaChange(index, "key", val.target.value)
                        }
                        placeholder="Nhập key"
                      />
                    </div>

                    <div className="w-full min-w-0 sm:flex-1">
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
                </div>
              ))}

              <button
                type="button"
                onClick={handleMetaAdd}
                className="mt-2 flex items-center gap-2 font-medium text-indigo-600 hover:text-indigo-800">
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
