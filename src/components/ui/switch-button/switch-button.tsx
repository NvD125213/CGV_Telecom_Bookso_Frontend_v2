import React from "react";

interface ToggleSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 ${
        value ? "bg-blue-500" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
          value ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
};

export default ToggleSwitch;
