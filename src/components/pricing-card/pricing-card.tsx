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
      "vi-VN"
    )} người dùng`,
    `${
      currentData.expiration_time_package || 0
    } ngày chờ xác nhận kể từ lúc đặt gói`,
  ];

  const features = customFeatures || defaultFeatures;

  return (
    <div
      className={`flex w-full ${
        compact
          ? "items-start justify-start p-0"
          : "items-center justify-center p-4"
      } ${className}`}>
      <div className={`w-full ${compact ? "" : "max-w-md"}`}>
        <div
          className={`relative border-t-1 shadow-md dark:bg-gray-800 dark:border-gray-700 ${
            compact
              ? "rounded-xl p-3 sm:p-4"
              : "rounded-3xl p-5"
          } ${cardClassName}`}>
          <div
            className={`relative grid grid-cols-1 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 ${
              compact
                ? "mb-3 gap-2 rounded-xl px-3 py-2 text-left sm:gap-3 sm:px-4 sm:py-3"
                : "mb-6 gap-6 rounded-2xl px-6 py-4 text-center"
            }`}>
            {showBadge && (
              <Badge
                variant="gradient"
                shiny
                className={`absolute left-1/2 -translate-x-1/2 top-[-10px] ${headerClassName}`}>
                {badgeText}
              </Badge>
            )}

            {/* Hàng 1: Tiêu đề */}
            <div className="flex items-center justify-between">
              {/* Tên hoặc input */}
              {isEditable ? (
                <input
                  type="text"
                  value={currentData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className={`text-base font-bold outline-none w-full text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-300 dark:border-gray-500 focus:border-indigo-600 dark:focus:border-indigo-400 ${titleClassName}`}
                />
              ) : (
                <h2
                  className={`text-base font-bold text-gray-900 dark:text-white ${titleClassName}`}>
                  {currentData.name}
                </h2>
              )}

              {/* Status hiển thị bên phải */}
              <div className="ml-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentData.status === 1
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : currentData.status === 2
                      ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                      : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  }`}>
                  {currentData.status === 1
                    ? "Active"
                    : currentData.status === 2
                    ? "Pending"
                    : "Inactive"}
                </span>
              </div>
            </div>

            {/* Hàng 3: Giá  */}
            <div
              className={`flex flex-col ${
                compact ? "mx-0 items-start" : "mx-2 items-center justify-center"
              } ${compact ? "mt-1" : "mt-6"}`}>
              {isEditable ? (
                <input
                  type="number"
                  value={Number(currentData.price_vnd)}
                  onChange={(e) =>
                    handleFieldChange("price_vnd", Number(e.target.value))
                  }
                  className={`text-2xl font-bold outline-none text-center w-full text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-300 dark:border-gray-500 focus:border-indigo-600 dark:focus:border-indigo-400 ${priceClassName}`}
                />
              ) : (
                <div
                  className={`font-bold text-gray-900 dark:text-white ${
                    compact ? "text-lg sm:text-xl" : "text-2xl"
                  } ${priceClassName}`}>
                  {formatPrice(currentData.price_vnd)}
                </div>
              )}
            </div>

            {/* Hàng 4: Nút */}
            <div className={`flex ${compact ? "justify-start" : "items-center justify-center"}`}>
              <button
                onClick={isEditable ? handleSubmit : handleSelect}
                className={`w-full font-semibold py-2 px-6 rounded-xl transition-colors shadow-md bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white ${buttonClassName}`}>
                {buttonText}
              </button>
            </div>
          </div>

          <div className={compact ? "space-y-1.5" : "space-y-4"}>
            <h3
              className={`font-semibold text-gray-700 dark:text-gray-200 ${
                compact ? "mb-1.5 text-sm sm:text-base" : "mb-4 text-lg"
              }`}>
              Thông tin gói
            </h3>
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-start ${compact ? "gap-2" : "gap-3"}`}>
                <div className="mt-0.5 shrink-0">
                  <CiCircleCheck
                    className={`text-indigo-500 dark:text-indigo-400 ${
                      compact ? "h-4 w-4" : "h-5 w-5"
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
                <span
                  className={`text-gray-700 dark:text-gray-300 ${
                    compact
                      ? "text-xs leading-snug sm:text-sm"
                      : "text-sm leading-relaxed"
                  }`}>
                  {feature}
                </span>
              </div>
            ))}

            {/* Link xem chi tiết */}
            <div
              className={`mx-2 flex justify-end gap-3 ${
                compact ? "mt-2" : "mt-6"
              }`}>
              <button
                onClick={() => onDetail?.(currentData)}
                style={{ textDecoration: "none" }}
                className="text-sm font-medium underline transition-colors text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                Chi tiết
              </button>
              <button
                onClick={() => onDelete?.(currentData)}
                style={{ textDecoration: "none" }}
                className="text-sm font-medium underline transition-colors text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
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
