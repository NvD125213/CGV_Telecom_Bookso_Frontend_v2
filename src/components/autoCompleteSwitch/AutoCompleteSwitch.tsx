import { useState, useEffect } from "react";
import AutocompleteMultiple, { Option } from "../ui/autocomplete/auto-complete";
import Label from "../form/Label";

interface SwitchWithAutocompleteProps {
  label: string;
  options: Option[];
  placeholder?: string;
  defaultEnabled?: boolean;
  defaultSelected?: Option[];
  value?: string[]; // ✅ thêm prop controlled value
  enabled?: boolean; // ✅ thêm prop controlled enabled
  onChange?: (value: Option[]) => void;
  onToggle?: (enabled: boolean) => void;
}

export default function SwitchWithAutocomplete({
  label,
  options,
  placeholder = "Chọn mục...",
  defaultEnabled = false,
  defaultSelected = [],
  value,
  enabled,
  onChange,
  onToggle,
}: SwitchWithAutocompleteProps) {
  // State nội bộ
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);
  const [selected, setSelected] = useState<Option[]>(defaultSelected);

  useEffect(() => {
    if (enabled !== undefined) {
      setIsEnabled(enabled);
    }
  }, [enabled]);

  useEffect(() => {
    if (value && Array.isArray(value)) {
      // Convert string[] → Option[]
      const mapped = value.map((v) => ({ label: v, value: v }));
      setSelected(mapped);
    }
  }, [value]);

  // Khi đổi switch
  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    onToggle?.(checked);
  };

  // Khi đổi lựa chọn autocomplete
  const handleSelectChange = (value: Option[]) => {
    setSelected(value);
    onChange?.(value);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-gray-700 font-medium">{label}</Label>

        <div className="flex items-center gap-3 mb-1.5">
          <span
            className={`text-sm font-medium transition-colors duration-300 ${
              isEnabled ? "text-green-600" : "text-indigo-600"
            }`}>
            {isEnabled
              ? '(+) Bạn đang để chế độ "Công khai"'
              : '(-) Bạn đang để chế độ "Cá nhân"'}
          </span>
        </div>
      </div>

      <div
        className={`flex items-center gap-3 transition-all duration-300 ease-in-out`}>
        <label
          htmlFor={`toggle-${label}`}
          className="relative inline-flex shrink-0 items-center cursor-pointer">
          <input
            id={`toggle-${label}`}
            type="checkbox"
            className="sr-only peer"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <div
            className={`w-12 h-6 rounded-full transition-colors duration-300 ${
              isEnabled ? "bg-green-600" : "bg-indigo-600"
            }`}></div>
          <div
            className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
              isEnabled ? "translate-x-6" : "translate-x-0"
            }`}></div>
        </label>

        <AutocompleteMultiple
          options={options}
          value={selected}
          onChange={handleSelectChange}
          placeholder={placeholder}
          freeSolo
          className="mt-1 min-w-0 flex-1"
        />
      </div>
    </div>
  );
}
