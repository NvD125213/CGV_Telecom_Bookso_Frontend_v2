import {
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  IParamsListCheckPhoneNumber,
  listCheckPhoneNumber,
  uploadCheckPhoneNumber,
  deleteFileNumber,
  listCheckedPhoneNumberData,
  listPhoneErrors,
  IParamsListPhoneErrors,
  getPhoneErrorDownload,
} from "../../../services/phoneNumber";

type UseListCheckPhoneNumberParams = Partial<IParamsListCheckPhoneNumber>;

type PaginationLike = {
  page?: number;
  current_page?: number;
  total_pages?: number;
  has_next?: boolean;
};

export const CHECK_PHONE_PAGE_SIZE = 20;

const DEFAULT_LIST_PARAMS: IParamsListCheckPhoneNumber = {
  page: 1,
  size: CHECK_PHONE_PAGE_SIZE,
  file_page: 1,
  file_size: CHECK_PHONE_PAGE_SIZE,
  file_code: "",
  phone: "",
};

const getPagination = (payload: any): PaginationLike | undefined => {
  return (
    payload?.pagination ??
    payload?.meta?.pagination ??
    payload?.meta?.records ??
    payload?.meta?.files
  );
};

const resolveNextPage = (lastPage: any, currentPage: number, size: number) => {
  const payload = lastPage?.data;
  const pagination = getPagination(payload);

  if (typeof pagination?.has_next === "boolean") {
    return pagination.has_next ? currentPage + 1 : undefined;
  }

  if (
    typeof pagination?.current_page === "number" &&
    typeof pagination?.total_pages === "number"
  ) {
    return pagination.current_page < pagination.total_pages
      ? pagination.current_page + 1
      : undefined;
  }

  if (
    typeof pagination?.page === "number" &&
    typeof pagination?.total_pages === "number"
  ) {
    return pagination.page < pagination.total_pages
      ? pagination.page + 1
      : undefined;
  }

  if (
    typeof pagination?.page === "number" &&
    typeof (pagination as any)?.pages === "number"
  ) {
    return pagination.page < (pagination as any).pages
      ? pagination.page + 1
      : undefined;
  }

  const records = payload?.records ?? payload?.items ?? payload?.data ?? [];
  const currentSize = Array.isArray(records) ? records.length : 0;
  return currentSize >= size ? currentPage + 1 : undefined;
};

export const useListCheckPhoneNumber = (
  params?: UseListCheckPhoneNumberParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams = { ...DEFAULT_LIST_PARAMS, ...params };
  return useQuery({
    queryKey: ["v3", "phone", "check", "list", mergedParams] as QueryKey,
    queryFn: () =>
      listCheckPhoneNumber(mergedParams as IParamsListCheckPhoneNumber),
    enabled: options?.enabled ?? true,
  });
};

export const useListCheckedPhoneNumberData = (
  params?: UseListCheckPhoneNumberParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams = { ...DEFAULT_LIST_PARAMS, ...params };
  return useQuery({
    queryKey: [
      "v3",
      "phone",
      "check",
      "list",
      "data",
      mergedParams,
    ] as QueryKey,
    queryFn: () =>
      listCheckedPhoneNumberData(mergedParams as IParamsListCheckPhoneNumber),
    enabled: options?.enabled ?? true,
  });
};

export const useListCheckPhoneNumberScroll = (
  params?: UseListCheckPhoneNumberParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams = { ...DEFAULT_LIST_PARAMS, ...params };

  return useInfiniteQuery({
    queryKey: ["v3", "phone", "check", "scroll", mergedParams] as QueryKey,
    queryFn: ({ pageParam = 1 }) =>
      listCheckPhoneNumber({
        ...mergedParams,
        page: pageParam as number,
      } as IParamsListCheckPhoneNumber),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      resolveNextPage(lastPage, lastPageParam as number, mergedParams.size),
    enabled: options?.enabled ?? true,
  });
};

/** Infinite scroll cho chi tiết file trên tab "đã check" (`/upload-phone-number/data`). */
export const useListCheckedPhoneNumberDataScroll = (
  params?: UseListCheckPhoneNumberParams,
  options?: { enabled?: boolean },
) => {
  const mergedParams = { ...DEFAULT_LIST_PARAMS, ...params };

  return useInfiniteQuery({
    queryKey: [
      "v3",
      "phone",
      "check",
      "scroll",
      "data",
      mergedParams,
    ] as QueryKey,
    queryFn: ({ pageParam = 1 }) =>
      listCheckedPhoneNumberData({
        ...mergedParams,
        page: pageParam as number,
      } as IParamsListCheckPhoneNumber),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      resolveNextPage(lastPage, lastPageParam as number, mergedParams.size),
    enabled: options?.enabled ?? true,
  });
};

export const useUploadCheckPhoneNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadCheckPhoneNumber(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["v3", "phone", "check", "list"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["v3", "phone", "errors", "list"],
      });
    },
  });
};

export const useDeleteFileNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileCode: string) => deleteFileNumber(fileCode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["v3", "phone", "check", "list"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["v3", "phone", "check", "scroll"],
      });
    },
  });
};

export const useListPhoneErrors = (
  params?: Partial<IParamsListPhoneErrors>,
  options?: { enabled?: boolean },
) => {
  const merged = params ?? {};
  return useQuery({
    queryKey: ["v3", "phone", "errors", "list", merged] as QueryKey,
    queryFn: () => listPhoneErrors(merged),
    enabled: options?.enabled ?? true,
  });
};

export const useGetPhoneErrorDownload = (
  file_name: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["v3", "phone", "errors", "download", file_name] as QueryKey,
    queryFn: () => getPhoneErrorDownload(file_name),
    enabled: (options?.enabled ?? true) && !!file_name,
  });
};
