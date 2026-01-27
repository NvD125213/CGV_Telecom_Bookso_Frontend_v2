import { useEffect, useState } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { formatNumberWithCommas } from "../Plan/helpers/parseNumberFormat";

interface OutboundDidDisplayProps {
  value: Record<string, any>;
  title?: string;
}

interface RouteEntry {
  key: string;
  value: string | number;
}

export const OutboundDidDisplay = ({
  value,
  title = "Cấu hình Outbound CID",
}: OutboundDidDisplayProps) => {
  const [routes, setRoutes] = useState<RouteEntry[]>([]);

  // Cập nhật routes khi value thay đổi
  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      const formattedRoutes = Object.entries(value).map(([key, val]) => ({
        key,
        value: formatNumberWithCommas(val.toString()),
      }));
      setRoutes(formattedRoutes);
    } else {
      setRoutes([]);
    }
  }, [value]);

  // Nếu không có dữ liệu, không hiển thị gì
  if (routes.length === 0) {
    return null;
  }

  return (
    <div>
      <Label>{title}</Label>
      <div className="flex flex-col gap-4 mt-3">
        {routes.map((route, index) => (
          <div key={index} className="flex items-center gap-2">
            {/* Provider name */}
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                value={route.key}
                disabledWhite={true}
                className="text-gray-900 bg-gray-200 cursor-not-allowed border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Value */}
            <div className="w-24 flex-shrink-0">
              <Input
                type="text"
                value={route.value}
                disabledWhite={true}
                className="text-gray-900 bg-gray-200 cursor-not-allowed border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
