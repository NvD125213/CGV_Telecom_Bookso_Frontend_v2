import { useSearchParams } from "react-router";
import { useCallback, useEffect, useState } from "react";

type SearchState<T> = {
  state: T;
  setState: (newState: Partial<T>) => void;
};

function useSearchState<T extends Record<string, any>>(
  initialState: T
): SearchState<T> {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setStateInternal] = useState<T>(() => {
    const params: Record<string, any> = {};
    Object.keys(initialState).forEach((key) => {
      const param = searchParams.get(key);
      if (param !== null) {
        params[key] = isNaN(Number(param)) ? param : Number(param);
      } else {
        params[key] = initialState[key];
      }
    });
    return params as T;
  });

  // Cập nhật state và URL params
  const setState = useCallback(
    (newState: Partial<T>) => {
      setStateInternal((prevState) => {
        const updatedState = { ...prevState, ...newState };

        // Cập nhật URL
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updatedState).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            newParams.set(key, value.toString());
          } else {
            newParams.delete(key);
          }
        });

        setSearchParams(newParams);
        return updatedState;
      });
    },
    [setSearchParams, searchParams]
  );

  // Cập nhật state khi URL thay đổi
  useEffect(() => {
    const params: Record<string, any> = {};
    Object.keys(initialState).forEach((key) => {
      const param = searchParams.get(key);
      if (param !== null) {
        params[key] = isNaN(Number(param)) ? param : Number(param);
      }
    });
    setStateInternal((prevState) => ({ ...prevState, ...params }));
  }, [searchParams, initialState]);

  return { state, setState };
}

export default useSearchState;
