import { useState, useEffect } from "react";
import CustomModal from "../../components/common/CustomModal";
import { booking } from "../../services/phoneNumber";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface IBookPhoneNumber {
  user_name: string;
  id_phone_number: string | number;
  phone_number: string;
}

interface PhoneNumberProps {
  isOpen: boolean;
  onCloseModal: () => void;
  data?: IBookPhoneNumber | null;
}

const PhoneModalBook: React.FC<PhoneNumberProps> = ({
  isOpen,
  onCloseModal,
  data,
}) => {
  const [phone, setPhone] = useState<IBookPhoneNumber>({
    user_name: "",
    id_phone_number: "",
    phone_number: "",
  });

  const { user } = useSelector((state: RootState) => state.auth.user);
  const [errors, setError] = useState("");
  const setValue = (name: keyof IBookPhoneNumber, value: string | number) => {
    setPhone((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (data) {
      setPhone({
        user_name: user?.sub || "",
        id_phone_number: data.id_phone_number,
        phone_number: data.phone_number,
      });
    }
  }, [data, user]);

  const handleSubmit = async (data: IBookPhoneNumber) => {
    try {
      const res = await booking(data); // Gửi dữ liệu với key đã đúng
      if (res.status === 200) {
        Swal.fire({
          title: "Book thành công !",
          text: `${res.data.user_name} đã book thành công số điện thoại!`,
          icon: "success",
        });
        onCloseModal();
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail
        ?.map((err: any) => `${err.loc[1]}: ${err.msg}`)
        .join(", ");
      setError(errorMsg);
      console.log("Lỗi khi thực hiện post >>", error);
    }
  };

  return (
    <>
      <CustomModal
        isOpen={isOpen}
        title={"Tạo số điện thoại mới"}
        description="Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập nhật."
        fields={[
          {
            name: "user_name",
            label: "Tên người đặt",
            placeholder: "Nhập tên người book số...",
            type: "text",
            value: phone?.user_name || "",
            onChange: (value) => setValue("user_name", value),
            disabled: true,
          },
          {
            name: "phone_number",
            label: "Số điện thoại",
            type: "text",
            value: phone?.phone_number || "",
            onChange: (value) => setValue("phone_number", value),
            disabled: true,
          },
        ]}
        onClose={onCloseModal}
        onSubmit={() => handleSubmit(phone)}
        submitText={"Lưu"}
      />

      {errors && <div className="text-red-500">{errors}</div>}
    </>
  );
};

export default PhoneModalBook;
