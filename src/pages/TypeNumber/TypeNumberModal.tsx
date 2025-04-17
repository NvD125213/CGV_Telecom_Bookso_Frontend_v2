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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState("");
  useEffect(() => {
    if (data) {
      const rawNumber = convertTimeToNumber(data.booking_expiration);
      const formattedExpiration = data.booking_expiration
        ? formatBookingExpiration(rawNumber)
        : "00.00.00";

      if (parseBookingExpiration(formattedExpiration) === 0) {
        alert("Thời gian giữ không được bằng 0");
      }
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
    setErrors({});
    setError("");
  }, [data, isOpen]);

  const setValue = (name: keyof ITypeNumber, value: string | number) => {
    if (name === "booking_expiration") {
      const formattedValue = formatBookingExpiration(value);
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

    // Clear error
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!typeNumber.name) {
      newErrors.name = "Tên định dạng không được để trống!";
    }

    if (!typeNumber.booking_expiration) {
      newErrors.booking_expiration = "Thời gian giữ không được để trống!";
    } else if (parseBookingExpiration(typeNumber.booking_expiration) === 0) {
      newErrors.booking_expiration = "Thời gian giữ không được bằng 0!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendRequest = async () => {
    if (!validateForm()) return;

    // Convert booking_expiration to type number
    const submitData = {
      ...typeNumber,
      booking_expiration: String(
        parseBookingExpiration(typeNumber.booking_expiration)
      ),
    };
    const normalizeString = (str: string) => str.trim().replace(/\s+/g, " ");
    const trimData: ITypeNumber = {
      ...submitData,
      ...Object.fromEntries(
        Object.entries(submitData).map(([key, value]) => [
          key,
          typeof value === "string" ? normalizeString(value) : value,
        ])
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
    try {
      if (!typeNumber.id) {
        console.log(">>>", trimData);

        const res = await createTypeNumber(trimData);
        if (res?.status === 200) {
          Swal.fire({
            title: "Thêm thành công!",
            text: `Thêm thành công định dạng ${res.data.name}!`,
            icon: "success",
          });
          setError("");
          onClose();
          onSuccess();
        }
      } else {
        const res = await updateTypeNumber(trimData.id, trimData);
        if (res?.status === 200) {
          Swal.fire({
            title: "Cập nhật thành công!",
            text: `Cập nhật thành công định dạng ${res.data.name}!`,
            icon: "success",
          });
          setError("");
          onClose();
          onSuccess();
        }
      }
    } catch (err: any) {
      if (err.status === 409) {
        setError("Định dạng số đã tồn tại");
      } else {
        setError(err.response.data.detail);
      }
    }
  };

  return (
    <CustomModal
      errorDetail={error}
      isOpen={isOpen}
      title={data ? "Cập nhật định dạng" : "Tạo định dạng"}
      description="Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập nhật."
      fields={[
        {
          name: "name",
          label: "Tên định dạng",
          type: "text",
          value: typeNumber.name || "",
          onChange: (value) => setValue("name", value as string),
          placeholder: "Nhập tên định dạng",
          error: errors.name,
        },
        {
          name: "booking_expiration",
          label: `Thời gian chờ triển khai (HH.MM.SS)`,
          type: "text",
          value: typeNumber.booking_expiration || "00.00.00",
          onChange: (value) => setValue("booking_expiration", value as string),
          placeholder: "00.00.00",
          error: errors.booking_expiration,
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
