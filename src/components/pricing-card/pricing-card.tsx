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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const defaultFeatures = [
    `${currentData.minutes.toLocaleString()} phút gọi`,
    `${currentData.did_count} số DID`,
    `${currentData.total_users} người dùng`,
    `Hạn gói: ${formatDate(currentData.expiration_time)}`,
    `Thời gian chờ xác nhận: ${formatDate(
      currentData.expiration_time_package
    )}`,
  ];

  const features = customFeatures || defaultFeatures;

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="max-w-md w-full">
        <div
          className={`relative rounded-3xl p-5 border-t-1 shadow-md dark:bg-gray-800 dark:border-gray-700 ${cardClassName}`}>
          <div
            className={`relative grid grid-cols-1 gap-6 mb-6 px-6 py-4 rounded-2xl text-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800`}>
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
            <div className="flex flex-col items-center justify-center mt-6 mx-2">
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
                  className={`text-2xl font-bold text-gray-900 dark:text-white ${priceClassName}`}>
                  {formatPrice(currentData.price_vnd)}
                </div>
              )}
            </div>

            {/* Hàng 4: Nút */}
            <div className="flex items-center justify-center">
              <button
                onClick={isEditable ? handleSubmit : handleSelect}
                className={`w-full font-semibold py-2 px-6 rounded-xl transition-colors shadow-md bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white ${buttonClassName}`}>
                {buttonText}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4 text-gray-700 dark:text-gray-200">
              Thông tin gói
            </h3>
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5">
                  <CiCircleCheck
                    className="w-5 h-5 text-indigo-500 dark:text-indigo-400"
                    strokeWidth={2.5}
                  />
                </div>
                <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}

            {/* Link xem chi tiết */}
            <div className="flex justify-end gap-3 mt-6 mx-2">
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
