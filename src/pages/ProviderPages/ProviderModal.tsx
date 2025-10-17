import { useEffect, useState } from "react";
import { createProvider, updateProvider } from "../../services/provider";
import { IProvider } from "../../types";
import { newProvider } from "../../services/provider";
import CustomModal from "../../components/common/CustomModal";
import { users } from "../../constants/user";
import ModalCustomProvider from "../../components/common/ModalProvider";
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
  const [selectedUsers, setselectedUsers] = useState([]);

  useEffect(() => {
    if (data) {
      // Chuẩn hóa dữ liệu đầu vào đề phòng danh sách bị ép kiểu khi hiển thị bảng
      const normalizedIsPublic =
        typeof data.is_public === "string"
          ? ["public", "true", "1", "yes"].includes(
              (data.is_public as string).toLowerCase()
            )
          : Boolean(data.is_public);

      const normalizedUsersRule = Array.isArray((data as any)?.users?.rule)
        ? ((data as any).users.rule as string[])
        : typeof (data as any).users === "string"
        ? ((data as any).users as string)
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        : [];

      const normalizedData: IProvider = {
        ...(data as IProvider),
        is_public: normalizedIsPublic,
        users: { rule: normalizedUsersRule },
      };

      setProvider(normalizedData);
      setInitialData(normalizedData);

      if (normalizedUsersRule && Array.isArray(normalizedUsersRule)) {
        const mappedUsers = normalizedUsersRule.map((u: string) => ({
          label: u,
          value: u,
        }));
        setselectedUsers(mappedUsers as any);
      } else {
        setselectedUsers([]);
      }
    } else {
      setProvider(newProvider);
      setInitialData(null);
      setselectedUsers([]);
    }

    setErrors({});
    setError("");
  }, [data, isOpen]);

  const setValue = (
    name: keyof IProvider,
    value: string | number | boolean
  ) => {
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
    if (
      provider.phone_number_limit_alert === undefined ||
      provider.phone_number_limit_alert === null
    ) {
      newErrors.phone_number_limit_alert =
        "Hạn mức cảnh báo không được để trống !";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendRequest = async () => {
    try {
      if (!validateForm()) return;
      const normalizeString = (str: string) => str.trim().replace(/\s+/g, " ");
      const trimProvider: IProvider = Object.fromEntries(
        Object.entries(provider).map(([key, value]) => [
          key,
          typeof value === "string" ? normalizeString(value) : value,
        ])
      ) as IProvider;
      trimProvider.users = {
        rule:
          selectedUsers.length > 0
            ? selectedUsers.map((user) => (user as any).value) // hoặc user.label
            : ["Không có người dùng"],
      };

      // Nếu ở chế độ update và sau khi chuẩn hóa không có thay đổi thì đóng modal
      if (trimProvider.id && initialData) {
        if (JSON.stringify(trimProvider) === JSON.stringify(initialData)) {
          onCloseModal();
          return;
        }
      }

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
        console.log(res);
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
    <>
      <ModalCustomProvider
        isOpen={isOpen}
        errorDetail={error}
        title={data ? "Cập nhật nhà cung cấp" : "Tạo nhà cung cấp mới"}
        description="Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập nhật."
        fields={[
          {
            name: "is_public",
            label: "Trạng thái",
            type: "switch",
            value: provider.is_public,
            onChange: (value) => setValue("is_public", value as boolean),
            error: errors.is_public,
          },
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
            name: "users",
            label: "Chọn người được phép sử dụng",
            type: "autocomplete",
            value: selectedUsers,
            onChange: (value) => setselectedUsers(value as any),
            options: [...users.map((user) => ({ label: user, value: user }))],
            placeholder: "Gõ để tìm...",
          },

          {
            name: "phone_number_limit_alert",
            label: "Hạn mức cảnh báo",
            type: "number",
            value: provider.phone_number_limit_alert,
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
    </>
  );
};

export default ModalProvider;
