/** Status đơn triển khai: pending | confirmed | rejected | cancelled */
export type DeploymentOrderStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | string;

export interface IDeploymentOrderItem {
  id: number;
  deployment_order_id: number;
  phone_number_id: number;
  phone_number: string;
  status: string;
  telco?: string | null;
  provider_id?: number | null;
  provider_name?: string | null;
  type_id?: number | null;
  type_name?: string | null;
  brandname_id?: number | null;
  brandname_name?: string | null;
  installation_fee?: number | null;
  maintenance_fee?: number | null;
  vanity_number_fee?: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface IDeploymentOrder {
  id: number;
  sale_username: string;
  customer_id: number;
  customer_name: string;
  contract_id: number;
  contract_number: string;
  status: DeploymentOrderStatus;
  created_by: string;
  tax_code: string | null;
  contract_type: string | null;
  no_charge: number;
  contract_note: string | null;
  created_at: string | null;
  updated_at: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  reject_reason: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  items: IDeploymentOrderItem[];
  item_count: number | null;
}

export interface IDeploymentOrderListParams {
  page: number;
  size: number;
  /** Lọc theo sale_username (admin). User thường chỉ thấy đơn của mình. */
  sale?: string;
  /** pending | confirmed | rejected | cancelled */
  status?: DeploymentOrderStatus;
  customer_id?: number;
  contract_id?: number;
}

export interface IDeploymentOrderListResult {
  total: number;
  page: number;
  size: number;
  items: IDeploymentOrder[];
}

export interface IRejectDeploymentOrderBody {
  phone_number_id?: number | null;
  reason?: string | null;
}

export interface IRejectDeploymentOrderResult {
  deployment_order_id: number;
  order_status: string;
  rejected_items: unknown[];
  message: string;
}

export interface IConfirmDeploymentOrderResult {
  deployment_order_id: number;
  order_status: string;
  message: string;
}

/**
 * PATCH /api/v3/deployment-orders/{order_id}/customer
 * Chỉ đơn pending. Cập nhật snapshot khách/HĐ trên header.
 */
export interface IUpdateDeploymentOrderCustomerBody {
  customer_id: number;
  customer_name: string;
  tax_code?: string | null;
  contract_id: number;
  contract_number: string;
  contract_type?: string | null;
  no_charge?: number;
  contract_note?: string | null;
  sales?: Array<string | { username?: string; full_name?: string }> | null;
  sale_username?: string | null;
  reason?: string | null;
}
