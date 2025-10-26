// hooks/useQuerySync.ts
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useQuerySync<T extends Record<string, any>>(
  initialQuery: T
): [T, React.Dispatch<React.SetStateAction<T>>, Partial<T>] {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState<T>(() => {
    const entries = Object.fromEntries(searchParams.entries());
    return { ...initialQuery, ...entries } as T;
  });

  // Clean query để gửi API
  const cleanedQuery = Object.entries(query).reduce((acc, [key, value]) => {
    if (value != null && value !== "") {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);

  useEffect(() => {
    const newParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value != null && value !== "") {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams, { replace: true });
  }, [query, setSearchParams]);

  return [query, setQuery, cleanedQuery] as const;
}
