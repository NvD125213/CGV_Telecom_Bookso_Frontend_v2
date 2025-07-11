import React from "react";

interface TextareaProps {
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows
  value?: string; // Current value
  onChange?: (value: string) => void; // Change handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
  error?: boolean; // Error state
  hint?: string; // Hint text to display
  size?: "sm" | "md" | "lg"; // Size variant
}

const TextArea: React.FC<TextareaProps> = ({
  placeholder = "Enter your message", // Default placeholder
  rows = 3, // Default number of rows
  value = "", // Default value
  onChange, // Callback for changes
  className = "", // Additional custom styles
  disabled = false, // Disabled state
  error = false, // Error state
  hint = "", // Default hint text
  size = "md", // Default size
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // Responsive size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-2 py-1.5 text-xs min-h-[60px] max-h-[100px] sm:min-h-[80px] sm:max-h-[120px]";
      case "md":
        return "px-3 py-2 text-sm min-h-[80px] max-h-[120px] sm:min-h-[100px] sm:max-h-[150px]";
      case "lg":
        return "px-4 py-2.5 text-sm min-h-[100px] max-h-[150px] sm:min-h-[120px] sm:max-h-[180px]";
      default:
        return "px-3 py-2 text-sm min-h-[80px] max-h-[120px] sm:min-h-[100px] sm:max-h-[150px]";
    }
  };

  let textareaClasses = `w-full rounded-lg border shadow-theme-xs focus:outline-hidden resize-none ${getSizeClasses()} ${className} `;

  if (disabled) {
    textareaClasses += ` bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    textareaClasses += ` bg-transparent border-gray-300 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-error-800`;
  } else {
    textareaClasses += ` bg-transparent text-gray-900 dark:text-gray-300 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p
          className={`mt-1 sm:mt-2 text-xs sm:text-sm ${
            error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
          }`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
