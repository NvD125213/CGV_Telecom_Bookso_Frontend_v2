// hooks/usePaginationFilters.ts
import { useState } from "react";

interface PaginationFilters {
  limit: number;
  offset: number;
  year?: number;
  month?: number;
  day?: number;
}

interface UsePaginationFiltersReturn extends PaginationFilters {
  setLimit: (limit: number) => void;
  setOffset: (offset: number) => void;
  setYear: (year?: number) => void;
  setMonth: (month?: number) => void;
  setDay: (day?: number) => void;
  updatePagination: (updates: Partial<PaginationFilters>) => void;
}

export const usePaginationFilters = (
  initialLimit: number = 5,
  initialOffset: number = 0
): UsePaginationFiltersReturn => {
  const [filters, setFilters] = useState<PaginationFilters>({
    limit: initialLimit,
    offset: initialOffset,
    year: undefined,
    month: undefined,
    day: undefined,
  });

  const setLimit = (limit: number) =>
    setFilters((prev) => ({ ...prev, limit }));
  const setOffset = (offset: number) =>
    setFilters((prev) => ({ ...prev, offset }));
  const setYear = (year?: number) => setFilters((prev) => ({ ...prev, year }));
  const setMonth = (month?: number) =>
    setFilters((prev) => ({ ...prev, month }));
  const setDay = (day?: number) => setFilters((prev) => ({ ...prev, day }));

  const updatePagination = (updates: Partial<PaginationFilters>) =>
    setFilters((prev) => ({ ...prev, ...updates }));

  return {
    ...filters,
    setLimit,
    setOffset,
    setYear,
    setMonth,
    setDay,
    updatePagination,
  };
};
