import type React from "react";
import type { FC } from "react";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: number;
  disabled?: boolean;
  disabledWhite?: boolean;
  success?: boolean;
  error?: string;
  hint?: string;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  onKeyDown,
  className = "",
  min,
  max,
  step,
  disabled = false,
  disabledWhite = false,
  success = false,
  error = false,
  hint,
}) => {
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs 
  placeholder:text-gray-400 dark:placeholder-white 
  focus:outline-hidden focus:ring-3 
  dark:bg-gray-900 dark:text-white/90 ${className}`;

  if (disabledWhite) {
    // ✅ Trường hợp đặc biệt: disable nhưng vẫn trắng sáng
    inputClasses += ` bg-white text-gray-700 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (disabled) {
    // 🩶 Trường hợp disable thông thường: nền xám mờ
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    inputClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="">
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onKeyDown={onKeyDown}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled || disabledWhite}
        className={inputClasses}
      />

      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500"
          }`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
