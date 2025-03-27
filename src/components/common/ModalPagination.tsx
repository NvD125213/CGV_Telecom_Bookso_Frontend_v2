import React, { useEffect } from "react";
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
  data: [];
  columns: Column[];
  totalPages: number;
  limit: number;
  offset: number;
  year?: number;
  month?: number;
  day?: number;
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
}) => {
  // Không cần useState cho limit và offset nữa, sử dụng trực tiếp từ props

  // Gọi fetchData khi modal mở lần đầu
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[85%] min-h-[600px] m-4">
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

        {/* Bảng dữ liệu */}
        <ReusableTable
          data={data}
          columns={columns}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onCheck={(selectedIds) => setSelectedIds?.(selectedIds)}
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
