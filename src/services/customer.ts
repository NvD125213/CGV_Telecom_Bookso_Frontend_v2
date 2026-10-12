import { instance } from "./index";
import { cleanQuery } from "../helper/cleanQuery";
import {
  ICustomerListParams,
  ICustomerListResult,
  parseCustomerListResponse,
} from "../types/customer";

const BASE = "/api/v3/customers";

/** GET /api/v3/customers — sale, q, customer_id, ss_account */
export const getCustomers = async (
  params?: ICustomerListParams,
): Promise<ICustomerListResult> => {
  const cleanedParams = cleanQuery(params ?? {});
  const res = await instance.get(BASE, { params: cleanedParams });
  return parseCustomerListResponse(res.data);
};
