import { useEffect, useMemo, useState } from "react";
import CustomModal from "../../components/common/CustomModal";
import {
  useReplaceTelcosForType,
  useTypeNumberTelcoMap,
} from "../../hooks/api-hooks/v3/useTypeNumberTelco";
import Swal from "sweetalert2";

interface TelcoOption {
  label: string;
  value: string;
}

export interface ReplaceTelcoTarget {
  type_id: number;
  type_name: string;
  telcos: string[];
}

interface ModalTelcoBulkProps {
  isOpen: boolean;
  data?: ReplaceTelcoTarget | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FieldValue = string | number | boolean | TelcoOption[];

const ModalTelcoBulk: React.FC<ModalTelcoBulkProps> = ({
  isOpen,
  data,
  onClose,
  onSuccess,
}) => {
  const [selectedTelcos, setSelectedTelcos] = useState<TelcoOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const { data: mapData } = useTypeNumberTelcoMap({ enabled: isOpen });
  const replaceTelcos = useReplaceTelcosForType();

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTelcos(
      (data?.telcos ?? []).map((telco) => ({
        label: telco,
        value: telco,
      })),
    );
    setErrors({});
    setError("");
  }, [isOpen, data]);

  const telcoOptions = useMemo(
    () =>
      (mapData?.by_telco ?? []).map((item) => ({
        label: item.telco,
        value: item.telco,
      })),
    [mapData],
  );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!data?.type_id) {
      nextErrors.type_id = "Thiếu định dạng số!";
    }
    if (selectedTelcos.length === 0) {
      nextErrors.telcos = "Vui lòng chọn hoặc nhập ít nhất 1 nhà mạng!";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const sendRequest = async () => {
    if (!validateForm() || !data?.type_id) return;

    const telcos = selectedTelcos
      .map((item) => String(item.value).trim().toUpperCase())
      .filter(Boolean);

    try {
      await replaceTelcos.mutateAsync({
        typeId: data.type_id,
        data: { telcos },
      });

      await Swal.fire({
        title: "Cập nhật thành công!",
        text: `Đã ghi đè ${telcos.length} nhà mạng cho định dạng ${data.type_name}.`,
        icon: "success",
      });

      setError("");
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; detail?: string } } })
          ?.response?.data?.message ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ||
        (err as Error)?.message ||
        "Đã có lỗi xảy ra";
      setError(typeof message === "string" ? message : "Đã có lỗi xảy ra");
    }
  };

  const formFields = useMemo(
    () => [
      {
        name: "type_name",
        label: "Định dạng số",
        type: "text" as const,
        value: data?.type_name || "",
        onChange: () => undefined,
        disabled: true,
      },
      {
        name: "telcos",
        label: "Nhà mạng",
        type: "autocomplete" as const,
        value: selectedTelcos,
        onChange: (value: FieldValue) => {
          if (!Array.isArray(value)) return;
          setSelectedTelcos(value as TelcoOption[]);
          setErrors((prev) => ({ ...prev, telcos: "" }));
        },
        options: telcoOptions,
        freeSolo: true,
        placeholder: "Chọn gợi ý hoặc gõ tên mới rồi Enter...",
        error: errors.telcos,
      },
    ],
    [data?.type_name, selectedTelcos, telcoOptions, errors.telcos],
  );

  return (
    <CustomModal
      errorDetail={error}
      isOpen={isOpen}
      title="Thay thế toàn bộ nhà mạng theo định dạng"
      description="Danh sách nhà mạng bên dưới sẽ thay thế toàn bộ nhà mạng hiện tại của định dạng này."
      disabledAll={replaceTelcos.isPending}
      fields={formFields as Parameters<typeof CustomModal>[0]["fields"]}
      onClose={onClose}
      onSubmit={sendRequest}
      submitText={replaceTelcos.isPending ? "Đang cập nhật..." : "Thay thế"}
    />
  );
};

export default ModalTelcoBulk;
