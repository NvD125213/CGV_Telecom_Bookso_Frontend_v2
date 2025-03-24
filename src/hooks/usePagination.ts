import { useState } from "react";

interface UsePaginationProps {
  totalPages?: number;
  limit?: number;
}

export const usePagination = ({
  totalPages = 10,
  limit = 10,
}: UsePaginationProps) => {
  const [totalPage, setTotalPage] = useState<number>(totalPages);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const offset = (currentPage - 1) * limit;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPage) {
      setCurrentPage(newPage);
    }
  };

  const handleTotalPageChange = (newTotalPage: number) => {
    if (newTotalPage > 10) {
      setTotalPage(newTotalPage);
      if (currentPage > newTotalPage) setCurrentPage(newTotalPage);
    }
  };

  return {
    totalPage,
    currentPage,
    limit,
    offset,
    setCurrentPage: handlePageChange,
    setTotalPage: handleTotalPageChange,
  };
};
