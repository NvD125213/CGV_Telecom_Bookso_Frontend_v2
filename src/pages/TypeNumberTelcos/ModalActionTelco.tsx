import { useEffect, useMemo, useState } from "react";
import CustomModal from "../../components/common/CustomModal";
import useSelectData from "../../hooks/useSelectData";
import { getTypeNumber } from "../../services/typeNumber";
import { ITypeNumber } from "../../types";
import {
  useCreateTypeNumberTelcosBulk,
  useTypeNumberTelcoMap,
} from "../../hooks/api-hooks/v3/useTypeNumberTelco";
import Swal from "sweetalert2";

interface TelcoOption {
  label: string;
  value: string;
}

interface ModalActionTelcoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FieldValue = string | number | boolean | TelcoOption[];

const ModalActionTelco: React.FC<ModalActionTelcoProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [typeId, setTypeId] = useState<number | "">("");
  const [selectedTelcos, setSelectedTelcos] = useState<TelcoOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const { data: typeNumbers } = useSelectData<ITypeNumber>({
    service: getTypeNumber,
  });
  const { data: mapData } = useTypeNumberTelcoMap({ enabled: isOpen });
  const createBulk = useCreateTypeNumberTelcosBulk();

  useEffect(() => {
    if (!isOpen) return;
    setTypeId("");
    setSelectedTelcos([]);
    setErrors({});
    setError("");
  }, [isOpen]);

  const typeOptions = useMemo(
    () =>
      (typeNumbers ?? []).map((item) => ({
        label: item.name,
        value: Number(item.id),
      })),
    [typeNumbers],
  );

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
    if (!typeId) nextErrors.type_id = "Vui lòng chọn định dạng số!";
    if (selectedTelcos.length === 0) {
      nextErrors.telcos = "Vui lòng chọn hoặc nhập ít nhất 1 nhà mạng!";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const sendRequest = async () => {
    if (!validateForm()) return;

    const telcos = selectedTelcos
      .map((item) => String(item.value).trim().toUpperCase())
      .filter(Boolean);

    try {
      await createBulk.mutateAsync({
        type_id: Number(typeId),
        telcos,
      });

      const typeName =
        typeOptions.find((opt) => Number(opt.value) === Number(typeId))
          ?.label || `ID ${typeId}`;

      await Swal.fire({
        title: "Thêm thành công!",
        text: `Đã thêm ${telcos.length} nhà mạng cho định dạng ${typeName}.`,
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
        name: "type_id",
        label: "Định dạng số",
        type: "select" as const,
        value: typeId,
        onChange: (value: FieldValue) => {
          setTypeId(value === "" ? "" : Number(value));
          setErrors((prev) => ({ ...prev, type_id: "" }));
        },
        options: typeOptions,
        placeholder: "Chọn định dạng số",
        error: errors.type_id,
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
    [
      typeId,
      selectedTelcos,
      typeOptions,
      telcoOptions,
      errors.type_id,
      errors.telcos,
    ],
  );

  return (
    <CustomModal
      errorDetail={error}
      isOpen={isOpen}
      title="Thêm/Thay thế định dạng – nhà mạng"
      description="Sẽ thay thế toàn bộ nhà mạng hiện có cho định dạng số đã chọn."
      disabledAll={createBulk.isPending}
      fields={formFields as Parameters<typeof CustomModal>[0]["fields"]}
      onClose={onClose}
      onSubmit={sendRequest}
      submitText={createBulk.isPending ? "Đang thêm..." : "Thêm"}
    />
  );
};

export default ModalActionTelco;
