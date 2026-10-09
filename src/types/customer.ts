/**
 * Khách hàng / hợp đồng từ CRM (forward qua GET /api/v3/customers).
 * Shape tham chiếu `DeploymentCustomerSnapshot` trên OpenAPI.
 */
export interface ICustomerSale {
  username?: string;
  full_name?: string;
  [key: string]: unknown;
}

/** Tài khoản Softswitch gắn khách */
export interface ICustomerSsAccount {
  account_id: number;
  name: string;
  description?: string | null;
  match?: string | null;
  disabled?: number;
  display_account?: string;
}

/** Hợp đồng trong khách đã group */
export interface ICustomerContract {
  contract_id: number;
  contract_number: string;
  contract_type?: string | null;
  no_charge?: number;
  contract_note?: string | null;
}

/**
 * 1 dòng flat từ API (mỗi HĐ 1 item, có thể kèm ss_accounts).
 * Dùng trước khi `groupDataCustomer`.
 */
export interface ICustomer {
  customer_id: number;
  customer_name: string;
  tax_code: string | null;
  contract_id: number;
  contract_number: string;
  contract_type: string | null;
  no_charge: number;
  contract_note: string | null;
  sales: Array<ICustomerSale | string> | null;
  sale_username: string | null;
  ss_accounts?: ICustomerSsAccount[] | null;
}

/** Khách đã gộp HĐ + SS accounts theo customer_id */
export interface IGroupedCustomer {
  customer_id: number;
  customer_name: string;
  tax_code: string | null;
  sales: Array<ICustomerSale | string> | null;
  sale_username?: string | null;
  ss_accounts: ICustomerSsAccount[];
  contracts: ICustomerContract[];
  [key: string]: unknown;
}

export interface ICustomerListParams {
  /** user_name sale hoặc ALL (chỉ admin). Sale thường bỏ qua. */
  sale?: string;
  /** Tìm theo tên KH / số HĐ (contains, không phân biệt hoa thường) */
  q?: string;
  /** Lọc 1 KH theo id */
  customer_id?: number;
}

export interface ICustomerListResult {
  items: ICustomer[];
}

const toNullableString = (value: unknown): string | null => {
  if (value == null || value === "") return null;
  return String(value);
};

const normalizeSsAccount = (raw: Record<string, unknown>): ICustomerSsAccount => {
  const name = String(raw.name ?? "");
  const description = toNullableString(raw.description);
  const display =
    toNullableString(raw.display_account) ||
    `${name}${description ? ` * ${description}` : ""}`;
  return {
    account_id: Number(raw.account_id ?? 0),
    name,
    description,
    match: toNullableString(raw.match),
    disabled: Number(raw.disabled ?? 0),
    display_account: display,
  };
};

const normalizeCustomerItem = (raw: Record<string, unknown>): ICustomer => {
  const salesRaw = raw.sales;
  let sales: Array<ICustomerSale | string> | null = null;
  if (Array.isArray(salesRaw)) {
    sales = salesRaw.map((item) =>
      typeof item === "string"
        ? item
        : item && typeof item === "object"
          ? (item as ICustomerSale)
          : { username: String(item ?? "") },
    );
  }

  const ssRaw = raw.ss_accounts;
  const ss_accounts = Array.isArray(ssRaw)
    ? ssRaw.map((item) =>
        normalizeSsAccount((item ?? {}) as Record<string, unknown>),
      )
    : null;

  return {
    customer_id: Number(raw.customer_id ?? raw.id ?? 0),
    customer_name: String(raw.customer_name ?? raw.name ?? ""),
    tax_code: toNullableString(raw.tax_code),
    contract_id: Number(raw.contract_id ?? 0),
    contract_number: String(raw.contract_number ?? ""),
    contract_type: toNullableString(raw.contract_type),
    no_charge: Number(raw.no_charge ?? 0),
    contract_note: toNullableString(raw.contract_note),
    sales,
    sale_username: toNullableString(raw.sale_username),
    ss_accounts,
  };
};

/** Chuẩn hóa response GET /api/v3/customers (CRM forward, schema linh hoạt). */
export const parseCustomerListResponse = (
  response: unknown,
): ICustomerListResult => {
  if (Array.isArray(response)) {
    return {
      items: response.map((item) =>
        normalizeCustomerItem((item ?? {}) as Record<string, unknown>),
      ),
    };
  }

  const root = (response ?? {}) as Record<string, unknown>;
  const payload =
    root.items != null || root.data != null || root.customers != null
      ? root
      : root;

  const body = (payload ?? {}) as Record<string, unknown>;
  const rawItems =
    body.items ??
    body.customers ??
    body.data ??
    (Array.isArray(payload) ? payload : []);

  const list = Array.isArray(rawItems)
    ? rawItems
    : Array.isArray((rawItems as Record<string, unknown>)?.items)
      ? ((rawItems as Record<string, unknown>).items as unknown[])
      : [];

  return {
    items: list.map((item) =>
      normalizeCustomerItem((item ?? {}) as Record<string, unknown>),
    ),
  };
};
