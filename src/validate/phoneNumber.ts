import type { IRandomSelectionLine } from "../pages/PhoneNumbers/PhoneRandomModal";
import { IPhoneNumber } from "../types";

export const validatePhoneNumber = (phone: IPhoneNumber) => {
  const errors: Partial<Record<keyof IPhoneNumber, string>> = {};
  if (!phone.phone_number) {
    errors.phone_number = "Số điện thoại không được để trống";
  }
  const providerId = phone.provider_id;
  if (
    providerId === "" ||
    providerId === "0" ||
    providerId === 0 ||
    providerId == null
  ) {
    errors.provider_id = "Vui lòng chọn nhà cung cấp";
  }

  const typeId = phone.type_id;
  if (typeId === "" || typeId === 0 || typeId == null) {
    errors.type_id = "Vui lòng chọn loại số";
  }

  if (!phone.installation_fee) {
    errors.installation_fee = "Phí khởi tạo không được để trống";
  } else if (phone.installation_fee < 0) {
    errors.installation_fee = "Phí khởi tạo phải lớn hơn hoặc bằng 0";
  }

  if (!phone.maintenance_fee) {
    errors.maintenance_fee = "Phí duy trì không được để trống";
  } else if (phone.maintenance_fee < 0) {
    errors.maintenance_fee = "Phí duy trì phải lớn hơn hoặc bằng 0";
  }

  return errors;
};

export type RandomLineErrors = Partial<
  Record<"quantity" | "provider_id" | "type_id", string>
>;

export const validateRandomSelections = (lines: IRandomSelectionLine[]) => {
  const errors: Record<string, RandomLineErrors> = {};
  lines.forEach((line) => {
    const row: RandomLineErrors = {};
    if (!line.quantity || line.quantity < 1) {
      row.quantity = "Nhập số lượng";
    }
    if (!line.provider_id) {
      row.provider_id = "Vui lòng chọn nhà cung cấp";
    }
    if (!line.type_id) {
      row.type_id = "Vui lòng chọn loại số";
    }
    if (Object.keys(row).length > 0) errors[line.id] = row;
  });
  return errors;
};
