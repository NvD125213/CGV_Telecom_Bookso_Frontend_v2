export const parseNumberFromFormatted = (value: string) => {
  return Number(value.replace(/,/g, ""));
};

export const formatNumberWithCommas = (value: string) => {
  // Xóa các ký tự không phải số
  const numericValue = value.replace(/\D/g, "");
  // Thêm dấu phẩy phân cách hàng nghìn
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
