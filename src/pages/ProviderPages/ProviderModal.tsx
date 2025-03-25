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
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (data) {
      setProvider(data);
      setInitialData(data);
    } else {
      setProvider(newProvider);
      setInitialData(null);
    }
  }, [data]);
  const setValue = (name: keyof IProvider, value: string | number) => {
    setProvider((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!provider.name) {
      setError("Tên nhà cung cấp không được để trống.");
      return false;
    }
    setError("");
    return true;
  };
  const sendRequest = async () => {
    if (!validateForm()) return;

    // Check if data don't change
    if (
      provider.id &&
      JSON.stringify(provider) === JSON.stringify(initialData)
    ) {
      onCloseModal();
      return;
    }

    if (!provider.id) {
      const res = await createProvider(provider);
      if (res?.status === 200) {
        Swal.fire({
          title: "Thêm thành công!",
          text: `Thêm thành công nhà cung cấp ${res.data.name} !`,
          icon: "success",
        });
        onCloseModal();
        onSuccess();
      }
    } else {
      const res = await updateProvider(provider.id, provider);
      if (res?.status === 200) {
        Swal.fire({
          title: "Cập nhật thành công!",
          text: `Cập nhật thành công nhà cung cấp ${res.data.name} !`,
          icon: "success",
        });
        onCloseModal();
        onSuccess();
      }
    }
  };
  return (
    <CustomModal
      isOpen={isOpen}
      title={data ? "Cập nhật nhà cung cấp" : "Tạo nhà cung cấp mới"}
      description="Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập nhật."
      fields={[
        {
          name: "name",
          label: "Tên nhà cung cấp",
          type: "text",
          value: provider.name ? provider.name : "",
          onChange: (value) => setValue("name", value as string),
          placeholder: "Nhập tên nhà cung cấp",
          error: error,
        },
        {
          name: "description",
          label: "Mô tả",
          type: "textarea",
          value: provider.description || "",
          onChange: (value) => setValue("description", value as string),
          placeholder: "Nhập chi tiết",
        },
      ]}
      onClose={onCloseModal}
      onSubmit={sendRequest}
      submitText={provider.id ? "Lưu thay đổi" : "Thêm"}
    />
  );
};

export default ModalProvider;
