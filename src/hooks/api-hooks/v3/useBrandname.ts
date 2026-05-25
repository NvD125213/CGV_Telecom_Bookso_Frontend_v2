import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getBrandName,
  createBrandName,
  updateBrandName,
  deleteBrandName,
  updateBrandNameForSale,
} from "../../../services/brandName";
import {
  ICreateBrandName,
  IUpdateBrandName,
  IBrandNameListParams,
  IBrandNameListResult,
  IUpdateBrandNameForSale,
} from "../../../types/brandName";

type UseBrandNameListParams = Partial<IBrandNameListParams>;

const DEFAULT_LIST_PARAMS: IBrandNameListParams = {
  page: 1,
  size: 10,
  order_by: "created_at",
  order_dir: "desc",
};

export const useBrandNameList = (
  params?: UseBrandNameListParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams: IBrandNameListParams = {
    ...DEFAULT_LIST_PARAMS,
    ...params,
  };

  return useQuery({
    queryKey: ["v3", "brandname", "list", mergedParams] as QueryKey,
    queryFn: () => getBrandName(mergedParams),
    enabled: options?.enabled ?? true,
  });
};

const getBrandNameNextPageParam = (
  lastPage: IBrandNameListResult,
  lastPageParam: number,
  pageSize: number,
) => {
  const { page, pages } = lastPage.meta;
  if (typeof page === "number" && typeof pages === "number") {
    return page < pages ? lastPageParam + 1 : undefined;
  }
  return lastPage.items.length >= pageSize ? lastPageParam + 1 : undefined;
};

/** Infinite scroll — gọi `fetchNextPage` khi user scroll gần cuối danh sách. */
export const useBrandNameListInfinite = (
  params?: UseBrandNameListParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams: IBrandNameListParams = {
    ...DEFAULT_LIST_PARAMS,
    ...params,
  };

  return useInfiniteQuery({
    queryKey: ["v3", "brandname", "list", "infinite", mergedParams] as QueryKey,
    queryFn: ({ pageParam = 1 }) =>
      getBrandName({
        ...mergedParams,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      getBrandNameNextPageParam(
        lastPage,
        lastPageParam as number,
        mergedParams.size,
      ),
    enabled: options?.enabled ?? true,
  });
};

export const useCreateBrandName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICreateBrandName) => createBrandName(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["v3", "brandname", "list"] });
    },
  });
};

export const useUpdateBrandName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IUpdateBrandName) => updateBrandName(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["v3", "brandname", "list"] });
    },
  });
};

export const useUpdateBrandNameForSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdateBrandNameForSale }) =>
      updateBrandNameForSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["v3", "brandname", "list"] });
    },
  });
};

export const useDeleteBrandName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteBrandName(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["v3", "brandname", "list"] });
    },
  });
};
