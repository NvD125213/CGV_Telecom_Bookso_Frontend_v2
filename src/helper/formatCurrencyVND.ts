export const formatNumber = (value: string): string => {
  const numericValue = value.replace(/\D/g, "");
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseNumber = (value: string): number => {
  return Number(value.replace(/\./g, ""));
};
