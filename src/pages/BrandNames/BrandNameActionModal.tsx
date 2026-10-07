import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import CustomModal from "../../components/common/CustomModal";
import {
  IBrandName,
  IBrandNameCustomer,
  brandNameCustomersEqual,
  newBrandName,
} from "../../types/brandName";
import Swal from "sweetalert2";
import { buildSaleOptions } from "./customerOptions";
import {
  useCreateBrandName,
  useUpdateBrandName,
  useUpdateBrandNameForSale,
} from "../../hooks/api-hooks/v3/useBrandname";
import { useCustomerList } from "../../hooks/api-hooks/v3/useCustomer";
import { getCustomers } from "../../services/customer";
import { RootState } from "../../store";
import type { ICustomer } from "../../types/customer";
import { parseSubmitApiError } from "../../helper/apiValidationError";

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

const isoToDateTimeLocalValue = (iso?: string) => {
  if (!iso?.trim()) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const dateTimeLocalValueToIso = (value: string) => {
  if (!value.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const isValidIsoDateTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") return false;
  const date = new Date(trimmed);
  return !Number.isNaN(date.getTime());
};

const sanitizeExpiredAtStored = (value?: string) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "-") return "";
  return isValidIsoDateTime(trimmed) ? trimmed : "";
};

const expiredAtForPayload = (value?: string): string | undefined => {
  const sanitized = sanitizeExpiredAtStored(value);
  return sanitized || undefined;
};

const toCustomerOption = (
  customer: ICustomer | IBrandNameCustomer,
): SaleOption => {
  const id = Number("customer_id" in customer ? customer.customer_id : 0);
  const name =
    ("customer_name" in customer ? customer.customer_name : "")?.trim() ||
    `KH #${id}`;
  return {
    label: `${name}`,
    value: String(id),
  };
};

const uniqueCustomerOptions = (
  items: Array<ICustomer | IBrandNameCustomer | SaleOption>,
): SaleOption[] => {
  const map = new Map<string, SaleOption>();
  items.forEach((item) => {
    if ("value" in item && "label" in item) {
      const value = String(item.value);
      if (!value || value === "0") return;
      if (!map.has(value)) map.set(value, { label: item.label, value });
      return;
    }
    const option = toCustomerOption(item);
    if (!option.value || option.value === "0") return;
    if (!map.has(option.value)) map.set(option.value, option);
  });
  return Array.from(map.values());
};

