import { useState, useEffect, useMemo } from "react";
import { useApi } from "../../../hooks/useApi";
import { getProviders } from "../../../services/provider";
import { useBrandNameList } from "../../../hooks/api-hooks/v3/useBrandname";
import { useDebounce } from "../../../hooks/useDebounce";
import AutoSelect from "../../../components/autoCompleteSwitch/AutoSelect";
import {
  RouteEntry,
  OutboundRouteItem,
  OutboundDidValue,
  normalizeOutboundDidByRoute,
} from "../../Plan/interfaces/Outbound";
import {
  parseNumberFromFormatted,
  formatNumberWithCommas,
} from "../../Plan/helpers/parseNumberFormat";
import Label from "../../../components/form/Label";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";
import { IProvider } from "../../../types/provider";

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

interface OutboundDidFormProps {
  value: OutboundDidValue;
  isDetail?: boolean;
  isEdit?: boolean;
  onChange: (value: OutboundRouteItem[]) => void;
}

export const OutboundDidForm = ({
  value,
  onChange,
  isDetail,
  isEdit,
}: OutboundDidFormProps) => {
  const readOnly = Boolean(isDetail);

  const normalizedValue = useMemo(
    () => normalizeOutboundDidByRoute(value),
    [value],
  );

  const { data: dataProviders, isLoading, error } = useApi(getProviders);

  const [routes, setRoutes] = useState<RouteEntry[]>(() =>
    valueToRoutes(normalizedValue),
  );

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

  const providerOptions = isLoading
    ? [{ label: "Đang tải...", value: "" }]
    : error
      ? [{ label: "Lỗi tải dữ liệu", value: "" }]
      : ((dataProviders as IProvider[] | undefined)?.map((p) => ({
          label: p.name,
          value: p.name,
        })) ?? []);

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

  useEffect(() => {
    setRoutes((prev) => valueToRoutes(normalizedValue, prev));
  }, [normalizedValue]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-8">
        <div>
          {(!isDetail || !isEdit) && (
            <Label className="!mb-0">Cấu hình Outbound CID</Label>
          )}
          <div className="flex flex-col gap-3 mt-3">
            {routes.length === 0 && isDetail ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <p className="text-gray-600 font-medium mb-1">
                  Chưa thiết lập Outbound CID
                </p>
                <p className="text-gray-500 text-sm">
                  Order này chưa có cấu hình Outbound CID
                </p>
              </div>
            ) : (
              routes.map((route, index) => (
                <div key={route.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    disabled={readOnly}
                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0 disabled:opacity-50">
                    <IoIosRemove size={20} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <Select
                      options={providerOptions}
                      value={route.provider}
                      disabledWhite={readOnly}
                      onChange={(val) => handleChange(index, "provider", val)}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <AutoSelect
                      options={brandOptions}
                      value={route.brandname_id}
                      placeholder="Chọn brandname..."
                      disabled={readOnly || isBrandError}
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
                      disabledWhite={readOnly}
                      onChange={(e) =>
                        handleChange(index, "quantity", e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              ))
            )}
            {!readOnly && (
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
