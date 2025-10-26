export const validateForm = (form: any) => {
  const newErrors: Record<string, string> = {};

  if (!form.name?.trim()) newErrors.name = "Tên gói không được để trống";

  return newErrors;
};
