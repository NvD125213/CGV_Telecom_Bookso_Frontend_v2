import { useEffect, useState } from "react";
import { createProvider, updateProvider } from "../../services/provider";
import { IProvider } from "../../types";
import { newProvider } from "../../services/provider";
import CustomModal from "../../components/common/CustomModal";
import Swal from "sweetalert2";

interface ProviderModalProps {
  isOpen: boolean;
  data?: IProvider;
  onCloseModal: () => void;
  onSuccess: () => void;
}

const ModalProvider: React.FC<ProviderModalProps> = ({
  isOpen,
  data,
  onCloseModal,
  onSuccess,
}) => {
  const [provider, setProvider] = useState<IProvider>(newProvider);
  const [initialData, setInitialData] = useState<IProvider | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState("");
  useEffect(() => {
    if (data) {
      setProvider(data);
      setInitialData(data);
    } else {
      setProvider(newProvider);
      setInitialData(null);
    }

    setErrors({});
    setError("");
  }, [data, isOpen]);
  const setValue = (name: keyof IProvider, value: string | number) => {
    setProvider((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts editing
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!provider.name) {
      newErrors.name = "Tên nhà cung cấp không được để trống !";
    }
    if (!provider.phone_number_limit_alert) {
      newErrors.phone_number_limit_alert = "Hạn mức cảnh báo cần lớn hơn 0 !";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendRequest = async () => {
    try {
      if (!validateForm()) return;

      if (
        provider.id &&
        JSON.stringify(provider) === JSON.stringify(initialData)
      ) {
        onCloseModal();
        return;
      }
      const normalizeString = (str: string) => str.trim().replace(/\s+/g, " ");
      const trimProvider: IProvider = Object.fromEntries(
        Object.entries(provider).map(([key, value]) => [
          key,
          typeof value === "string" ? normalizeString(value) : value,
        ])
      ) as IProvider;

      if (!provider.id) {
        const res = await createProvider(trimProvider);
        if (res?.status === 200) {
          Swal.fire({
            title: "Thêm thành công!",
            text: `Thêm thành công nhà cung cấp ${res.data.name} !`,
            icon: "success",
          });
          onCloseModal();
          setError("");
          onSuccess();
        }
      } else {
        const res = await updateProvider(trimProvider.id, trimProvider);
        if (res?.status === 200) {
          Swal.fire({
            title: "Cập nhật thành công!",
            text: `Cập nhật thành công nhà cung cấp ${res.data.name} !`,
            icon: "success",
          });
          setError("");
          onCloseModal();
          onSuccess();
        }
      }
    } catch (err: any) {
      if (err.status === 409) {
        setError("Nhà cung cấp đã tồn tại!");
      } else {
        setError(err.response.data.detail);
      }
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      errorDetail={error}
      title={data ? "Cập nhật nhà cung cấp" : "Tạo nhà cung cấp mới"}
      description="Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập nhật."
      fields={[
        {
          name: "name",
          label: "Tên nhà cung cấp",
          type: "text",
          value: provider.name || "",
          onChange: (value) => setValue("name", value as string),
          placeholder: "Nhập tên nhà cung cấp",
          error: errors.name,
        },
        {
          name: "phone_number_limit_alert",
          label: "Hạn mức cảnh báo",
          type: "number",
          value: provider.phone_number_limit_alert || "",
          onChange: (value) =>
            setValue("phone_number_limit_alert", value as number),
          placeholder: "Nhập hạn mức cảnh báo",
          error: errors.phone_number_limit_alert,
        },
        {
          name: "description",
          label: "Mô tả",
          type: "textarea",
          value: provider.description || "",
          onChange: (value) => setValue("description", value as string),
          placeholder: "Nhập chi tiết",
          error: errors.description,
        },
      ]}
      onClose={onCloseModal}
      onSubmit={sendRequest}
      submitText={provider.id ? "Lưu thay đổi" : "Thêm"}
    />
  );
};

export default ModalProvider;
