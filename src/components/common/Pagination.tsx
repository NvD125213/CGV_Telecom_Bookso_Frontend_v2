import { useState, useEffect } from "react";
import Select from "../../components/form/Select";

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

export const Pagination = ({ data, onChange }: PaginationProps) => {
  const [currentPage, setCurrentPage] = useState<number>(data.page || 1);
  const [currentSize, setCurrentSize] = useState<number>(data.size || 10);

  // Luôn đảm bảo hiển thị page = 1 nếu chưa có data.page
  useEffect(() => {
    setCurrentPage(data.page || 1);
    setCurrentSize(data.size || 10);
  }, [data.page, data.size]);

  const handlePageChange = (value: string | number) => {
    const page = Number(value);
    setCurrentPage(page);
    onChange(page, currentSize);
  };

  const handleSizeChange = (value: string | number) => {
    const size = Number(value);
    setCurrentSize(size);
    onChange(1, size); // Khi thay đổi size, quay về page 1
    setCurrentPage(1);
  };

  return (
    <div className="flex items-center justify-end gap-2 text-sm mt-5">
      <div className="w-20">
        <Select
          placeholder=""
          options={Array.from(
            { length: data.pages > 0 ? data.pages : 1 },
            (_, i) => ({
              label: (i + 1).toString(),
              value: (i + 1).toString(),
            })
          )}
          value={String(currentPage)}
          onChange={handlePageChange}
        />
      </div>

      <div>/</div>

      <div className="w-20">
        <Select
          placeholder=""
          options={[10, 20, 50].map((n) => ({
            label: n.toString(),
            value: n.toString(),
          }))}
          value={String(currentSize)}
          onChange={handleSizeChange}
        />
      </div>

      <span className="text-sm text-gray-500">trang</span>
    </div>
  );
};
