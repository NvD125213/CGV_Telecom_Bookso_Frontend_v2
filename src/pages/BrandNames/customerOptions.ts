import { users } from "../../constants/user";

export const buildSaleOptions = (saleNames?: string[]) => {
  const source =
    saleNames && saleNames.length > 0 ? saleNames : [...users];
  return source.map((name) => ({ label: name, value: name }));
};

export const buildSaleFilterOptions = (saleNames?: string[]) => [
  { label: "Tất cả sale", value: "" },
  ...buildSaleOptions(saleNames).filter((opt) => opt.value !== ""),
];
