import { useState } from "react";
import { formatNumber, parseNumber } from "../../../helper/formatCurrencyVND";
import Input from "./InputField";

type NumberInputProps = {
  value?: string;
  onChange?: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  success?: boolean;
  error?: string;
  hint?: string;
};

const NumberInput = ({
  value = "",
  onChange,
  placeholder,
  disabled = false,
  success = false,
  error,
  hint,
}: NumberInputProps) => {
  const [inputValue, setInputValue] = useState<string>(formatNumber(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumber(e.target.value);
    setInputValue(formattedValue);
    if (onChange) {
      onChange(parseNumber(formattedValue));
    }
  };

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      success={success}
      error={error}
      hint={hint}
      className="border rounded px-2 py-1"
    />
  );
};

export default NumberInput;
