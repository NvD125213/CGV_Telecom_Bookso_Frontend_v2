import type {
  ICustomer,
  ICustomerSale,
  ICustomerSsAccount,
  IGroupedCustomer,
} from "./customer";

/** Snapshot khách gắn đơn triển khai — OpenAPI `DeploymentCustomerSnapshot` */
export interface IDeploymentCustomerSnapshot {
  customer_id: number;
  customer_name: string;
  tax_code?: string | null;
  /** Không dùng HĐ — gửi null */
  contract_id?: number | null;
  contract_number?: string | null;
  contract_type?: string | null;
  no_charge?: number | null;
  contract_note?: string | null;
  /** vd [{ username: "HUYLQ", full_name: "..." }] hoặc ["HUYLQ"] */
  sales?: Array<ICustomerSale | string> | null;
  /** Sale gắn đơn nếu không gửi sales[] */
  sale_username?: string | null;
  /** Softswitch account đã chọn (alias cũ) */
  account_id?: number | null;
  name?: string | null;
  description?: string | null;
  /** Softswitch — field name khớp API list/detail */
  ss_account_id?: number | null;
  name_ss_account?: string | null;
  description_ss_account?: string | null;
}

const mapSsFields = (account?: ICustomerSsAccount | null) => {
  const accountId = account?.account_id ?? null;
  const name = account?.name ?? null;
  const description = account?.description ?? null;
  return {
    account_id: accountId,
    name,
    description,
    ss_account_id: accountId,
    name_ss_account: name,
    description_ss_account: description,
  };
};

/** Map từ item flat GET /customers + SS account sang snapshot book v3 */
export const toDeploymentCustomerSnapshot = (
  customer: ICustomer,
  account?: ICustomerSsAccount | null,
): IDeploymentCustomerSnapshot => ({
  customer_id: customer.customer_id,
  customer_name: customer.customer_name,
  tax_code: customer.tax_code,
  contract_id: null,
  contract_number: null,
  contract_type: null,
  no_charge: null,
  contract_note: null,
  sales: customer.sales,
  sale_username: customer.sale_username,
  ...mapSsFields(account),
});

/** Map từ khách đã group + SS account (bỏ HĐ → null) */
export const toDeploymentCustomerSnapshotFromGrouped = (
  customer: IGroupedCustomer,
  account?: ICustomerSsAccount | null,
): IDeploymentCustomerSnapshot => ({
  customer_id: customer.customer_id,
  customer_name: customer.customer_name,
  tax_code: customer.tax_code,
  contract_id: null,
  contract_number: null,
  contract_type: null,
  no_charge: null,
  contract_note: null,
  sales: customer.sales,
  sale_username: customer.sale_username ?? null,
  ...mapSsFields(account),
});

/**
 * Một dòng random — OpenAPI `BookingRandomSelection`.
 * Bắt buộc type_number_id + provider_id.
 */
export interface IBookingRandomSelection {
  type_number_id: number;
  provider_id: number;
  quantity_book?: number;
  brandname_id?: number | null;
  is_beautiful_number?: boolean;
}

/**
 * POST /api/v3/booking — BookRequestV3
 * Bắt buộc: is_new_customer=true HOẶC deployment_customer
 * Chọn số (chỉ một cách): id_phone_numbers | selections[] | type_number_id + provider_id
 */
export interface IBookingRequestV3 {
  id_phone_numbers?: number[];
  /** Random nhiều loại/NCC gom 1 đơn. Không gửi kèm id_phone_numbers hay cặp type/provider. */
  selections?: IBookingRandomSelection[] | null;
  type_number_id?: number | null;
  provider_id?: number | null;
  brandname_id?: number | null;
  quantity_book?: number | null;
  is_beautiful_number?: boolean;
  is_new_customer?: boolean;
  deployment_customer?: IDeploymentCustomerSnapshot | null;
}

/**
 * POST /api/v3/booking/random — BookingRandomRequestV3
 * Cách 1: selections[] (nhiều loại → 1 đơn)
 * Cách 2: type_number_id + provider_id + quantity_book (legacy 1 dòng)
 * Không gửi đồng thời selections và cặp type/provider. Không nhận id_phone_numbers.
 */
export interface IBookingRandomRequestV3 {
  selections?: IBookingRandomSelection[] | null;
  /** Legacy — khi không dùng selections */
  type_number_id?: number | null;
  /** Legacy — khi không dùng selections */
  provider_id?: number | null;
  brandname_id?: number | null;
  /** Legacy — số lượng khi book 1 dòng */
  quantity_book?: number;
  /** Legacy — chỉ áp dụng book 1 dòng */
  is_beautiful_number?: boolean;
  is_new_customer?: boolean;
  deployment_customer?: IDeploymentCustomerSnapshot | null;
}

/**
 * Response book v3 — body 200 để trống trên OpenAPI.
 * Random có thêm `selections_result` khi book theo selections hoặc legacy.
 */
export interface IBookingV3Result {
  selections_result?: unknown;
  [key: string]: unknown;
}
