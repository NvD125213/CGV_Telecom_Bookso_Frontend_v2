import { instance } from "./index";
import { cleanQuery } from "../helper/cleanQuery";
import {
  ICustomerListParams,
  ICustomerListResult,
  parseCustomerListResponse,
} from "../types/customer";

const BASE = "/api/v3/customers";

/**
 * GET /api/v3/customers — danh sách khách hàng theo sale (forward CRM).
 * @see http://103.216.124.57:8080/docs#/Customers/list_customers_api_v3_customers_get
 */
export const getCustomers = async (
  params?: ICustomerListParams,
): Promise<ICustomerListResult> => {
  const cleanedParams = cleanQuery(params ?? {});
  const res = await instance.get(BASE, { params: cleanedParams });
  return parseCustomerListResponse(res.data);
};
