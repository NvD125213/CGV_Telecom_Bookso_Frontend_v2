import React, { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Pagination from "../pagination/pagination";
import ReusableTable from "./ReusableTable";

interface Column {
  key: string;
  label: string;
}

interface ModalPaginationProps {
  isOpen: boolean;
  title: string;
  description?: string;
  data: any[]; // Đảm bảo kiểu dữ liệu phù hợp
  columns: Column[];
  totalPages: number;
  limit: number;
  offset: number;
  year?: number;
  month?: number;
  day?: number;
  error?: string;
  fetchData: (params: {
    limit: number;
    offset: number;
    year?: number;
    month?: number;
    day?: number;
  }) => void;
  onClose: () => void;
  selectedIds?: (string | number)[];
  setSelectedIds?: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  isLoading?: boolean;
}

const ModalPagination: React.FC<ModalPaginationProps> = ({
  isOpen,
  title,
  description,
  data,
  columns,
  totalPages,
  limit,
  offset,
  year,
  month,
  day,
  fetchData,
  onClose,
  selectedIds,
  setSelectedIds,
  isLoading = false,
  error = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = data.filter((item) =>
      item.user_name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredData(filtered);
  }, [searchTerm, data]);

  useEffect(() => {
    if (isOpen) {
      fetchData({ limit, offset, year, month, day });
    }
  }, [isOpen, limit, offset, year, month, day, fetchData]);

  const handlePageChange = (newLimit: number, newOffset: number) => {
    fetchData({ limit: newLimit, offset: newOffset, year, month, day });
  };

  const handleLimitChange = (newLimit: number) => {
    fetchData({ limit: newLimit, offset: 0, year, month, day }); // Reset offset về 0 khi thay đổi limit
  };
  // console.log(">>", error);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[90%] min-h-[600px] m-4">
      <div className="relative w-full p-4 overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 lg:p-11">
        {/* Tiêu đề */}
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          {description && (
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {description}
            </p>
          )}
        </div>

        {/* Thanh tìm kiếm */}
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Nhập tên
            </label>
            <input
              type="text"
              id="first_name"
              placeholder="Tìm kiếm theo user_name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <ReusableTable
          error={error}
          data={filteredData}
          columns={columns}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onCheck={(selectedIds) => setSelectedIds?.(selectedIds)}
          isLoading={isLoading}
        />

        {/* Pagination */}
        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Pagination
            limit={limit}
            offset={offset}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ModalPagination;
