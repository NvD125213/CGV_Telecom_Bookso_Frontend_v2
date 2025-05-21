import React, { useState } from "react";
import Input from "../form/input/InputField";

interface DateValidator {
  validate: (value: string) => string;
}

interface InputDateProps {
  value?: string; // dd/mm/yyyy | mm/yyyy | yyyy
  onChange?: (value: string) => void;
  validator: DateValidator;
  onKeyDown?: (
    event: React.KeyboardEvent<HTMLInputElement>,
    value: string
  ) => void;
}

const formatDate = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  const len = digits.length;

  if (len <= 4) {
    return digits; // yyyy
  } else if (len <= 6) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 6)}`; // mm/yyyy
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`; // dd/mm/yyyy
  }
};

const validateDateFormat = (value: string): boolean => {
  const yearOnly = /^\d{4}$/;
  const monthYear = /^(0[1-9]|1[0-2])\/\d{4}$/;
  const fullDate = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

  if (yearOnly.test(value)) {
    const year = parseInt(value, 10);
    return year >= 1900 && year <= 2099;
  } else if (monthYear.test(value)) {
    const [month, year] = value.split("/").map((part) => parseInt(part, 10));
    return month >= 1 && month <= 12 && year >= 1900 && year <= 2099;
  } else if (fullDate.test(value)) {
    const [day, month, year] = value
      .split("/")
      .map((part) => parseInt(part, 10));
    return (
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12 &&
      year >= 1900 &&
      year <= 2099
    );
  }
  return false;
};

const InputDate: React.FC<InputDateProps> = ({
  value = "",
  onChange,
  validator,
  onKeyDown,
}) => {
  const [inputValue, setInputValue] = useState(formatDate(value));
  const [warning, setWarning] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    const validated = validator.validate(formatted);
    setInputValue(validated);
    setWarning(
      validated && !validateDateFormat(validated)
        ? "Vui lòng nhập đúng định dạng yyyy, mm/yyyy hoặc dd/mm/yyyy"
        : ""
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      let finalValue = inputValue;
      if (!inputValue) {
        // If input is empty, use current date in mm/yyyy format
        const currentDate = new Date();
        finalValue = `${String(currentDate.getMonth() + 1).padStart(
          2,
          "0"
        )}/${currentDate.getFullYear()}`;
        setInputValue(finalValue);
      }

      if (finalValue && !validateDateFormat(finalValue)) {
        setWarning(
          "Vui lòng nhập đúng định dạng yyyy, mm/yyyy hoặc dd/mm/yyyy"
        );
        return;
      }

      setWarning("");
      onChange?.(finalValue);
      onKeyDown?.(e, finalValue);
    }
  };

  return (
    <div>
      <Input
        type="text"
        placeholder="dd/mm/yyyy"
        max={10}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {warning && <div className="text-red-500 text-sm mt-1">{warning}</div>}
    </div>
  );
};

export default InputDate;
