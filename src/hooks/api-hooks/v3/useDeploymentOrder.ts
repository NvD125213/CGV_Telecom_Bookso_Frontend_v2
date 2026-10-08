import {
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  confirmDeploymentOrder,
  denyRejectDeploymentOrder,
  getDeploymentOrderById,
  getDeploymentOrders,
  rejectDeploymentOrder,
  updateDeploymentOrderCustomer,
} from "../../../services/deploymentOrder";
import type {
  IDeploymentOrderListParams,
  IDeploymentOrderListResult,
  IRejectDeploymentOrderBody,
  IUpdateDeploymentOrderCustomerBody,
} from "../../../types/deploymentOrder";

type UseDeploymentOrderListParams = Partial<IDeploymentOrderListParams>;

const DEFAULT_LIST_PARAMS: IDeploymentOrderListParams = {
  page: 1,
  size: 20,
};

const QUERY_ROOT = ["v3", "deployment-orders"] as const;

const resolveNextPageParam = (
  lastPage: IDeploymentOrderListResult,
  lastPageParam: number,
  pageSize: number,
) => {
  const totalPages =
    lastPage.size > 0 ? Math.ceil(lastPage.total / lastPage.size) : 0;
  if (typeof lastPage.page === "number" && totalPages > 0) {
    return lastPage.page < totalPages ? lastPageParam + 1 : undefined;
  }
  return lastPage.items.length >= pageSize ? lastPageParam + 1 : undefined;
};

const invalidateListQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: [...QUERY_ROOT, "list"] });
};

/** GET list deployment orders */
export const useDeploymentOrderList = (
  params?: UseDeploymentOrderListParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams: IDeploymentOrderListParams = {
    ...DEFAULT_LIST_PARAMS,
    ...params,
  };

  return useQuery({
    queryKey: [...QUERY_ROOT, "list", mergedParams] as QueryKey,
    queryFn: () => getDeploymentOrders(mergedParams),
    enabled: options?.enabled ?? true,
  });
};

/** Infinite scroll list */
export const useDeploymentOrderListInfinite = (
  params?: UseDeploymentOrderListParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams: IDeploymentOrderListParams = {
    ...DEFAULT_LIST_PARAMS,
    ...params,
  };

  return useInfiniteQuery({
    queryKey: [...QUERY_ROOT, "list", "infinite", mergedParams] as QueryKey,
    queryFn: ({ pageParam = 1 }) =>
      getDeploymentOrders({
        ...mergedParams,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      resolveNextPageParam(
        lastPage,
        lastPageParam as number,
        mergedParams.size,
      ),
    enabled: options?.enabled ?? true,
  });
};

/** GET detail by order_id */
export const useDeploymentOrderById = (
  orderId?: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [...QUERY_ROOT, "detail", orderId] as QueryKey,
    queryFn: () => getDeploymentOrderById(orderId as number),
    enabled: (options?.enabled ?? true) && typeof orderId === "number",
  });
};

/** POST confirm */
export const useConfirmDeploymentOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => confirmDeploymentOrder(orderId),
    onSuccess: (_data, orderId) => {
      invalidateListQueries(queryClient);
      queryClient.invalidateQueries({
        queryKey: [...QUERY_ROOT, "detail", orderId],
      });
    },
  });
};

/** POST reject — sale xin hủy / admin duyệt hủy */
export const useRejectDeploymentOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: number;
      data?: IRejectDeploymentOrderBody;
    }) => rejectDeploymentOrder(orderId, data),
    onSuccess: (_data, variables) => {
      invalidateListQueries(queryClient);
      queryClient.invalidateQueries({
        queryKey: [...QUERY_ROOT, "detail", variables.orderId],
      });
    },
  });
};

/** POST reject/deny — admin từ chối yêu cầu / sale rút yêu cầu */
export const useDenyRejectDeploymentOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => denyRejectDeploymentOrder(orderId),
    onSuccess: (_data, orderId) => {
      invalidateListQueries(queryClient);
      queryClient.invalidateQueries({
        queryKey: [...QUERY_ROOT, "detail", orderId],
      });
    },
  });
};

/** PATCH đổi khách/HĐ trên đơn pending */
export const useUpdateDeploymentOrderCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: number;
      data: IUpdateDeploymentOrderCustomerBody;
    }) => updateDeploymentOrderCustomer(orderId, data),
    onSuccess: (_data, variables) => {
      invalidateListQueries(queryClient);
      queryClient.invalidateQueries({
        queryKey: [...QUERY_ROOT, "detail", variables.orderId],
      });
    },
  });
};
