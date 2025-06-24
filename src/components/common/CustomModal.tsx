import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/input/TextArea";
import { useState, useRef, useEffect } from "react";
import { useScreenSize } from "../../hooks/useScreenSize";

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

// Enhanced Select Component với dropdown tràn ra ngoài
const EnhancedSelect: React.FC<{
  field: Field;
  disabled: boolean;
}> = ({ field, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
    "bottom"
  );
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions =
    field.options?.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const selectedOption = field.options?.find(
    (opt) => opt.value === field.value
  );

  // Tính toán vị trí dropdown khi mở
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 300; // Ước tính chiều cao dropdown

      // Nếu không đủ chỗ phía dưới và phía trên có nhiều chỗ hơn
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={selectRef}>
      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm 
          border rounded-lg text-left flex items-center justify-between
          transition-all duration-200 ease-in-out
          ${
            disabled
              ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
              : "hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
          }
          ${
            field.error
              ? "border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-800"
              : "border-gray-300 dark:border-gray-600"
          }
          ${
            isOpen
              ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
              : ""
          }
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
        `}>
        <span
          className={
            selectedOption
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400"
          }>
          {selectedOption
            ? selectedOption.label
            : field.placeholder || "Chọn một tùy chọn..."}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu - Sử dụng portal để tràn ra ngoài */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Options Container với z-index cao hơn */}
          <div
            ref={dropdownRef}
            className={`
              fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-300 
              dark:border-gray-600 rounded-lg shadow-xl
              ${dropdownPosition === "top" ? "mb-1" : "mt-1"}
            `}
            style={{
              left: selectRef.current?.getBoundingClientRect().left + "px",
              width: selectRef.current?.getBoundingClientRect().width + "px",
              ...(dropdownPosition === "top"
                ? {
                    bottom:
                      window.innerHeight -
                      (selectRef.current?.getBoundingClientRect().top || 0) +
                      "px",
                  }
                : {
                    top:
                      (selectRef.current?.getBoundingClientRect().bottom || 0) +
                      "px",
                  }),
              maxHeight: "300px",
            }}>
            {/* Search Input (if more than 5 options) */}
            {(field.options?.length || 0) > 5 && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      field.onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`
                      w-full px-3 py-2 text-left text-xs sm:text-sm
                      transition-colors duration-150 ease-in-out
                      ${
                        option.value === field.value
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                      }
                    `}>
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.value === field.value && (
                        <svg
                          className="w-4 h-4 text-blue-600 dark:text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Không tìm thấy kết quả
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

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
  // Kiểm tra xem có cần scroll không
  const needsScroll = fields.length > 6;
  const { isMobile } = useScreenSize();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-[95%] max-w-[800px] mx-auto my-2 sm:my-4 lg:my-8 z-[9990]">
      <div className="relative w-full bg-white rounded-xl sm:rounded-2xl dark:bg-gray-900 max-h-[95vh] flex flex-col">
        {/* Header Section - Fixed */}
        <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 xl:p-8 border-b border-gray-200 dark:border-gray-700">
          <h4 className="px-3 py-2 text-[16px] sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white/90 leading-tight">
            {title}
          </h4>
          {description && !isMobile && (
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

        {/* Form Section - Scrollable, bỏ overflow-hidden để dropdown có thể tràn */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col flex-1 min-h-0">
          <div
            className={`flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 ${
              needsScroll
                ? "overflow-y-auto overflow-x-visible"
                : "overflow-visible"
            }`}>
            <div
              className={`grid ${
                fields.length > 4 ? "grid-cols-2" : "grid-cols-1"
              } gap-2 sm:gap-3 lg:gap-4`}>
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
                    <EnhancedSelect
                      field={field}
                      disabled={disabledAll || Boolean(field.disabled)}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={field.value ?? ""}
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

                  {field.error && (
                    <p className="mt-1 text-xs text-red-500">{field.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-6 xl:p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1 text-xs sm:text-sm">
              Đóng
            </Button>

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
