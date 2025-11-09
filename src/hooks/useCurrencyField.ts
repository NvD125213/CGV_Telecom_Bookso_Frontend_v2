import { useState } from "react";

/**
 * Hook xử lý các input dạng tiền tệ hoặc số có format
 * @param initialFields - Danh sách các trường cần format, ví dụ: { price_vnd: "", minutes: "" }
 * @param onValueChange - Callback khi giá trị raw (dạng số) thay đổi
 */
export function useCurrencyFields<T extends Record<string, any>>(
  initialFields: Partial<Record<keyof T, string>>,
  onValueChange?: <K extends keyof T>(field: K, value: T[K]) => void
) {
  const [currencyFields, setCurrencyFields] = useState(initialFields);

  // Format hiển thị
  const formatCurrency = (value: number | string) => {
    if (value === null || value === undefined || value === "") return "";
    return new Intl.NumberFormat("vi-VN").format(Number(value));
  };

  // Xử lý thay đổi input (hoặc set giá trị trực tiếp)
  const handleCurrencyChange = <K extends keyof T>(
    field: K,
    eOrValue: React.ChangeEvent<HTMLInputElement> | number | string
  ) => {
    let rawValue = "";

    if (typeof eOrValue === "object" && "target" in eOrValue) {
      // Trường hợp event từ input
      rawValue = eOrValue.target.value.replace(/[^0-9]/g, "");
    } else {
      // Trường hợp truyền giá trị trực tiếp (update mode)
      rawValue = String(eOrValue ?? "").replace(/[^0-9]/g, "");
    }

    // Cập nhật field hiển thị
    setCurrencyFields((prev) => ({
      ...prev,
      [field]: rawValue ? formatCurrency(rawValue) : "",
    }));

    // Gọi callback nếu có (để cập nhật form chính)
    if (onValueChange) {
      onValueChange(field, Number(rawValue) as T[K]);
    }
  };

  return {
    currencyFields,
    setCurrencyFields,
    handleCurrencyChange,
    formatCurrency,
  };
}
