import { useEffect, useState } from "react";

interface UseSelectDataProps<T> {
  service: () => Promise<T[]>;
}

interface UseSelectDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

const useSelectData = <T>({
  service,
}: UseSelectDataProps<T>): UseSelectDataResult<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await service();
        if (Array.isArray(result)) {
          setData(result);
        } else {
          setData([]);
          setError("Đang có lỗi xảy ra");
        }
      } catch (err) {
        setData([]);
        if (err instanceof Error) {
          setError(err.message || "Đang có lỗi xảy ra");
        } else {
          setError("Đang có lỗi xảy ra");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [service]);

  return { data, loading, error };
};

export default useSelectData;
