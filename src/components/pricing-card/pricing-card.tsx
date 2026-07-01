import React, { useState } from "react";
import { CiCircleCheck } from "react-icons/ci";
import { Badge } from "../badge/badge";

export interface PlanData {
  id: number;
  name: string;
  minutes: number;
  did_count: number;
  price_vnd: number;
  outbound_did_by_route: Record<string, any>;
  total_users: number;
  meta: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expiration_time: string;
  expiration_time_package: string;
  status: number;
}

interface PricingCardProps {
  data: PlanData;
  onSelect?: (data: PlanData) => void;
  onChange?: (field: keyof PlanData, value: any) => void;
  onSubmit?: (data: PlanData) => void;
  onDetail?: (data: PlanData) => void;
  onDelete?: (data: PlanData) => void;
  className?: string;
  cardClassName?: string;
  headerClassName?: string;
  badgeClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  priceClassName?: string;
  buttonClassName?: string;
  buttonText?: string;
  isEditable?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  customFeatures?: string[];
  /** Bố cục gọn, căn start — dùng trong carousel chọn gói bổ sung */
  compact?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  data,
  onSelect,
  onChange,
  onSubmit,
  onDetail,
  onDelete,
  className = "",
  cardClassName = "",
  headerClassName = "",
  badgeClassName = "",
  titleClassName = "",
  descriptionClassName = "",
  priceClassName = "",
  buttonClassName = "",
  buttonText = "Chọn gói",
  isEditable = false,
  showBadge = true,
  badgeText = "Ưu Đãi Tốt Nhất",
  customFeatures,
  compact = false,
}) => {
  const [currentData, setCurrentData] = useState<PlanData>(data);

  //Format Price
  const formatPrice = (price: any) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleFieldChange = (field: keyof PlanData, value: any) => {
    const updatedData = { ...currentData, [field]: value };
    setCurrentData(updatedData);
    onChange?.(field, value);
  };

  const handleSubmit = () => {
    onSubmit?.(currentData);
  };

  const handleSelect = () => {
    onSelect?.(currentData);
  };
  const defaultFeatures = [
    `${Number(currentData.minutes || 0).toLocaleString("vi-VN")} phút gọi`,
    `${Number(currentData.did_count || 0).toLocaleString("vi-VN")} số CID`,
    `${Number(currentData.total_users || 0).toLocaleString(
      "vi-VN",
    )} người dùng`,
  ];

  const features = customFeatures || defaultFeatures;

  return (
    <div
      className={`flex w-full ${
        compact
          ? "items-start justify-start p-0"
          : "items-stretch justify-start p-0 sm:p-2 lg:p-3"
      } ${className}`}>
      <div
        className={`w-full min-w-0 ${compact ? "" : "max-w-md lg:max-w-none"}`}>
        <div
          className={`relative flex h-full flex-col border-t-1 shadow-md dark:bg-gray-800 dark:border-gray-700 ${
            compact
              ? "rounded-xl p-3 sm:p-4"
              : "rounded-2xl p-3 sm:rounded-3xl sm:p-4 lg:p-5"
          } ${cardClassName}`}>
          <div
            className={`relative grid grid-cols-1 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 ${
              compact
                ? "mb-3 gap-2 rounded-xl px-3 py-2 text-left sm:gap-3 sm:px-4 sm:py-3"
                : "mb-4 gap-3 rounded-xl px-3 py-3 text-center sm:mb-5 sm:gap-4 sm:rounded-2xl sm:px-4 sm:py-3 lg:mb-6 lg:gap-5 lg:px-5 lg:py-4"
            }`}>
            {showBadge && (
              <Badge
                variant="gradient"
                shiny
                className={`absolute left-1/2 -translate-x-1/2 top-[-10px] ${headerClassName}`}>
                {badgeText}
              </Badge>
            )}

            {/* Tiêu đề + trạng thái */}
            <div className="flex w-full min-w-0 flex-col gap-1.5 sm:gap-2">
              <div className="flex w-full justify-end">
                <span
                  className={`inline-flex shrink-0 rounded-full font-medium leading-none ${
                    compact
                      ? "px-1.5 py-px text-[10px]"
                      : "px-1.5 py-px text-[9px] sm:px-2 sm:py-1 border border-green-500 text-green-500 sm:text-[10px]"
                  } ${
                    currentData.status === 1
                      ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200"
                      : currentData.status === 2
                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-200"
                        : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200"
                  }`}>
                  {currentData.status === 1
                    ? "Hoạt động"
                    : currentData.status === 2
                      ? "Đang chờ"
                      : "Hết hạn"}
                </span>
              </div>

              <div className="flex w-full items-center justify-center">
                {isEditable ? (
                  <input
                    type="text"
                    value={currentData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className={`min-w-0 w-full text-center text-sm font-bold outline-none text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-300 dark:border-gray-500 focus:border-indigo-600 dark:focus:border-indigo-400 sm:text-base ${titleClassName}`}
                  />
                ) : (
                  <h2
                    className={`line-clamp-2 w-full break-words text-center text-sm font-bold leading-snug text-gray-900 dark:text-white sm:text-base sm:leading-tight ${titleClassName}`}
                    title={currentData.name}>
                    {currentData.name}
                  </h2>
                )}
              </div>
            </div>

            {/* Hàng 3: Giá  */}
            <div
              className={`flex flex-col ${
                compact
                  ? "mx-0 items-start"
                  : "mx-0 items-center justify-center sm:mx-1"
              } ${compact ? "mt-1" : "mt-2 sm:mt-4 lg:mt-5"}`}>
              {isEditable ? (
                <input
                  type="number"
                  value={Number(currentData.price_vnd)}
                  onChange={(e) =>
                    handleFieldChange("price_vnd", Number(e.target.value))
                  }
                  className={`w-full text-lg font-bold outline-none text-center text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-300 dark:border-gray-500 focus:border-indigo-600 dark:focus:border-indigo-400 sm:text-xl lg:text-2xl ${priceClassName}`}
                />
              ) : (
                <div
                  className={`font-bold text-gray-900 dark:text-white ${
                    compact
                      ? "text-base sm:text-lg lg:text-xl"
                      : "text-lg sm:text-xl lg:text-2xl"
                  } ${priceClassName}`}>
                  {formatPrice(currentData.price_vnd)}
                </div>
              )}
            </div>

            {/* Hàng 4: Nút */}
            <div
              className={`flex ${compact ? "justify-start" : "items-center justify-center"}`}>
              <button
                onClick={isEditable ? handleSubmit : handleSelect}
                className={`w-full rounded-lg font-semibold transition-colors shadow-md bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white sm:rounded-xl ${
                  compact
                    ? "px-4 py-2 text-sm"
                    : "px-4 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm"
                } ${buttonClassName}`}>
                {buttonText}
              </button>
            </div>
          </div>

          <div
            className={
              compact ? "space-y-1.5" : "space-y-2 sm:space-y-3 lg:space-y-4"
            }>
            <h3
              className={`font-semibold text-gray-700 dark:text-gray-200 ${
                compact
                  ? "mb-1.5 text-sm sm:text-base"
                  : "mb-2 text-sm sm:mb-3 sm:text-base lg:mb-4 lg:text-lg"
              }`}>
              Thông tin gói
            </h3>
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-start ${compact ? "gap-2" : "gap-2 sm:gap-2.5"}`}>
                <div className="mt-0.5 shrink-0">
                  <CiCircleCheck
                    className={`text-indigo-500 dark:text-indigo-400 ${
                      compact
                        ? "h-4 w-4"
                        : "h-4 w-4 sm:h-[18px] sm:w-[18px] lg:h-5 lg:w-5"
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
                <span
                  className={`text-gray-700 dark:text-gray-300 ${
                    compact
                      ? "text-xs leading-snug sm:text-sm"
                      : "text-[11px] leading-snug sm:text-xs lg:text-sm lg:leading-relaxed"
                  }`}>
                  {feature}
                </span>
              </div>
            ))}

            {/* Link xem chi tiết */}
            <div
              className={`flex justify-end gap-2 sm:gap-3 ${
                compact ? "mx-0 mt-2" : "mx-0 mt-3 sm:mt-4 lg:mt-6"
              }`}>
              <button
                onClick={() => onDetail?.(currentData)}
                style={{ textDecoration: "none" }}
                className="text-[11px] font-medium underline transition-colors text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 sm:text-xs lg:text-sm">
                Chi tiết
              </button>
              <button
                onClick={() => onDelete?.(currentData)}
                style={{ textDecoration: "none" }}
                className="text-[11px] font-medium underline transition-colors text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 sm:text-xs lg:text-sm">
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
