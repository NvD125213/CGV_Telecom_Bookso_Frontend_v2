import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/input/TextArea";

interface Option {
  label: string;
  value: string;
}

interface Field {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "date"
    | "email"
    | "fee"
    | "password";

  value: string | number;
  onChange: (value: string | number) => void;
  options?: Option[];
  placeholder?: string;
  defaultValue?: string | number;
  disabled?: boolean;
  error?: string;
  selected?: string;
}

interface CustomModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  fields: Field[];
  onClose: () => void;
  onSubmit?: () => void;
  submitText?: string;
  showSubmitButton?: boolean;
  disabledAll?: boolean;
  errorDetail?: string;
  isLoading?: false;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  title,
  description,
  fields,
  onClose,
  onSubmit,
  submitText = "Submit",
  showSubmitButton = true,
  disabledAll = false,
  errorDetail,
}) => {
  // Responsive grid columns dựa trên số lượng fields và kích thước màn hình
  const getGridCols = () => {
    if (fields.length <= 2) {
      return "grid-cols-1";
    } else if (fields.length <= 4) {
      return "grid-cols-1 sm:grid-cols-2";
    } else if (fields.length <= 6) {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    } else {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    }
  };

  // Kiểm tra xem có cần scroll không
  const needsScroll = fields.length > 6;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-[95%] max-w-[800px] mx-auto my-2 sm:my-4 lg:my-8 overflow-hidden z-999">
      <div className="relative w-full bg-white rounded-xl sm:rounded-2xl dark:bg-gray-900 max-h-[95vh] flex flex-col">
        {/* Header Section - Fixed */}
        <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 xl:p-8 border-b border-gray-200 dark:border-gray-700">
          <h4 className="mb-1 sm:mb-2 text-[15px] sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white/90 leading-tight">
            {title}
          </h4>
          {description && (
            <p className="mb-2 sm:mb-3 text-[13px] sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
          {errorDetail && (
            <p className="mb-2 text-xs sm:text-sm text-red-500">
              Cảnh báo lỗi: {errorDetail}
            </p>
          )}
        </div>

        {/* Form Section - Scrollable */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col flex-1 min-h-0">
          <div
            className={`flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 ${
              needsScroll ? "overflow-y-auto" : ""
            }`}>
            <div
              className={`grid ${getGridCols()} gap-2 sm:gap-3 lg:gap-4 gap-y-2 sm:gap-y-3 lg:gap-y-4`}>
              {fields.map((field) => (
                <div key={field.name} className="w-full">
                  <Label className="text-xs sm:text-sm lg:text-base mb-1 sm:mb-2 block font-medium">
                    {field.label}
                  </Label>
                  {field.type === "textarea" ? (
                    <TextArea
                      value={field.value as string}
                      onChange={(value) => field.onChange(value)}
                      placeholder={field.placeholder}
                      disabled={disabledAll || field.disabled}
                      size="sm"
                      className={`w-full text-xs sm:text-sm ${
                        disabledAll || field.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${field.error ? "border-red-500" : ""}`}
                    />
                  ) : field.type === "select" && field.options ? (
                    <select
                      value={field.value || field.defaultValue}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={disabledAll || field.disabled}
                      className={`w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-lg dark:bg-gray-800 dark:text-white ${
                        disabledAll || field.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${field.error ? "border-red-500" : ""}`}>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type}
                      value={
                        field.value !== undefined && field.value !== null
                          ? field.value
                          : ""
                      }
                      min="0"
                      onChange={(e) => {
                        if (field.type === "number") {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                        } else {
                          field.onChange(e.target.value);
                        }
                      }}
                      placeholder={field.placeholder}
                      disabled={disabledAll || field.disabled}
                      className={`w-full text-xs sm:text-sm ${
                        disabledAll || field.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${field.error ? "border-red-500" : ""}`}
                    />
                  )}
                  {/* ✅ Hiển thị lỗi nếu có */}
                  {field.error && (
                    <p className="mt-1 text-xs text-red-500">{field.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Section - Fixed */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-6 xl:p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {/* Nút Đóng luôn hiển thị */}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1 text-xs sm:text-sm">
              Đóng
            </Button>
            {/* ✅ Vô hiệu hóa nút "Lưu" nếu `disabledAll = true` */}
            {showSubmitButton && (
              <Button
                size="sm"
                type="submit"
                onClick={onSubmit}
                disabled={disabledAll}
                className={`w-full sm:w-auto order-1 sm:order-2 text-xs sm:text-sm ${
                  disabledAll ? "opacity-50 cursor-not-allowed" : ""
                }`}>
                {submitText}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CustomModal;
