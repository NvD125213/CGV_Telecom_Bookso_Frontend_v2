import { useEffect, useState } from "react";
import { IPhoneNumber } from "../../types";
import CustomModal from "../../components/common/CustomModal";
import { initialPhoneNumber } from "../../services/phoneNumber";
import { formatDateTime } from "../../helper/formatDateToISOString";
import { formatCurrencyVND } from "../../helper/formatCurrencyVND";
interface PhoneNumberProps {
  isOpen: boolean;
  onCloseModal: () => void;
  data?: IPhoneNumber | null;
}

const PhoneModalDetail: React.FC<PhoneNumberProps> = ({
  isOpen,
  onCloseModal,
  data,
}) => {
  const [phone, setPhone] = useState<IPhoneNumber>(initialPhoneNumber);

  useEffect(() => {
    if (data) {
      setPhone(data);
    } else {
      setPhone(initialPhoneNumber);
    }
  }, [data]);

  const setValue = (name: keyof IPhoneNumber, value: string | number) => {
    setPhone((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <CustomModal
      isOpen={isOpen}
      title="Chi tiết số điện thoại"
      showSubmitButton={false}
      disabledAll={true}
      fields={[
        {
          name: "phone_number",
          label: "Số điện thoại",
          type: "text",
          value: phone.phone_number || "",
          onChange: (value) => setValue("phone_number", value),
        },
        {
          name: "status",
          label: "Trạng thái",
          type: "text",
          value: phone.status || "Không có",
          onChange: (value) => setValue("status", value),
        },
        {
          name: "provider_name",
          label: "Nhà cung cấp",
          type: "text",
          value: phone.provider_name || "Không có",
          onChange: (value) => setValue("provider_name", value),
        },
        {
          name: "type_name",
          label: "Định dạng",
          type: "text",
          value: phone.type_name || "Không có",
          onChange: (value) => setValue("type_name", value),
        },
        {
          name: "installation_fee",
          label: "Phí yêu cầu",
          type: "text",
          value: formatCurrencyVND(phone.installation_fee) || "Không có",
          onChange: (value) => setValue("installation_fee", value),
        },
        {
          name: "maintenance_fee",
          label: "Phí duy trì",
          type: "text",
          value: formatCurrencyVND(phone.maintenance_fee) || "Không có",
          onChange: (value) => setValue("maintenance_fee", value),
        },
        {
          name: "vanity_number_fee",
          label: "Phí số đẹp",
          type: "text",
          value: formatCurrencyVND(phone.vanity_number_fee) || "Không có",
          onChange: (value) => setValue("vanity_number_fee", value),
        },
        {
          name: "booked_until",
          label: "Hạn đặt",
          type: "text",
          value: phone.booked_until
            ? formatDateTime(phone.booked_until)
            : "Không có",
          onChange: (value) => setValue("booked_until", value),
        },
      ]}
      onClose={onCloseModal}
      submitText="Lưu"
    />
  );
};

export default PhoneModalDetail;
