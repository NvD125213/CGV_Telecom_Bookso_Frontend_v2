import { useEffect, useState } from "react";
import { ITypeNumber } from "../../types";
import CustomModal from "../../components/common/CustomModal";
import {
  createTypeNumber,
  newTypeNumber,
  updateTypeNumber,
} from "../../services/typeNumber";
import {
  convertTimeToNumber,
  formatBookingExpiration,
  parseBookingExpiration,
} from "../../helper/convertTimeToNumber";
import Swal from "sweetalert2";

interface TypeNumberModal {
  isOpen: boolean;
  data?: ITypeNumber;
  oldData?: ITypeNumber;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalTypeNumber: React.FC<TypeNumberModal> = ({
  isOpen,
  data,
  onClose,
  onSuccess,
}) => {
  const [typeNumber, setTypeNumber] = useState<ITypeNumber>(newTypeNumber);
  const [initialData, setInitialData] = useState<ITypeNumber | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (data) {
      const formattedExpiration = data.booking_expiration
        ? formatBookingExpiration(convertTimeToNumber(data.booking_expiration))
        : "00.00.00";
      setTypeNumber({
        ...data,
        booking_expiration: formattedExpiration,
      });
      setInitialData(data);
    } else {
      setTypeNumber({
        ...newTypeNumber,
        booking_expiration: "00.00.00",
      });
      setInitialData(null);
    }
  }, [data]);
  const setValue = (name: keyof ITypeNumber, value: string | number) => {
    if (name === "booking_expiration") {
      // Chỉ cho phép nhập số và dấu chấm
      const cleanValue = String(value).replace(/[^0-9.]/g, "");
      // Format lại thành HH.MM.SS khi người dùng nhập
      const formattedValue = formatBookingExpiration(cleanValue);
      setTypeNumber((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setTypeNumber((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    if (!typeNumber.name) {
      setError("Tên định dạng không được để trống !");
      return false;
    }
    setError("");
    return true;
  };
  const sendRequest = async () => {
    if (!validateForm()) return;

    // Convert booking_expiration về định dạng số trước khi gửi
    const submitData = {
      ...typeNumber,
      booking_expiration: String(
        parseBookingExpiration(typeNumber.booking_expiration)
      ),
    };

    if (
      typeNumber.id &&
      JSON.stringify({ ...submitData, id: typeNumber.id }) ===
        JSON.stringify(initialData)
    ) {
      onClose();
      return;
    }

    if (!typeNumber.id) {
      const res = await createTypeNumber(submitData);
      if (res?.status === 200) {
        Swal.fire({
          title: "Thêm thành công!",
          text: `Thêm thành công nhà cung cấp ${res.data.name}!`,
          icon: "success",
        });

        onClose();
        onSuccess();
      }
    } else {
      const res = await updateTypeNumber(typeNumber.id, submitData);
      console.log(res);
      if (res?.status === 200) {
        Swal.fire({
          title: "Cập nhật thành công!",
          text: `Cập nhật thành công nhà cung cấp ${res.data.name}!`,
          icon: "success",
        });
        onClose();
        onSuccess();
      }
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      title={data ? "Cập nhật định dạng" : "Tạo định dạng"}
      description="Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập nhật."
      fields={[
        {
          name: "name",
          label: "Tên định dạng",
          type: "text",
          value: typeNumber.name ? typeNumber.name : "",
          onChange: (value) => setValue("name", value as string),
          placeholder: "Nhập tên định dạng",
          error: error,
        },
        {
          name: "booking_expiration",
          label: `Thời gian chờ triển khai (Nhập số giây)`,
          type: "text",
          value: typeNumber.booking_expiration || "00.00.00",
          onChange: (value) => setValue("booking_expiration", value as string),
          placeholder: "00.00.00",
        },
        {
          name: "description",
          label: "Mô tả",
          type: "textarea",
          value: typeNumber.description || "",
          onChange: (value) => setValue("description", value as string),
          placeholder: "Nhập chi tiết",
        },
      ]}
      onClose={onClose}
      onSubmit={sendRequest}
      submitText={typeNumber.id ? "Lưu thay đổi" : "Thêm"}
    />
  );
};

export default ModalTypeNumber;
