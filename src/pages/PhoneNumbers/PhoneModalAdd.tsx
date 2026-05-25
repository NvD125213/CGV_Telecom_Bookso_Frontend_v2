import { useState, useEffect, useMemo, useCallback } from "react";
import { IPhoneNumber, IProvider, ITypeNumber } from "../../types";
import CustomModal from "../../components/common/CustomModal";
import {
  initialPhoneNumber,
  createPhoneNumber,
} from "../../services/phoneNumber";
import Swal from "sweetalert2";
import { getProviders } from "../../services/provider";
import { getTypeNumber } from "../../services/typeNumber";
import useSelectData from "../../hooks/useSelectData";
import { validatePhoneNumber } from "../../validate/phoneNumber";
import { formatNumber, parseNumber } from "../../helper/formatCurrencyVND";
import { useBrandNameList } from "../../hooks/api-hooks/v3/useBrandname";
import { getBrandName } from "../../services/brandName";
import type { Option } from "../../components/ui/autocomplete/auto-complete";

interface PhoneNumberProps {
  isOpen: boolean;
  onCloseModal: () => void;
  onSuccess: () => void;
}

const PhoneNumberModal: React.FC<PhoneNumberProps> = ({
  isOpen,
  onCloseModal,
  onSuccess,
}) => {
  const [phone, setPhone] = useState<IPhoneNumber>(initialPhoneNumber);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IPhoneNumber, string>>
  >({});
  const [errorDetail, setErrorDetail] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<Option[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setErrorDetail("");
      setPhone(initialPhoneNumber);
      setSelectedBrand([]);
    }
  }, [isOpen]);
  const setValue = (name: keyof IPhoneNumber, value: string | number) => {
    let finalValue: string | number = value;
    if (
      ["installation_fee", "maintenance_fee", "vanity_number_fee"].includes(
        name,
      )
    ) {
      const stringValue = value.toString().replace(/\./g, "");
      if (/[^0-9]/.test(stringValue)) {
        alert("Không được nhập chữ trong phần giá");
        return;
      }
      finalValue = parseNumber(value.toString());
    }

    setPhone((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const { data: providers } = useSelectData<IProvider>({
    service: getProviders,
  });

  const { data: typeNumbers } = useSelectData<ITypeNumber>({
    service: getTypeNumber,
  });

  const { data: brandNameListData } = useBrandNameList(
    { page: 1, size: 20, is_active: true },
    { enabled: isOpen },
  );

  const brandOptions = useMemo(
    () =>
      (brandNameListData?.items ?? []).map((brand) => ({
        label: brand.name,
        value: String(brand.id),
      })),
    [brandNameListData],
  );

  const fetchBrandOptions = useCallback(async (query: string) => {
    const result = await getBrandName({
      page: 1,
      size: 20,
      is_active: true,
      search: query.trim() || undefined,
      order_by: "created_at",
      order_dir: "desc",
    });
    return result.items.map((brand) => ({
      label: brand.name,
      value: String(brand.id),
    }));
  }, []);

  const handleSubmit = async (data: IPhoneNumber) => {
    const validationErrors = validatePhoneNumber(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const providerId = Number(data.provider_id);
    const typeNumberId = Number(data.type_id);

    const payload = {
      phone_number: data.phone_number,
      provider_id: providerId,
      type_id: typeNumberId,
      type_number_id: typeNumberId,
      installation_fee: data.installation_fee,
      maintenance_fee: data.maintenance_fee,
      vanity_number_fee: data.vanity_number_fee,
      ...(data.brandname_id != null
        ? { brandname_id: Number(data.brandname_id) }
        : {}),
    };

    try {
      const res = await createPhoneNumber(payload as IPhoneNumber);
      if (res.status === 200) {
        Swal.fire({
          title: "Thêm thành công!",
          icon: "success",
        });
        setPhone(initialPhoneNumber);
        setErrors({});
        setErrorDetail("");
        onCloseModal();
        onSuccess();
      }
    } catch (error: any) {
      setErrorDetail(error.response?.data?.detail);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      title={"Tạo số điện thoại mới"}
      description="Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập nhật."
      errorDetail={errorDetail}
      fields={[
        {
          name: "phone_number",
          label: "Số điện thoại",
          placeholder: "Nhập số điện thoại",
          type: "text",
          value: phone.phone_number,
          onChange: (value) => setValue("phone_number", value as any),
          error: errors.phone_number,
        },
        {
          name: "provider_id",
          label: "Nhà cung cấp",
          type: "select",
          value: phone.provider_id || "",
          options: [
            { label: "Chọn nhà cung cấp", value: "", key: "default" },
            ...providers.map((provider) => ({
              label: `${provider.name}`,
              value: provider.id,
              key: provider.id,
            })),
          ],
          onChange: (value) => {
            const id = value === "" || value == null ? "" : Number(value);
            setPhone((prev) => ({
              ...prev,
              provider_id: id,
            }));
            setErrors((prev) => ({ ...prev, provider_id: undefined }));
          },
          error: errors.provider_id,
        },
        {
          name: "type_id",
          label: "Loại số",
          type: "select",
          value: phone.type_id || "",
          options: [
            { label: "Chọn loại số", value: "", key: "default" },
            ...typeNumbers.map((type) => ({
              label: type.name,
              value: type.id,
              key: type.id,
            })),
          ],
          onChange: (value) => {
            const id = value === "" || value == null ? "" : Number(value);
            setPhone((prev) => ({
              ...prev,
              type_id: id,
              type_number_id: id,
            }));
            setErrors((prev) => ({ ...prev, type_id: undefined }));
          },
          error: errors.type_id,
        },
        {
          name: "brandname_id",
          label: "Định danh",
          type: "autocomplete",
          value: selectedBrand,
          options: brandOptions,
          fetchOptions: fetchBrandOptions,
          placeholder: "Gõ để tìm...",
          onChange: (value) => {
            const options = Array.isArray(value) ? value : [];
            const single =
              options.length > 1 ? [options[options.length - 1]] : options;
            setSelectedBrand(single as any);
            if (single.length === 0) {
              setPhone((prev) => ({ ...prev, brandname_id: undefined }));
              setErrors((prev) => ({ ...prev, brandname_id: undefined }));
              return;
            }
            setValue("brandname_id", Number(single[0].value));
          },
          error: errors.brandname_id,
        },
        {
          name: "installation_fee",
          label: "Phí yêu cầu",
          type: "text", // Đổi sang text
          value: formatNumber(phone.installation_fee?.toString() || "0"), // Giá trị định dạng
          onChange: (value) => setValue("installation_fee", value as any),
          error: errors.installation_fee,
        },
        {
          name: "maintenance_fee",
          label: "Phí duy trì",
          type: "text", // Đổi sang text
          value: formatNumber(phone.maintenance_fee?.toString() || "0"), // Giá trị định dạng
          onChange: (value) => setValue("maintenance_fee", value as any),
          error: errors.maintenance_fee,
        },
        {
          name: "vanity_number_fee",
          label: "Phí số đẹp",
          type: "text", // Đổi sang text
          value: formatNumber(phone.vanity_number_fee?.toString() || "0"), // Giá trị định dạng
          onChange: (value) => setValue("vanity_number_fee", value as any),
          error: errors.vanity_number_fee,
        },
      ]}
      onClose={onCloseModal}
      onSubmit={() => handleSubmit(phone)}
      submitText={"Lưu"}
    />
  );
};

export default PhoneNumberModal;
