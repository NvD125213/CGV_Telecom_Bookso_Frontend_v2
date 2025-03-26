export const formatCurrencyVND = (value: number) => {
  if (!value) return "";
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
