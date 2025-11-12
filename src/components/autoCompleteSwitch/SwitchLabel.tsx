import { useState } from "react";

export default function StatusSwitch() {
  const [checked, setChecked] = useState(true);

  return (
    <div className="flex items-center gap-3">
      {/* Switch */}
      <button
        onClick={() => setChecked(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
          checked ? "bg-indigo-600" : "bg-green-500"
        }`}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>

      {/* Label */}
      <span
        className={`text-sm font-medium ${
          checked ? "text-indigo-600" : "text-gray-500"
        }`}>
        {checked ? "Xác nhận triển khai" : "Trạng thái chờ"}
      </span>
    </div>
  );
}
