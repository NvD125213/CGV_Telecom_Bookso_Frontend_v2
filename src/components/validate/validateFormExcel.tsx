import { useState, useEffect } from "react";

interface ErrorDetail {
  row: number;
  errors: string[];
}

interface ApiResponse {
  detail: string;
}

const ErrorDisplay = ({ detail }: ApiResponse) => {
  const [data, setData] = useState<ErrorDetail[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    try {
      const parsed = JSON.parse(detail.split("400: ")[1]);
      setMessage(parsed.message);
      setData(parsed.errors);
    } catch (error) {
      console.error("Failed to parse error detail:", error);
    }
  }, [detail]);

  return (
    <div className="p-4">
      {message && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 border border-red-400 rounded">
          {message}
        </div>
      )}

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
              Cột
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
              Lỗi
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.row} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{item.row}</td>
              <td className="border border-gray-300 px-4 py-2">
                {item.errors.join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ErrorDisplay;
