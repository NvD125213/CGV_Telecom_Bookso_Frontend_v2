import { useState } from "react";
import { IProvider, ITypeNumber } from "../../types";
import CustomModal from "../../components/common/CustomModal";
import Swal from "sweetalert2";
import { getProviders } from "../../services/provider";
import { getTypeNumber } from "../../services/typeNumber";
import useSelectData from "../../hooks/useSelectData";
import { validateRandomPhone } from "../../validate/phoneNumber";
import { getRandomNumber } from "../../services/phoneNumber";
import { copyToClipBoard } from "../../helper/copyToClipboard";
import Spinner from "../../components/common/LoadingSpinner";
export interface IBookRandom {
  quantity: number;
  provider_id: number;
  type_id: number;
}

const initialBookRandom: IBookRandom = {
  quantity: 1,
  provider_id: 0,
  type_id: 0,
};

interface PhoneNumberProps {
  isOpen: boolean;
  onCloseModal: () => void;
  onSuccess: () => void;
}

const PhoneRandomModal: React.FC<PhoneNumberProps> = ({
  isOpen,
  onCloseModal,
  onSuccess,
}) => {
  const [listNumber, setListNumber] = useState<IBookRandom>(initialBookRandom);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IBookRandom, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const setValue = (name: keyof IBookRandom, value: string | number) => {
    setListNumber((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const { data: providers } = useSelectData<IProvider>({
    service: getProviders,
  });

  const { data: typeNumbers } = useSelectData<ITypeNumber>({
    service: getTypeNumber,
  });

  const handleSubmit = async (data: IBookRandom) => {
    const validationErrors = validateRandomPhone(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await getRandomNumber({
        type_number_id: data.type_id,
        provider_id: data.provider_id,
        quantity_book: data.quantity,
      });
      if (res.status === 200) {
        if (!res.data || res.data.length === 0) {
          Swal.fire({
            title: "Không có đủ số để book!",
            icon: "warning",
            confirmButtonText: "Đóng",
          });
          setLoading(false);
          onCloseModal();
          return;
        }

        onCloseModal();
        onSuccess();
        Swal.fire({
          title: "Book ngẫu nhiên thành công!",
          html: `
            <label for="message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Danh sách số đã book:
            </label>
            <textarea id="message" rows="4" class="block max-h-[200px] w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 px-[10px]">${res.data.join(
              ", "
            )}</textarea>
          `,
          showDenyButton: true,
          icon: "success",
          confirmButtonText: "Sao chép",
          denyButtonText: "Bỏ qua",
          allowOutsideClick: false,
        }).then((result) => {
          if (result.isConfirmed) {
            copyToClipBoard(res.data);
            Swal.fire("Sao chép thành công!", "", "success");
          }
        });
      }
    } catch (error: any) {
      onCloseModal();
      setErrors(error.response?.data?.detail);
      if (
        error.response?.data?.detail ===
        "You have reached your daily booking limit. Please contact your administrator to increase your limit if needed."
      ) {
        Swal.fire(
          "Opps!",
          `Bạn đã vượt quá số lượng book cho phép trong ngày! Vui lòng liên hệ admin để được cấp phép thêm.`,
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <CustomModal
          isOpen={isOpen}
          title={"Book ngẫu nhiên số điện thoại"}
          description="Lựa chọn danh sách số phù hợp với yêu cầu book của bạn "
          //   errorDetail={errorDetail}
          fields={[
            {
              name: "quantity",
              label: "Nhập số lượng",
              type: "text",
              value: listNumber.quantity,
              onChange: (value) => setValue("quantity", value),
              error: errors.quantity,
            },
            {
              name: "provider_id",
              label: "Nhà cung cấp",
              type: "select",
              value: listNumber.provider_id,
              options: [
                { label: "Chọn nhà cung cấp", value: "0", key: "default" },
                ...providers.map((provider) => ({
                  label: `${provider.name}`,
                  value: provider.id,
                  key: provider.id,
                })),
              ],
              onChange: (value) => setValue("provider_id", value),
              error: errors.provider_id,
            },
            {
              name: "type_id",
              label: "Loại số",
              type: "select",
              value: listNumber.type_id,
              options: [
                { label: "Chọn loại số", value: "", key: "default" },
                ...typeNumbers.map((type) => ({
                  label: `${type.name}`,
                  value: type.id,
                  key: type.id,
                })),
              ],
              onChange: (value) => setValue("type_id", value),
              error: errors.type_id,
            },
          ]}
          onClose={onCloseModal}
          onSubmit={() => handleSubmit(listNumber)}
          submitText={"Lưu"}
        />
      )}
    </>
  );
};

export default PhoneRandomModal;
