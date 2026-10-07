import { QueryKey, useQuery } from "@tanstack/react-query";
import { getCustomers } from "../../../services/customer";
import type { ICustomerListParams } from "../../../types/customer";

type UseCustomerListParams = Partial<ICustomerListParams>;

const QUERY_ROOT = ["v3", "customers"] as const;

/** GET /api/v3/customers — danh sách khách hàng theo sale (forward CRM) */
export const useCustomerList = (
  params?: UseCustomerListParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams: ICustomerListParams = {
    ...params,
  };

  return useQuery({
    queryKey: [...QUERY_ROOT, "list", mergedParams] as QueryKey,
    queryFn: () => getCustomers(mergedParams),
    enabled: options?.enabled ?? true,
  });
};
