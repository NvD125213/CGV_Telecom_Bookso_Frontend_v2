export function cleanQuery<T extends Record<string, any>>(
  query: T
): Partial<T> {
  return Object.entries(query).reduce((acc, [key, value]) => {
    if (value != null && value !== "") {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}
