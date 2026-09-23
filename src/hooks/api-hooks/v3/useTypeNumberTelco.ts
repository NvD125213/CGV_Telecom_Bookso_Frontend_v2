import {
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTypeNumberTelco,
  createTypeNumberTelcosBulk,
  deleteTypeNumberTelco,
  getTypeNumberTelcoById,
  getTypeNumberTelcoMap,
  getTypeNumberTelcos,
  replaceTelcosForType,
  updateTypeNumberTelco,
} from "../../../services/typeNumberTelco";
import {
  ICreateTypeNumberTelco,
  ICreateTypeNumberTelcosBulk,
  IReplaceTelcosForType,
  ITypeNumberTelcoListParams,
  ITypeNumberTelcoListResult,
  IUpdateTypeNumberTelco,
} from "../../../types/typeNumberTelco";

type UseTypeNumberTelcoListParams = Partial<ITypeNumberTelcoListParams>;

const DEFAULT_LIST_PARAMS: ITypeNumberTelcoListParams = {
  page: 1,
  size: 50,
  order_by: "type_id",
  order_dir: "asc",
};

const QUERY_ROOT = ["v3", "type-number-telcos"] as const;

const resolveNextPageParam = (
  lastPage: ITypeNumberTelcoListResult,
  lastPageParam: number,
  pageSize: number,
) => {
  const { page, pages } = lastPage.meta;
  if (typeof page === "number" && typeof pages === "number") {
    return page < pages ? lastPageParam + 1 : undefined;
  }
  return lastPage.items.length >= pageSize ? lastPageParam + 1 : undefined;
};

const invalidateListQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [...QUERY_ROOT, "list"] });
  queryClient.invalidateQueries({ queryKey: [...QUERY_ROOT, "map"] });
};

/** GET list */
export const useTypeNumberTelcoList = (
  params?: UseTypeNumberTelcoListParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams: ITypeNumberTelcoListParams = {
    ...DEFAULT_LIST_PARAMS,
    ...params,
  };

  return useQuery({
    queryKey: [...QUERY_ROOT, "list", mergedParams] as QueryKey,
    queryFn: () => getTypeNumberTelcos(mergedParams),
    enabled: options?.enabled ?? true,
  });
};

/** Infinite scroll list */
export const useTypeNumberTelcoListInfinite = (
  params?: UseTypeNumberTelcoListParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams: ITypeNumberTelcoListParams = {
    ...DEFAULT_LIST_PARAMS,
    ...params,
  };

  return useInfiniteQuery({
    queryKey: [...QUERY_ROOT, "list", "infinite", mergedParams] as QueryKey,
    queryFn: ({ pageParam = 1 }) =>
      getTypeNumberTelcos({
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

/** GET map 2 chiều by_type / by_telco */
export const useTypeNumberTelcoMap = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...QUERY_ROOT, "map"] as QueryKey,
    queryFn: () => getTypeNumberTelcoMap(),
    enabled: options?.enabled ?? true,
  });
};

/** GET by link_id */
export const useTypeNumberTelcoDetail = (
  linkId?: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [...QUERY_ROOT, "detail", linkId] as QueryKey,
    queryFn: () => getTypeNumberTelcoById(linkId as number),
    enabled: (options?.enabled ?? true) && !!linkId,
  });
};

/** POST create 1 cặp */
export const useCreateTypeNumberTelco = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICreateTypeNumberTelco) =>
      createTypeNumberTelco(payload),
    onSuccess: () => invalidateListQueries(queryClient),
  });
};

/** PUT update theo link_id */
export const useUpdateTypeNumberTelco = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      linkId,
      data,
    }: {
      linkId: number;
      data: IUpdateTypeNumberTelco;
    }) => updateTypeNumberTelco(linkId, data),
    onSuccess: (_data, variables) => {
      invalidateListQueries(queryClient);
      queryClient.invalidateQueries({
        queryKey: [...QUERY_ROOT, "detail", variables.linkId],
      });
    },
  });
};

/** DELETE theo link_id */
export const useDeleteTypeNumberTelco = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: number) => deleteTypeNumberTelco(linkId),
    onSuccess: () => invalidateListQueries(queryClient),
  });
};

/** POST bulk — nhiều nhà mạng cho 1 định dạng */
export const useCreateTypeNumberTelcosBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICreateTypeNumberTelcosBulk) =>
      createTypeNumberTelcosBulk(payload),
    onSuccess: () => invalidateListQueries(queryClient),
  });
};

/** PUT by-type/:type_id — ghi đè toàn bộ telco */
export const useReplaceTelcosForType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      typeId,
      data,
    }: {
      typeId: number;
      data: IReplaceTelcosForType;
    }) => replaceTelcosForType(typeId, data),
    onSuccess: () => invalidateListQueries(queryClient),
  });
};
