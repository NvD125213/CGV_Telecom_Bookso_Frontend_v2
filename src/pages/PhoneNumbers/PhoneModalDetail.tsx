import { useEffect, useState } from "react";
import { IPhoneNumber, IProvider, ITypeNumber } from "../../types";
import CustomModal from "../../components/common/CustomModal";
import { initialPhoneNumber } from "../../services/phoneNumber";
import { updatePhone } from "../../services/phoneNumber";
import useSelectData from "../../hooks/useSelectData";
import { getProviders } from "../../services/provider";
import { getTypeNumber } from "../../services/typeNumber";
import Swal from "sweetalert2";
import { formatNumber, parseNumber } from "../../helper/formatCurrencyVND";

interface PhoneNumberProps {
  isOpen: boolean;
  onCloseModal: () => void;
  data?: IPhoneNumber | null;
  onSuccess: () => void;
}

const PhoneModalDetail: React.FC<PhoneNumberProps> = ({
  isOpen,
  onCloseModal,
  data,
  onSuccess,
}) => {
  const [phone, setPhone] = useState<IPhoneNumber>(initialPhoneNumber);
  const [errorDetail, setErrorDetail] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof IPhoneNumber, string>>
  >({});

  // Chỉ cần 1 useEffect để set dữ liệu ban đầu
  useEffect(() => {
    if (data) {
      setPhone(data);
    } else {
      setPhone(initialPhoneNumber);
    }
  }, [data]);

  const { data: providers } = useSelectData<IProvider>({
    service: getProviders,
  });

  const { data: typeNumbers } = useSelectData<ITypeNumber>({
    service: getTypeNumber,
  });

  const setValue = (name: keyof IPhoneNumber, value: string | number) => {
    let finalValue: string | number = value;
    if (
      ["installation_fee", "maintenance_fee", "vanity_number_fee"].includes(
        name
      )
    ) {
      const stringValue = value.toString().replace(/\./g, "");
      if (/[^0-9]/.test(stringValue)) {
        alert("Không được nhập chữ trong phần giá");
        return;
      }
      finalValue = parseNumber(value.toString());
    }

    setPhone((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const checkIDSelect = () => {
    if (phone.provider_name && providers.length) {
      const provider = providers.find(
        (p) => p.name.toLowerCase() === phone.provider_name?.toLowerCase()
      );
      if (provider) {
        setValue("provider_id", Number(provider.id));
      }
    }
    if (phone.type_name && typeNumbers.length) {
      const typeNumber = typeNumbers.find(
        (t) => t.name.toLowerCase() === phone.type_name?.toLowerCase()
      );
      if (typeNumber) {
        setValue("type_id", Number(typeNumber.id));
      }
    }
  };

  useEffect(() => {
    checkIDSelect();
  }, [providers, typeNumbers, phone.provider_name, phone.type_name]);

  const handleSubmit = async () => {
    try {
      const res = await updatePhone(Number(phone.phone_number_id), phone);
      if (res?.status === 200) {
        Swal.fire("Cập nhật thành công!", "", "success");
        onCloseModal();
        onSuccess();
      }
    } catch (err: any) {
      setErrorDetail(err.response?.data?.detail || "Có lỗi xảy ra");
    }
  };

  return (
    <CustomModal
      errorDetail={errorDetail}
      isOpen={isOpen}
      title="Chi tiết số điện thoại"
      showSubmitButton={true}
      fields={[
        {
          name: "phone_number",
          label: "Số điện thoại",
          type: "text",
          value: phone.phone_number || "",
          onChange: (value) => setValue("phone_number", value),
          error: errors.phone_number,
          disabled: true,
        },
        {
          name: "status",
          label: "Trạng thái",
          type: "text",
          value: phone.status || "Không có",
          onChange: (value) => setValue("status", value),
          disabled: true,
          error: errors.status,
        },
        {
          name: "provider_id",
          label: "Nhà cung cấp",
          type: "select",
          value: phone.provider_id || "",
          options: [
            { label: "Chọn nhà cung cấp", value: "", key: "default" },
            ...providers.map((provider) => ({
              label: provider.name,
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
          value: phone.type_id || "",
          options: [
            { label: "Chọn loại số", value: "", key: "default" },
            ...typeNumbers.map((type) => ({
              label: type.name,
              value: type.id,
              key: type.id,
            })),
          ],
          onChange: (value) => setValue("type_id", value),
          error: errors.type_id,
        },
        {
          name: "installation_fee",
          label: "Phí yêu cầu",
          type: "text", // Đổi sang text
          value: formatNumber(phone.installation_fee?.toString() || "0"), // Giá trị định dạng
          onChange: (value) => setValue("installation_fee", value),
          error: errors.installation_fee,
        },
        {
          name: "maintenance_fee",
          label: "Phí duy trì",
          type: "text", // Đổi sang text
          value: formatNumber(phone.maintenance_fee?.toString() || "0"), // Giá trị định dạng
          onChange: (value) => setValue("maintenance_fee", value),
          error: errors.maintenance_fee,
        },
        {
          name: "vanity_number_fee",
          label: "Phí số đẹp",
          type: "text", // Đổi sang text
          value: formatNumber(phone.vanity_number_fee?.toString() || "0"), // Giá trị định dạng
          onChange: (value) => setValue("vanity_number_fee", value),
          error: errors.vanity_number_fee,
        },
      ]}
      onClose={onCloseModal}
      onSubmit={handleSubmit}
      submitText="Lưu"
    />
  );
};

export default PhoneModalDetail;
