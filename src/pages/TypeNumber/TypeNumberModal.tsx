import { useEffect, useState } from "react";
import { ITypeNumber } from "../../types";
import CustomModal from "../../components/common/CustomModal";
import {
  createTypeNumber,
  newTypeNumber,
  updateTypeNumber,
} from "../../services/typeNumber";
import Swal from "sweetalert2";

interface TypeNumberModal {
  isOpen: boolean;
  data?: ITypeNumber;
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
      setTypeNumber(data);
      setInitialData(data);
    } else {
      setTypeNumber(newTypeNumber);
      setInitialData(null);
    }
  }, [data]);
  const setValue = (name: keyof ITypeNumber, value: string | number) => {
    setTypeNumber((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    if (
      typeNumber.id &&
      JSON.stringify(typeNumber) === JSON.stringify(initialData)
    ) {
      onClose();
      return;
    }

    if (!typeNumber.id) {
      const res = await createTypeNumber(typeNumber);
      if (res?.status === 200) {
        Swal.fire({
          title: "Thêm thành công!",
          text: `Thêm thành công nhà cung cấp ${res.data.name} !`,
          icon: "success",
        });
        onClose();
        onSuccess();
      }
    } else {
      const res = await updateTypeNumber(typeNumber.id, typeNumber);
      if (res?.status === 200) {
        Swal.fire({
          title: "Cập nhật thành công!",
          text: `Cập nhật thành công nhà cung cấp ${res.data.name} !`,
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
          name: "description",
          label: "Chi tiết",
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
