import { formatDate } from "../helper/formatDateToISOString";

/** @deprecated Dùng `IBrandNameListParams` */
export type IHistoryBookedParams = IBrandNameListParams;

export interface IBrandNameListParams {
  page: number;
  size: number;
  search?: string;
  sale_name?: string;
  is_active?: boolean;
  order_by?: string;
  order_dir?: string;
}
export interface IBrandName {
  id: number;
  name: string;
  sale_names: string[];
  description: string;
  is_active: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  expired_at: string;
}

export const newBrandName: IBrandName = {
  id: 0,
  name: "",
  sale_names: [],
  description: "",
  is_active: true,
  created_by: "",
  updated_by: "",
  created_at: "",
  updated_at: "",
  expired_at: "",
};

export interface ICreateBrandName {
  name: string;
  sale_names: string[];
  description: string;
  expired_at?: string;
}

export interface IUpdateBrandName extends Partial<ICreateBrandName> {
  id: number;
  is_active: boolean;
}

export type IUpdateBrandNameForSale = string[];

export interface IBrandNameListMeta {
  page: number;
  size: number;
  total: number;
  pages: number;
}

export interface IBrandNameListResult {
  items: IBrandName[];
  meta: IBrandNameListMeta;
}

const normalizeBrandNameItem = (raw: Record<string, unknown>): IBrandName => {
  let saleNames: string[] = [];
  if (Array.isArray(raw.sale_names)) {
    saleNames = raw.sale_names.map(String).filter(Boolean);
  } else if (typeof raw.sale_name === "string" && raw.sale_name.trim()) {
    saleNames = [raw.sale_name.trim()];
  } else if (
    typeof raw.customer_name === "string" &&
    raw.customer_name.trim()
  ) {
    saleNames = [raw.customer_name.trim()];
  }

  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ""),
    sale_names: saleNames,
    description: String(raw.description ?? ""),
    is_active: raw.is_active !== false && raw.is_active !== "false",
    created_by: String(raw.created_by ?? ""),
    updated_by: String(raw.updated_by ?? ""),
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
    expired_at: String(raw.expired_at ?? ""),
  };
};

/** Chuẩn hóa response GET /api/v3/brandname (không đọc file mock). */
export const parseBrandNameListResponse = (
  response: unknown,
): IBrandNameListResult => {
  const root = (response ?? {}) as Record<string, unknown>;
  const payload =
    root.items != null || root.brand_name != null || root.meta != null
      ? root
      : ((root.data as Record<string, unknown> | undefined) ?? root);
  const body = (payload ?? {}) as Record<string, unknown>;

  const rawItems =
    body.items ??
    body.brand_name ??
    body.records ??
    (Array.isArray(payload) ? payload : []);

  const items = (Array.isArray(rawItems) ? rawItems : []).map((item) =>
    normalizeBrandNameItem(item as Record<string, unknown>),
  );

  const meta = (body.meta ?? {}) as Partial<IBrandNameListMeta>;
  const size = meta.size ?? items.length ?? 10;
  const total = meta.total ?? items.length;
  const pages = meta.pages ?? Math.max(1, Math.ceil(total / Math.max(size, 1)));

  return {
    items,
    meta: {
      page: meta.page ?? 1,
      size,
      total,
      pages,
    },
  };
};

export const formatSaleNames = (saleNames?: string[]) =>
  saleNames?.length ? saleNames.join(", ") : "-";

export const formatBrandNameDateTime = (value?: string) =>
  value?.trim() ? formatDate(value) : "-";
