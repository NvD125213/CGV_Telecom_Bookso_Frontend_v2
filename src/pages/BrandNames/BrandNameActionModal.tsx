import { useEffect, useState, useMemo } from "react";
import CustomModal from "../../components/common/CustomModal";
import { IBrandName, newBrandName } from "../../types/brandName";
import Swal from "sweetalert2";
import { buildSaleOptions } from "./customerOptions";
import {
  useCreateBrandName,
  useUpdateBrandName,
  useUpdateBrandNameForSale,
} from "../../hooks/api-hooks/v3/useBrandname";

interface SaleOption {
  label: string;
  value: string;
}

type FieldValue = string | number | boolean | SaleOption[];

interface BrandNameActionModalProps {
  isOpen: boolean;
  data?: IBrandName;
  onClose: () => void;
  onSuccess: () => void;
}

const normalizeSaleNames = (names: string[]) =>
  [...names]
    .map((n) => n.trim())
    .filter(Boolean)
    .sort();

const saleNamesEqual = (a: string[], b: string[]) =>
  JSON.stringify(normalizeSaleNames(a)) ===
  JSON.stringify(normalizeSaleNames(b));

export const BrandNameActionModal: React.FC<BrandNameActionModalProps> = ({
  isOpen,
  data,
  onClose,
  onSuccess,
}) => {
  const [brandName, setBrandName] = useState<IBrandName>(newBrandName);
  const [initialData, setInitialData] = useState<IBrandName | null>(null);
  const [selectedSales, setSelectedSales] = useState<SaleOption[]>([]);
  const [initialSaleNames, setInitialSaleNames] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState("");

  const createBrandName = useCreateBrandName();
  const updateBrandName = useUpdateBrandName();
  const updateBrandNameForSale = useUpdateBrandNameForSale();

  const saleOptions = useMemo(() => buildSaleOptions(), []);
  const isSubmitting =
    createBrandName.isPending ||
    updateBrandName.isPending ||
    updateBrandNameForSale.isPending;

  useEffect(() => {
    if (data) {
      setBrandName({ ...data });
      setInitialData(data);
      const sales = (data.sale_names ?? []).map((name) => ({
        label: name,
        value: name,
      }));
      setSelectedSales(sales);
      setInitialSaleNames(data.sale_names ?? []);
    } else {
      setBrandName(newBrandName);
      setInitialData(null);
      setSelectedSales([]);
      setInitialSaleNames([]);
    }
    setErrors({});
    setError("");
  }, [data, isOpen]);

  const setValue = (
    name: keyof IBrandName,
    value: string | number | boolean,
  ) => {
    setBrandName((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!brandName.name?.trim()) {
      newErrors.name = "Tên định danh không được để trống!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeString = (str: string) => str.trim().replace(/\s+/g, " ");

  const getSaleNames = () =>
    selectedSales.map((item) => String(item.value).trim()).filter(Boolean);

  const isUnchanged = () => {
    if (!brandName.id || !initialData) return false;
    const saleNames = getSaleNames();
    return (
      normalizeString(initialData.name) === normalizeString(brandName.name) &&
      normalizeString(initialData.description ?? "") ===
        normalizeString(brandName.description ?? "") &&
      saleNamesEqual(initialSaleNames, saleNames)
    );
  };

  const formFields = useMemo(
    () => [
      {
        name: "name",
        label: "Tên định danh",
        type: "text" as const,
        value: brandName.name || "",
        onChange: (value: FieldValue) => setValue("name", String(value)),
        placeholder: "Nhập tên định danh",
        error: errors.name,
      },
      {
        name: "sale_names",
        label: "Sale",
        type: "autocomplete" as const,
        value: selectedSales,
        onChange: (value: FieldValue) => {
          if (!Array.isArray(value)) return;
          setSelectedSales(value);
          setErrors((prev) => ({ ...prev, sale_names: "" }));
        },
        options: saleOptions,
        placeholder: "Gõ để tìm sale...",
        error: errors.sale_names,
      },
      {
        name: "description",
        label: "Mô tả",
        type: "textarea" as const,
        value: brandName.description || "",
        onChange: (value: FieldValue) => setValue("description", String(value)),
        placeholder: "Nhập mô tả",
      },
    ],
    [
      brandName.name,
      brandName.description,
      selectedSales,
      saleOptions,
      errors.name,
      errors.sale_names,
    ],
  );

  const sendRequest = async () => {
    if (!validateForm()) return;

    const trimmedName = normalizeString(brandName.name);
    const trimmedDescription = normalizeString(brandName.description ?? "");
    const saleNames = getSaleNames();

    if (isUnchanged()) {
      onClose();
      return;
    }

    try {
      if (!brandName.id) {
        await createBrandName.mutateAsync({
          name: trimmedName,
          description: trimmedDescription,
          sale_names: saleNames,
        });
        await Swal.fire({
          title: "Thêm thành công!",
          text: `Thêm thành công brandname ${trimmedName}!`,
          icon: "success",
        });
      } else {
        const baseChanged =
          normalizeString(initialData!.name) !== trimmedName ||
          normalizeString(initialData!.description ?? "") !==
            trimmedDescription;

        const salesChanged = !saleNamesEqual(initialSaleNames, saleNames);

        if (baseChanged) {
          await updateBrandName.mutateAsync({
            id: brandName.id,
            name: trimmedName,
            description: trimmedDescription,
            is_active: initialData!.is_active,
          });
        }

        if (salesChanged) {
          await updateBrandNameForSale.mutateAsync({
            id: brandName.id,
            data: saleNames,
          });
        }

        await Swal.fire({
          title: "Cập nhật thành công!",
          text: `Cập nhật thành công brandname ${trimmedName}!`,
          icon: "success",
        });
      }
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
      setError(message);
    }
  };

  return (
    <CustomModal
      errorDetail={error}
      isOpen={isOpen}
      title={data ? "Cập nhật brandname" : "Tạo brandname"}
      description="Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập nhật."
      disabledAll={isSubmitting}
      fields={formFields as Parameters<typeof CustomModal>[0]["fields"]}
      onClose={onClose}
      onSubmit={sendRequest}
      submitText={brandName.id ? "Lưu thay đổi" : "Thêm"}
    />
  );
};
