import { instance } from "./index";
import { cleanQuery } from "../helper/cleanQuery";
import type {
  IConfirmDeploymentOrderResult,
  IDeploymentOrder,
  IDeploymentOrderListParams,
  IDeploymentOrderListResult,
  IRejectDeploymentOrderBody,
  IRejectDeploymentOrderResult,
  IUpdateDeploymentOrderCustomerBody,
} from "../types/deploymentOrder";

const BASE = "/api/v3/deployment-orders";

/** GET /api/v3/deployment-orders — danh sách đơn triển khai */
export const getDeploymentOrders = async (
  params: IDeploymentOrderListParams,
): Promise<IDeploymentOrderListResult> => {
  const cleanedParams = cleanQuery(params);
  const res = await instance.get(BASE, { params: cleanedParams });
  return res.data;
};

/** GET /api/v3/deployment-orders/:order_id — chi tiết đơn */
export const getDeploymentOrderById = async (
  orderId: number,
): Promise<IDeploymentOrder> => {
  const res = await instance.get(`${BASE}/${orderId}`);
  return res.data;
};

/** POST /api/v3/deployment-orders/:order_id/confirm — confirm đơn (phase 1) */
export const confirmDeploymentOrder = async (
  orderId: number,
): Promise<IConfirmDeploymentOrderResult> => {
  const res = await instance.post(`${BASE}/${orderId}/confirm`);
  return res.data;
};

/**
 * POST /api/v3/deployment-orders/:order_id/reject
 * Từ chối triển khai (xóa item, số về available)
 */
export const rejectDeploymentOrder = async (
  orderId: number,
  data?: IRejectDeploymentOrderBody,
): Promise<IRejectDeploymentOrderResult> => {
  const res = await instance.post(`${BASE}/${orderId}/reject`, data ?? {});
  return res.data;
};

/**
 * PATCH /api/v3/deployment-orders/:order_id/customer
 * Đổi thông tin khách/HĐ trên đơn (khi chọn nhầm) — chỉ đơn pending.
 */
export const updateDeploymentOrderCustomer = async (
  orderId: number,
  data: IUpdateDeploymentOrderCustomerBody,
): Promise<IDeploymentOrder> => {
  const res = await instance.patch(`${BASE}/${orderId}/customer`, data);
  return res.data;
};
