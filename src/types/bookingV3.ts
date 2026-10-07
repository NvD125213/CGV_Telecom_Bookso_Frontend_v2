import type { ICustomer, ICustomerSale } from "./customer";

/** Snapshot khách/HĐ gắn đơn triển khai — OpenAPI `DeploymentCustomerSnapshot` */
export interface IDeploymentCustomerSnapshot {
  customer_id: number;
  customer_name: string;
  tax_code?: string | null;
  contract_id: number;
  contract_number: string;
  contract_type?: string | null;
  no_charge?: number;
  contract_note?: string | null;
  /** vd [{ username: "HUYLQ", full_name: "..." }] */
  sales?: ICustomerSale[] | null;
  /** Sale gắn đơn nếu không gửi sales[] */
  sale_username?: string | null;
}

/** Map từ item GET /customers sang snapshot book v3 */
export const toDeploymentCustomerSnapshot = (
  customer: ICustomer,
): IDeploymentCustomerSnapshot => ({
  customer_id: customer.customer_id,
  customer_name: customer.customer_name,
  tax_code: customer.tax_code,
  contract_id: customer.contract_id,
  contract_number: customer.contract_number,
  contract_type: customer.contract_type,
  no_charge: customer.no_charge,
  contract_note: customer.contract_note,
  sales: customer.sales,
  sale_username: customer.sale_username,
});

/**
 * POST /api/v3/booking — BookRequestV3
 * Bắt buộc: is_new_customer=true HOẶC deployment_customer
 * Chọn số: id_phone_numbers HOẶC (type_number_id + provider_id)
 */
export interface IBookingRequestV3 {
  id_phone_numbers?: number[];
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
 * Bắt buộc type_number_id + provider_id; không nhận id_phone_numbers
 */
export interface IBookingRandomRequestV3 {
  type_number_id: number;
  provider_id: number;
  brandname_id?: number | null;
  quantity_book?: number;
  is_beautiful_number?: boolean;
  is_new_customer?: boolean;
  deployment_customer?: IDeploymentCustomerSnapshot | null;
}

/** Response book v3 — schema OpenAPI để trống (forward), giữ linh hoạt */
export type IBookingV3Result = Record<string, unknown>;
