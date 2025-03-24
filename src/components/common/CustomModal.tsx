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
    | "password";
  value: string | number;
  onChange: (value: string | number) => void;
  options?: Option[];
  placeholder?: string;
  defaultValue?: string | number;
  disabled?: boolean;
  error?: string;
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
  const gridCols = fields.length >= 8 ? "grid-cols-2" : "grid-cols-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="relative w-full p-4 overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          {description && (
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {description}
            </p>
          )}
          {errorDetail && (
            <p className="mb-4 text-sm text-red-500 ">
              Cảnh báo lỗi: {errorDetail}
            </p>
          )}
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col">
          <div className="px-2 overflow-y-auto custom-scrollbar">
            <div className={`grid ${gridCols} gap-x-6 gap-y-5`}>
              {fields.map((field) => (
                <div key={field.name}>
                  <Label>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <TextArea
                      value={field.value as string}
                      onChange={(value) => field.onChange(value)}
                      placeholder={field.placeholder}
                      disabled={disabledAll || field.disabled}
                      className={`${
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
                      className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white ${
                        disabledAll || field.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${field.error ? "border-red-500" : ""}`}>
                      {field.placeholder && (
                        <option value="" disabled>
                          {field.placeholder}
                        </option>
                      )}
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type}
                      value={field.value || field.defaultValue || ""}
                      onChange={(e) => {
                        if (field.type === "number") {
                          field.onChange(Number(e.target.value));
                        } else {
                          field.onChange(e.target.value);
                        }
                      }}
                      placeholder={field.placeholder}
                      disabled={disabledAll || field.disabled}
                      className={`${
                        disabledAll || field.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${field.error ? "border-red-500" : ""}`}
                    />
                  )}
                  {/* ✅ Hiển thị lỗi nếu có */}
                  {field.error && (
                    <p className="mt-1 text-sm text-red-500">{field.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            {/* Nút Đóng luôn hiển thị */}
            <Button size="sm" variant="outline" onClick={onClose}>
              Đóng
            </Button>
            {/* ✅ Vô hiệu hóa nút "Lưu" nếu `disabledAll = true` */}
            {showSubmitButton && (
              <Button
                size="sm"
                type="submit"
                onClick={onSubmit}
                disabled={disabledAll}
                className={`${
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
