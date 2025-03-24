import React from "react";

interface PaginationProps {
  limit: number;
  offset: number;
  totalPages: number;
  onPageChange: (limit: number, offset: number) => void;
  onLimitChange: (limit: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  limit,
  offset,
  totalPages,
  onPageChange,
  onLimitChange,
}) => {
  const handleNextPage = () => {
    if (offset < totalPages) {
      onPageChange(limit, offset + 1);
    }
  };

  const handlePrevPage = () => {
    if (offset > 1) {
      onPageChange(limit, offset - 1);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    onLimitChange(newLimit);
    onPageChange(newLimit, 0); // Reset về trang đầu
  };

  // Hiển thị tối đa 5 trang gần vị trí hiện tại
  const getVisiblePages = () => {
    const visiblePages: number[] = [];
    const start = Math.max(1, offset - 2);
    const end = Math.min(totalPages, offset + 2);

    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }

    return visiblePages;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Dropdown cho limit */}
      <div className="flex items-center">
        <select
          value={limit}
          onChange={handleLimitChange}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
          {[5, 10, 20, 50].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <span className="ml-2 text-gray-600">/ page</span>
      </div>

      {/* Navigation */}
      <nav aria-label="Pagination">
        <ul className="flex items-center gap-1">
          {/* Nút Trước */}
          <li>
            <button
              onClick={handlePrevPage}
              disabled={offset <= 1}
              className={`px-3 py-2 border rounded-md ${
                offset <= 1
                  ? "text-gray-400 cursor-not-allowed bg-gray-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}>
              Trước
            </button>
          </li>

          {/* Hiển thị các trang */}
          {getVisiblePages().map((page) => (
            <li key={page}>
              <button
                onClick={() => onPageChange(limit, page)}
                className={`px-3 py-2 border rounded-md ${
                  offset === page
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}>
                {page}
              </button>
            </li>
          ))}

          {/* Nút Sau */}
          <li>
            <button
              onClick={handleNextPage}
              disabled={offset >= totalPages}
              className={`px-3 py-2 border rounded-md ${
                offset >= totalPages
                  ? "text-gray-400 cursor-not-allowed bg-gray-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}>
              Sau
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
