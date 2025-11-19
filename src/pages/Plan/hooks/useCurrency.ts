import { useState, useCallback, useEffect } from "react";

export function useCurrencyInput(onChangeValue: (value: number) => void) {
  const [currency, setCurrency] = useState("");

  const handleCurrency = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9]/g, "");

      if (!rawValue) {
        setCurrency("");
        onChangeValue(0);
        return;
      }

      const formatted = new Intl.NumberFormat("vi-VN").format(Number(rawValue));
      setCurrency(formatted);
      onChangeValue(Number(rawValue));
    },
    [onChangeValue]
  );

  return { currency, handleCurrency, setCurrency };
}

export function useMultiCurrencyInput<T extends Record<string, any>>(
  form: T,
  onChangeValue: <K extends keyof T>(field: K, value: T[K]) => void,
  fields: (keyof T)[]
) {
  const [currencyFields, setCurrencyFields] = useState<Record<string, string>>(
    {}
  );

  // format function
  const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat("vi-VN").format(Number(value));

  // handle input change for each field
  const handleCurrencyChange = useCallback(
    <K extends keyof T>(field: K, e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9]/g, ""); // chỉ giữ số

      setCurrencyFields((prev) => ({
        ...prev,
        [field]: rawValue ? formatCurrency(rawValue) : "",
      }));

      onChangeValue(field, Number(rawValue) as T[K]);
    },
    [onChangeValue]
  );

  // auto-format khi form cập nhật từ API
  useEffect(() => {
    const updated: Record<string, string> = {};

    fields.forEach((field) => {
      const value = form[field];

      if (
        value !== null &&
        value !== undefined &&
        (typeof value === "number" || typeof value === "string")
      ) {
        updated[field as string] = formatCurrency(value);
      }
    });

    setCurrencyFields((prev) => ({ ...prev, ...updated }));
  }, [form]);

  return { currencyFields, handleCurrencyChange, setCurrencyFields };
}
