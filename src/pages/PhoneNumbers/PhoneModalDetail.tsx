import { useEffect, useState } from "react";
import { IPhoneNumber, IProvider, ITypeNumber } from "../../types";
import CustomModal from "../../components/common/CustomModal";
import { initialPhoneNumber } from "../../services/phoneNumber";
// import { formatTime } from "../../helper/formatDateToISOString";
import { formatCurrencyVND } from "../../helper/formatCurrencyVND";
// import { validatePhoneNumber } from "../../validate/phoneNumber";
import { updatePhone } from "../../services/phoneNumber";
import useSelectData from "../../hooks/useSelectData";
import { getProviders } from "../../services/provider";
import { getTypeNumber } from "../../services/typeNumber";
import Swal from "sweetalert2";

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

  console.log(">>", data);
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
    setPhone((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  console.log();

  const checkIDSelect = () => {
    if (
      (phone.provider_name && providers.length) ||
      (phone.type_name && typeNumbers.length)
    ) {
      const provider = providers.find(
        (p) => p.name.toLowerCase() === phone.provider_name?.toLowerCase()
      );
      const typeNumber = typeNumbers.find(
        (t) => t.name.toLowerCase() === phone.type_name?.toLowerCase()
      );
      if (provider) {
        setValue("provider_id", Number(provider.id));
      }
      if (typeNumber) {
        setValue("type_number_id", Number(typeNumber.id));
      }
    }
  };

  useEffect(() => {
    if (data) {
      setPhone(data);
    } else {
      setPhone(initialPhoneNumber);
    }
  }, [data]);

  useEffect(() => {
    if (
      (phone.provider_name && providers.length) ||
      (phone.type_name && typeNumbers.length)
    ) {
      checkIDSelect();
    }
  }, [providers, phone.provider_name]);

  const handleSubmit = async () => {
    try {
      const res = await updatePhone(Number(phone.id), phone);
      if (res?.status === 200) {
        Swal.fire("Cập nhật thành công!", "", "success");
        onCloseModal();
        onSuccess();
      }
    } catch (err: any) {
      setErrorDetail(err.response.data.detail);
    }
  };
  console.log(">>", phone);
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
          value: phone.provider_id,
          options: [
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
          name: "type_number_id",
          label: "Loại số",
          type: "select",
          value: phone.type_number_id,
          options: [
            { label: "Chọn loại số", value: "", key: "default" },
            ...typeNumbers.map((type) => ({
              label: `${type.name}`,
              value: type.id,
              key: type.id,
            })),
          ],
          onChange: (value) => setValue("type_number_id", value),
          error: errors.type_number_id,
        },
        {
          name: "installation_fee",
          label: "Phí yêu cầu",
          type: "text",
          value: phone.installation_fee
            ? formatCurrencyVND(phone.installation_fee)
            : 0,
          onChange: (value) => setValue("installation_fee", value),
          error: errors.installation_fee,
        },
        {
          name: "maintenance_fee",
          label: "Phí duy trì",
          type: "number",
          value: phone.maintenance_fee
            ? formatCurrencyVND(phone.maintenance_fee)
            : 0,
          onChange: (value) => setValue("maintenance_fee", value),
          error: errors.maintenance_fee,
        },
        {
          name: "vanity_number_fee",
          label: "Phí số đẹp",
          type: "number",
          value: phone.vanity_number_fee
            ? formatCurrencyVND(phone.vanity_number_fee)
            : 0,
          onChange: (value) => setValue("vanity_number_fee", value),

          error: errors.vanity_number_fee,
        },
      ]}
      onClose={onCloseModal}
      onSubmit={() => handleSubmit()}
      submitText="Lưu"
    />
  );
};

export default PhoneModalDetail;
