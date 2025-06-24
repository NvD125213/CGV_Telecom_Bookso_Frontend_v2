import React from "react";

interface PaginationProps {
  limit: number;
  offset: number;
  totalPages: number;
  totalResults?: number;
  paginationMode?: "page" | "total";
  onPageChange: (limit: number, offset: number) => void;
  onLimitChange: (limit: number) => void;
  showLimitSelector?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  limit,
  offset,
  totalPages,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
}) => {
  // Với yêu cầu offset = 0, 1, 2..., currentPage = offset + 1
  const currentPage = offset + 1;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(limit, offset + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(limit, offset - 1);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    onLimitChange(newLimit);
    onPageChange(newLimit, 0); // Reset về offset 0 khi đổi limit
  };

  const handlePageChange = (page: number) => {
    // Với yêu cầu này, offset = page - 1
    const newOffset = page - 1;
    onPageChange(limit, newOffset);
  };

  const getVisiblePages = () => {
    const visiblePages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }
    return visiblePages;
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4`}>
      {showLimitSelector && (
        <div className="flex items-center">
          <select
            value={limit}
            onChange={handleLimitChange}
            className="border dark:text-gray-300 border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            {[10, 20, 50, 100].map((value) => (
              <option
                className="dark:bg-black dark:text-white "
                key={value}
                value={value}>
                {value}
              </option>
            ))}
          </select>
          <span className="ml-2 text-gray-600 dark:text-white">/ page</span>
        </div>
      )}

      <nav
        aria-label="Pagination"
        className={!showLimitSelector ? "w-full" : ""}>
        <ul
          className={`flex items-center gap-1 ${
            !showLimitSelector ? "justify-end" : "justify-center"
          }`}>
          <li>
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className={`px-3 py-2 border rounded-md dark:bg-black dark:text-white ${
                currentPage <= 1
                  ? "text-gray-400 cursor-not-allowed bg-gray-100 "
                  : "text-gray-700 hover:bg-gray-100"
              }`}>
              Trước
            </button>
          </li>

          {/* Always show page numbers, regardless of pagination mode */}
          {getVisiblePages().map((page) => (
            <li key={page}>
              <button
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 border rounded-md  ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-300 dark:text-white"
                }`}>
                {page}
              </button>
            </li>
          ))}

          <li>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`px-3 py-2 border rounded-md dark:bg-black dark:text-white  ${
                currentPage >= totalPages
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
