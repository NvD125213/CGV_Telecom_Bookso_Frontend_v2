import { useSearchParams } from "react-router-dom";
import { useState } from "react";

export function useQueryString<T extends Record<string, string>>(
  keys: (keyof T)[]
) {
  const [searchParams] = useSearchParams();

  // Initialize state from searchParams
  const initialState = keys.reduce((acc, key) => {
    const stringKey = key as string;
    acc[stringKey] = searchParams.get(stringKey) || "";
    return acc;
  }, {} as Record<string, string>);

  const [values, setValues] = useState<Record<string, string>>(initialState);

  // Generate individual setters like setSearch, setDate
  const setters = keys.reduce((acc, key) => {
    const stringKey = key as string;
    const setterName = `set${stringKey
      .charAt(0)
      .toUpperCase()}${stringKey.slice(1)}`;
    acc[setterName] = (val: string) => {
      setValues((prev) => ({ ...prev, [stringKey]: val }));
    };
    return acc;
  }, {} as Record<string, (val: string) => void>);

  return {
    ...values,
    ...setters,
  } as T & Record<`set${Capitalize<string & keyof T>}`, (val: string) => void>;
}
