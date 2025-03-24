export const formatCurrencyVND = (value?: number): string => {
  if (value === undefined || isNaN(value)) return "Không có";

  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};
