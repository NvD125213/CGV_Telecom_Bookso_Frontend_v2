import { useEffect, useState, useCallback } from "react";

interface UseApiReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

/**
 * Custom hook tương tự RTK Query
 * @param apiFn - Hàm API async (trả về dữ liệu)
 * @param deps - Dependencies để gọi lại (nếu cần)
 */
export function useApi<T>(
  apiFn: () => Promise<T>,
  deps: any[] = []
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiFn();
      setData(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
