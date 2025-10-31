import { useState, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  disabledWhite?: boolean; // ✅ thêm prop mới
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
  disabledWhite = false, // ✅ default false
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(
    value || defaultValue
  );

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedValue(newValue);
    onChange(newValue);
  };

  // ✅ Base class
  let selectClasses = `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs 
  placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 
  dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${className}`;

  // ✅ Tùy theo trạng thái
  if (disabledWhite) {
    selectClasses += ` bg-white text-gray-700 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (disabled) {
    selectClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (selectedValue) {
    selectClasses += ` text-gray-800 dark:text-white/90 bg-transparent border-gray-300`;
  } else {
    selectClasses += ` text-gray-400 dark:text-gray-400 bg-transparent border-gray-300`;
  }

  return (
    <select
      className={selectClasses}
      value={selectedValue}
      onChange={handleChange}
      disabled={disabled || disabledWhite} // ✅ disable cả hai
    >
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
        {placeholder}
      </option>
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
