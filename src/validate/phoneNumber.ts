import { IBookRandom } from "../pages/PhoneNumbers/PhoneRandomModal";
import { IPhoneNumber } from "../types";

export const validatePhoneNumber = (phone: IPhoneNumber) => {
  const errors: Partial<Record<keyof IPhoneNumber, string>> = {};
  if (!phone.phone_number) {
    errors.phone_number = "Số điện thoại không được để trống";
  }
  if (!phone.provider_id || phone.provider_id === "0") {
    errors.provider_id = "Vui lòng chọn nhà cung cấp";
  }

  if (!phone.type_id) {
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

  if (!phone.vanity_number_fee) {
    errors.vanity_number_fee = "Phí số đẹp không được để trống";
  } else if (phone.vanity_number_fee < 0) {
    errors.vanity_number_fee = "Phí số đẹp phải lớn hơn hoặc bằng 0";
  }

  return errors;
};

export const validateRandomPhone = (phone: IBookRandom) => {
  const errors: Partial<Record<keyof IBookRandom, string>> = {};
  if (!phone.quantity) {
    errors.quantity = "Nhập số điện thoại";
  }
  if (!phone.provider_id) {
    errors.provider_id = "Vui lòng chọn nhà cung cấp";
  }

  if (!phone.type_id) {
    errors.type_id = "Vui lòng chọn loại số";
  }

  return errors;
};
