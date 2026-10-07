export type FastApiValidationErrorItem = {
  type?: string;
  loc?: (string | number)[];
  msg?: string;
  input?: unknown;
};

const isValidationItem = (value: unknown): value is FastApiValidationErrorItem =>
  typeof value === "object" &&
  value != null &&
  ("msg" in value || "loc" in value);

export const locToFormField = (loc?: (string | number)[]): string | null => {
  if (!loc?.length) return null;
  const bodyIdx = loc.findIndex((part) => part === "body");
  if (bodyIdx >= 0 && loc[bodyIdx + 1] != null) {
    return String(loc[bodyIdx + 1]);
  }
  const last = loc[loc.length - 1];
  return typeof last === "string" || typeof last === "number"
    ? String(last)
    : null;
};

export const validationItemToMessage = (
  item: FastApiValidationErrorItem,
): string => {
  const type = item.type ?? "";
  if (
    type.includes("datetime") ||
    type.includes("date_parsing") ||
    type.includes("date_from")
  ) {
    return "Ngày giờ không hợp lệ. Vui lòng chọn đầy đủ ngày và giờ.";
  }
  const msg = item.msg?.trim();
  return msg || "Giá trị không hợp lệ";
};

export const parseFastApiValidationDetail = (
  detail: unknown,
): { fieldErrors: Record<string, string>; message: string } => {
  if (typeof detail === "string" && detail.trim()) {
    return { fieldErrors: {}, message: detail.trim() };
  }

  if (!Array.isArray(detail)) {
    return { fieldErrors: {}, message: "" };
  }

  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];

  detail.forEach((entry) => {
    if (!isValidationItem(entry)) return;
    const message = validationItemToMessage(entry);
    messages.push(message);
    const field = locToFormField(entry.loc);
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = message;
    }
  });

  const uniqueMessages = [...new Set(messages.filter(Boolean))];
  const message =
    uniqueMessages.length === 1
      ? uniqueMessages[0]
      : uniqueMessages.length > 1
        ? uniqueMessages.join(" ")
        : "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại form.";

  return { fieldErrors, message };
};

type AxiosLikeError = {
  response?: {
    status?: number;
    data?: {
      detail?: unknown;
      message?: string;
    };
  };
  message?: string;
};

/** Gộp lỗi 422 (Pydantic) và message/detail dạng chuỗi từ API. */
export const parseSubmitApiError = (
  err: unknown,
): { fieldErrors: Record<string, string>; message: string } => {
  const axiosErr = err as AxiosLikeError;
  const status = axiosErr.response?.status;
  const data = axiosErr.response?.data;

  if (status === 422 && data?.detail != null) {
    return parseFastApiValidationDetail(data.detail);
  }

  if (typeof data?.detail === "string" && data.detail.trim()) {
    return { fieldErrors: {}, message: data.detail.trim() };
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return { fieldErrors: {}, message: data.message.trim() };
  }

  if (axiosErr.message?.trim()) {
    return { fieldErrors: {}, message: axiosErr.message.trim() };
  }

  return { fieldErrors: {}, message: "Đã có lỗi xảy ra" };
};
