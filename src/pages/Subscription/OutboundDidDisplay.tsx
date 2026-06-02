import { useMemo } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import AutoSelect from "../../components/autoCompleteSwitch/AutoSelect";
import { useBrandNameList } from "../../hooks/api-hooks/v3/useBrandname";
import { formatNumberWithCommas } from "../Plan/helpers/parseNumberFormat";
import {
  normalizeOutboundDidByRoute,
  OutboundDidValue,
} from "../Plan/interfaces/Outbound";

interface OutboundDidDisplayProps {
  value?: OutboundDidValue;
  title?: string;
}

const readOnlyInputClass =
  "text-gray-900 bg-gray-200 cursor-not-allowed border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";

export const OutboundDidDisplay = ({
  value,
  title = "Cấu hình Outbound CID",
}: OutboundDidDisplayProps) => {
  const routes = useMemo(() => {
    return normalizeOutboundDidByRoute(value).filter(
      (item) =>
        item.provider != null ||
        item.brandname_id != null ||
        item.quantity != null,
    );
  }, [value]);

  const { data: brandNameListData } = useBrandNameList({
    page: 1,
    size: 100,
    is_active: true,
    order_by: "created_at",
    order_dir: "desc",
  });

  const brandOptions = useMemo(() => {
    const fromApi = (brandNameListData?.items ?? []).map((brand) => ({
      label: brand.name,
      value: String(brand.id),
    }));

    const selectedIds = routes
      .map((r) => r.brandname_id)
      .filter(
        (id): id is number =>
          id != null && !fromApi.some((o) => o.value === String(id)),
      );

    const fromSaved = selectedIds.map((id) => ({
      label: `Brand #${id}`,
      value: String(id),
    }));

    return [...fromApi, ...fromSaved];
  }, [brandNameListData, routes]);

  if (routes.length === 0) {
    return null;
  }

  return (
    <div>
      <Label>{title}</Label>
      <div className="mt-3 flex flex-col gap-3">
        {routes.map((route, index) => (
          <div key={index}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
              <div className="w-full min-w-0 sm:flex-1">
                <Input
                  type="text"
                  value={route.provider ?? ""}
                  disabledWhite
                  placeholder="-"
                  className={readOnlyInputClass}
                />
              </div>

              <div className="w-full min-w-0 sm:flex-1">
                <AutoSelect
                  options={brandOptions}
                  value={
                    route.brandname_id != null ? String(route.brandname_id) : ""
                  }
                  placeholder="-"
                  disabled
                  disabledWhite={true}
                />
              </div>

              <div className="w-full flex-shrink-0 sm:w-24">
                <Input
                  type="text"
                  value={
                    route.quantity != null
                      ? formatNumberWithCommas(String(route.quantity))
                      : ""
                  }
                  disabledWhite
                  placeholder="-"
                  className={readOnlyInputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
