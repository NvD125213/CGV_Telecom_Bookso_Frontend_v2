import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useState, useEffect } from "react";

interface PaginationData {
  page: number;
  size: number;
  total: number;
  pages: number;
}

interface PaginationProps {
  data: PaginationData;
  onChange: (page: number, size: number) => void;
}

// Mock Select component for demo
const Select = ({ options, value, onChange, placeholder }: any) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent bg-white hover:border-gray-300 transition-colors">
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((opt: any) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

export const Pagination = ({ data, onChange }: PaginationProps) => {
  const [currentPage, setCurrentPage] = useState<number>(data.page || 1);
  const [currentSize, setCurrentSize] = useState<number>(data.size || 10);

  useEffect(() => {
    setCurrentPage(data.page || 1);
    setCurrentSize(data.size || 10);
  }, [data.page, data.size]);

  const totalPages = data.pages > 0 ? data.pages : 1;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    onChange(page, currentSize);
  };

  const handleSizeChange = (value: string | number) => {
    const size = Number(value);
    setCurrentSize(size);
    setCurrentPage(1);
    onChange(1, size);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-end gap-3 mt-4">
      {/* Điều khiển phân trang - compact */}
      <div className="flex items-center gap-2">
        {/* Navigation buttons - smaller */}
        <div className="flex items-center gap-0.5">
          {/* Previous page */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded hover:bg-gray-100/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
            title="Trang trước">
            <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
          </button>

          {/* Page numbers - smaller */}
          <div className="flex items-center gap-0.5">
            {getPageNumbers().map((page, index) =>
              typeof page === "number" ? (
                <button
                  key={index}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[28px] h-7 px-2 rounded text-xs transition-all ${
                    currentPage === page
                      ? "bg-blue-500 text-white font-medium shadow-sm"
                      : "text-gray-600 hover:bg-gray-100/50"
                  }`}>
                  {page}
                </button>
              ) : (
                <span key={index} className="px-1 text-xs text-gray-300">
                  {page}
                </span>
              )
            )}
          </div>

          {/* Next page */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded hover:bg-gray-100/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
            title="Trang sau">
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>

        {/* Số items per page - smaller */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs text-gray-500">Hiển thị</span>
          <div className="w-16">
            <Select
              options={[10, 20].map((n) => ({
                label: n.toString(),
                value: n.toString(),
              }))}
              value={String(currentSize)}
              onChange={handleSizeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
