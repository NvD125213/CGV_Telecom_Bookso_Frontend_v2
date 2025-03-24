import { useState } from "react";
import { IPhoneNumber, IProvider, ITypeNumber } from "../../types";
import CustomModal from "../../components/common/CustomModal";
import {
  initialPhoneNumber,
  createPhoneNumber,
} from "../../services/phoneNumber";
import Swal from "sweetalert2";
import { getProviders } from "../../services/provider";
import { getTypeNumber } from "../../services/typeNumber";
import useSelectData from "../../hooks/useSelectData";
import { validatePhoneNumber } from "../../validate/phoneNumber";

interface PhoneNumberProps {
  isOpen: boolean;
  onCloseModal: () => void;
}

const PhoneNumberModal: React.FC<PhoneNumberProps> = ({
  isOpen,
  onCloseModal,
}) => {
  const [phone, setPhone] = useState<IPhoneNumber>(initialPhoneNumber);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IPhoneNumber, string>>
  >({});
  const [errorDetail, setErrorDetail] = useState("");
  const setValue = (name: keyof IPhoneNumber, value: string | number) => {
    setPhone((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const { data: providers } = useSelectData<IProvider>({
    service: getProviders,
  });

  const { data: typeNumbers } = useSelectData<ITypeNumber>({
    service: getTypeNumber,
  });

  const handleSubmit = async (data: IPhoneNumber) => {
    const validationErrors = validatePhoneNumber(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await createPhoneNumber(data);
      if (res.status === 200) {
        Swal.fire("Thêm thành công!", "", "success");
        onCloseModal();
      }
    } catch (error: any) {
      setErrorDetail(error.response?.data?.detail);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      title={"Tạo số điện thoại mới"}
      description="Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập nhật."
      errorDetail={errorDetail}
      fields={[
        {
          name: "phone_number",
          label: "Số điện thoại",
          type: "text",
          value: phone.phone_number,
          onChange: (value) => setValue("phone_number", value),
          error: errors.phone_number,
        },
        {
          name: "provider_id",
          label: "Nhà cung cấp",
          type: "select",
          value: phone.provider_id,
          options: [
            { label: "Chọn nhà cung cấp", value: "0", key: "default" },
            ...providers.map((provider) => ({
              label: `${provider.name}`,
              value: provider.id,
              key: provider.id,
            })),
          ],
          onChange: (value) => setValue("provider_id", value),
          error: errors.provider_id,
        },
        {
          name: "type_id",
          label: "Loại số",
          type: "select",
          value: phone.type_id,
          options: [
            { label: "Chọn loại số", value: "", key: "default" },
            ...typeNumbers.map((type) => ({
              label: `${type.name}`,
              value: type.id,
              key: type.id,
            })),
          ],
          onChange: (value) => setValue("type_id", value),
          error: errors.type_id,
        },
        {
          name: "installation_fee",
          label: "Phí khởi tạo",
          type: "number",
          value: phone.installation_fee || "",
          onChange: (value) => setValue("installation_fee", value),
          error: errors.installation_fee,
        },
        {
          name: "maintenance_fee",
          label: "Phí duy trì",
          type: "number",
          value: phone.maintenance_fee || "",
          onChange: (value) => setValue("maintenance_fee", value),
          error: errors.maintenance_fee,
        },
        {
          name: "vanity_number_fee",
          label: "Phí số đẹp",
          type: "number",
          value: phone.vanity_number_fee || "",
          onChange: (value) => setValue("vanity_number_fee", value),
          error: errors.vanity_number_fee,
        },
      ]}
      onClose={onCloseModal}
      onSubmit={() => handleSubmit(phone)}
      submitText={"Lưu"}
    />
  );
};

export default PhoneNumberModal;