export const BrandNameActionModal: React.FC<BrandNameActionModalProps> = ({
  isOpen,
  data,
  onClose,
  onSuccess,
}) => {
  const user = useSelector((state: RootState) => state.auth?.user);
  const saleUsername = String(user?.sub || "");

  const [brandName, setBrandName] = useState<IBrandName>(newBrandName);
  const [initialData, setInitialData] = useState<IBrandName | null>(null);
  const [selectedSales, setSelectedSales] = useState<SaleOption[]>([]);
  const [initialSaleNames, setInitialSaleNames] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<SaleOption[]>([]);
  const [initialCustomers, setInitialCustomers] = useState<
    IBrandNameCustomer[]
  >([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState("");

  const createBrandName = useCreateBrandName();
  const updateBrandName = useUpdateBrandName();
  const updateBrandNameForSale = useUpdateBrandNameForSale();

  const customerListParams = useMemo(
    () => ({
      sale: user?.role === 1 ? undefined : saleUsername || undefined,
    }),
    [user?.role, saleUsername],
  );

  const { data: customerData } = useCustomerList(customerListParams, {
    enabled: isOpen,
  });

  const saleOptions = useMemo(() => buildSaleOptions(), []);
  const customerOptions = useMemo(
    () =>
      uniqueCustomerOptions([
        ...(customerData?.items ?? []),
        ...selectedCustomers,
        ...(data?.customers ?? []),
      ]),
    [customerData?.items, selectedCustomers, data?.customers],
  );

  const isSubmitting =
    createBrandName.isPending ||
    updateBrandName.isPending ||
    updateBrandNameForSale.isPending;

  useEffect(() => {
    if (data) {
      setBrandName({
        ...data,
        customers: data.customers ?? [],
        expired_at: sanitizeExpiredAtStored(data.expired_at),
      });
      setInitialData(data);
      const sales = (data.sale_names ?? []).map((name) => ({
        label: name,
        value: name,
      }));
      setSelectedSales(sales);
      setInitialSaleNames(data.sale_names ?? []);
      const customers = uniqueCustomerOptions(data.customers ?? []);
      setSelectedCustomers(customers);
      setInitialCustomers(data.customers ?? []);
    } else {
      setBrandName(newBrandName);
      setInitialData(null);
      setSelectedSales([]);
      setInitialSaleNames([]);
      setSelectedCustomers([]);
      setInitialCustomers([]);
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

    const expiredRaw = brandName.expired_at?.trim();
    if (expiredRaw && !isValidIsoDateTime(expiredRaw)) {
      newErrors.expired_at =
        "Ngày hết hạn không hợp lệ. Vui lòng chọn đầy đủ ngày và giờ.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeString = (str: string) => str.trim().replace(/\s+/g, " ");

  const getSaleNames = () =>
    selectedSales.map((item) => String(item.value).trim()).filter(Boolean);

  const getCustomersPayload = (): IBrandNameCustomer[] =>
    selectedCustomers
      .map((item) => {
        const customerId = Number(item.value);
        if (!customerId) return null;
        const nameFromLabel = String(item.label || "")
          .replace(/\s*\(#\d+\)\s*$/, "")
          .trim();
        return {
          customer_id: customerId,
          customer_name: nameFromLabel || `KH #${customerId}`,
        };
      })
      .filter((item): item is IBrandNameCustomer => Boolean(item));

  const isUnchanged = () => {
    if (!brandName.id || !initialData) return false;
    const saleNames = getSaleNames();
    const customers = getCustomersPayload();
    return (
      normalizeString(initialData.name) === normalizeString(brandName.name) &&
      normalizeString(initialData.description ?? "") ===
        normalizeString(brandName.description ?? "") &&
      (initialData.expired_at ?? "") === (brandName.expired_at ?? "") &&
      saleNamesEqual(initialSaleNames, saleNames) &&
      brandNameCustomersEqual(initialCustomers, customers)
    );
  };

  const fetchCustomerOptions = useCallback(
    async (query: string) => {
      const result = await getCustomers({
        ...customerListParams,
        q: query.trim() || undefined,
      });
      return uniqueCustomerOptions(result.items ?? []);
    },
    [customerListParams],
  );

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
        name: "customers",
        label: "Khách hàng",
        type: "autocomplete" as const,
        value: selectedCustomers,
        onChange: (value: FieldValue) => {
          if (!Array.isArray(value)) return;
          setSelectedCustomers(uniqueCustomerOptions(value));
          setErrors((prev) => ({ ...prev, customers: "" }));
        },
        options: customerOptions,
        fetchOptions: fetchCustomerOptions,
        placeholder: "Gõ để tìm khách hàng...",
        error: errors.customers,
      },
      {
        name: "description",
        label: "Mô tả",
        type: "textarea" as const,
        value: brandName.description || "",
        onChange: (value: FieldValue) => setValue("description", String(value)),
        placeholder: "Nhập mô tả",
      },
      {
        name: "expired_at",
        label: "Ngày hết hạn",
        type: "datetime-local" as const,
        value: isoToDateTimeLocalValue(brandName.expired_at),
        onChange: (value: FieldValue) =>
          setValue("expired_at", dateTimeLocalValueToIso(String(value ?? ""))),
        error: errors.expired_at,
      },
    ],
    [
      brandName.name,
      brandName.description,
      brandName.expired_at,
      selectedSales,
      selectedCustomers,
      saleOptions,
      customerOptions,
      fetchCustomerOptions,
      errors.name,
      errors.sale_names,
      errors.customers,
      errors.expired_at,
    ],
  );

  const sendRequest = async () => {
    if (!validateForm()) return;

    const trimmedName = normalizeString(brandName.name);
    const trimmedDescription = normalizeString(brandName.description ?? "");
    const saleNames = getSaleNames();
    const customers = getCustomersPayload();
    const expiredAt = expiredAtForPayload(brandName.expired_at);

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
          customers,
          expired_at: expiredAt,
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
            trimmedDescription ||
          (initialData!.expired_at ?? "") !== (brandName.expired_at ?? "");

        const salesChanged = !saleNamesEqual(initialSaleNames, saleNames);
        const customersChanged = !brandNameCustomersEqual(
          initialCustomers,
          customers,
        );

        if (baseChanged || customersChanged) {
          await updateBrandName.mutateAsync({
            id: brandName.id,
            name: trimmedName,
            description: trimmedDescription,
            is_active: initialData!.is_active,
            expired_at: expiredAt,
            customers,
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
      const { fieldErrors, message } = parseSubmitApiError(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
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
      singleColumn
      fields={formFields as Parameters<typeof CustomModal>[0]["fields"]}
      onClose={onClose}
      onSubmit={sendRequest}
      submitText={brandName.id ? "Lưu thay đổi" : "Thêm"}
    />
  );
};
