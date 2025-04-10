import { useState, useCallback } from "react";

const useDateFilter = () => {
  const [day, setDay] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);

  const getFilter = useCallback(() => {
    const filter: Record<string, number> = {};
    if (day) filter.day = day;
    if (month) filter.month = month;
    if (year) filter.year = year;
    return filter;
  }, [day, month, year]);

  const setAll = (date: Date) => {
    setDay(date.getDate());
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };
  return {
    day,
    setDay,
    month,
    setMonth,
    year,
    setYear,
    getFilter,
    setAll,
  };
};

export default useDateFilter;
