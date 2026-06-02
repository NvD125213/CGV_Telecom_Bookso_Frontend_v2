import { useCallback, useEffect, useMemo, useState } from "react";
import { BsCheckCircleFill, BsXCircleFill } from "react-icons/bs";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import type { UploadFileCardData, UploadPhoneRecord } from "../card/CardUpload";

import {
  useListCheckPhoneNumberScroll,
  useListCheckedPhoneNumberDataScroll,
} from "../../hooks/api-hooks/v3/useCheckPhone";
import { useIsMobile } from "../../hooks/useScreenSize";

const SEARCH_DEBOUNCE_MS = 400;

function countDigits(value: string) {
  return value.replace(/\D/g, "").length;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

type DrawerListSource = "upload" | "checked-data";

type DrawerMenuPhoneCheckProps = {
  onClose: () => void;
  data?: UploadFileCardData;
  /** Tab danh sách đã check → gọi API `/upload-phone-number/data` khi tải chi tiết. */
  listSource?: DrawerListSource;
};

export default function DrawerMenuPhoneCheck({
  onClose,
  data,
  listSource = "upload",
}: DrawerMenuPhoneCheckProps) {
  const isMobile = useIsMobile(768);
  const [selectedRecord, setSelectedRecord] =
    useState<UploadPhoneRecord | null>(null);
  const [searchPhone, setSearchPhone] = useState("");
  const [debouncedSearchPhone, setDebouncedSearchPhone] = useState("");
  const [validOnly, setValidOnly] = useState<"all" | "true" | "false">("all");

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearchPhone(searchPhone);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchPhone]);

  const trimmedDebounced = debouncedSearchPhone.trim();
  const debouncedDigitCount = countDigits(trimmedDebounced);
  /** Chỉ gửi lên API khi đủ 3 chữ số hoặc ô trống (xem toàn bộ danh sách). */
  const phoneForQuery =
    trimmedDebounced === ""
      ? ""
      : debouncedDigitCount >= 3
        ? trimmedDebounced
        : "";

  const searchTooShort = searchPhone.length > 0 && searchPhone.length < 3;

  const scrollParams = useMemo(
    () => ({
      file_code: data?.file_code || "",
      phone: phoneForQuery,
      valid_only:
        validOnly === "all" ? undefined : validOnly === "true" ? true : false,
    }),
    [data?.file_code, phoneForQuery, validOnly],
  );

  const scrollEnabled = Boolean(data?.file_code);
  const useCheckedDataApi = listSource === "checked-data";

  const uploadScroll = useListCheckPhoneNumberScroll(scrollParams, {
    enabled: scrollEnabled && !useCheckedDataApi,
  });
  const checkedDataScroll = useListCheckedPhoneNumberDataScroll(scrollParams, {
    enabled: scrollEnabled && useCheckedDataApi,
  });

  const {
    data: phoneListResponse,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isFetched,
    fetchNextPage,
    isError,
  } = useCheckedDataApi ? checkedDataScroll : uploadScroll;

  /**
   * flatten toàn bộ pages
   */
  const phoneRecordsFromApi: UploadPhoneRecord[] = useMemo(() => {
    return (phoneListResponse?.pages ?? []).flatMap((page: any) => {
      const payload = page?.data?.data ?? page?.data ?? {};

      return payload?.items ?? payload?.records ?? payload?.data ?? [];
    });
  }, [phoneListResponse]);

  /**
   * Chỉ dùng preview `data.records` trước lần fetch đầu tiên.
   * Sau khi API đã trả về (kể cả items rỗng), luôn hiển thị đúng theo API — tránh
   * trường hợp tìm kiếm ra [] nhưng vẫn fallback sang bản ghi cũ trên card.
   */
  const phoneRecords: UploadPhoneRecord[] = useMemo(() => {
    if (isFetched) {
      return phoneRecordsFromApi;
    }
    if (isLoading || isFetching) {
      return phoneRecordsFromApi;
    }
    return Array.isArray(data?.records) ? data.records : [];
  }, [data?.records, isFetched, isFetching, isLoading, phoneRecordsFromApi]);

  const hasActivePhoneFilter = phoneForQuery.length > 0;
  const hasActiveListFilters = hasActivePhoneFilter || validOnly !== "all";

  /**
   * chống spam fetch khi scroll
   */
  const handleScroll = useCallback(
    async (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;

      if (!hasNextPage || isFetchingNextPage) return;

      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      /**
       * preload sớm hơn để mượt
       */
      if (distanceFromBottom <= 120) {
        await fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const detailKey = data
    ? `${data.file_code}-${data.uploaded_at}-${data.original_filename}`
    : "empty-detail";

  const formatDateTime = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const drawerPanel = (
    <div
      className={`flex h-full min-h-0 w-full flex-col bg-white dark:bg-gray-900 ${
        isMobile ? "" : "border-l border-gray-200 dark:border-gray-800"
      } ${isMobile ? "" : "w-[600px]"}`}>
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4">
        <div className="min-w-0 pr-2">
          <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
            Danh sách số điện thoại
          </h2>
          {data?.original_filename && (
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {data.original_filename}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30">
          Đóng
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={detailKey}
              initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(1px)" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex min-h-0 flex-1 flex-col gap-4 text-sm">
              <div className="mb-3 grid shrink-0 grid-cols-1 gap-2 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/40">
                {/* Sử dụng w-full và gap để tạo khoảng cách giữa 2 phần tử */}
                <div className="flex w-full flex-col gap-3 py-2 sm:flex-row sm:items-end sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="drawer-search-phone"
                      className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                      Tìm theo số điện thoại (Nhập tối thiểu 3 số)
                    </label>
                    <input
                      id="drawer-search-phone"
                      type="text"
                      value={searchPhone}
                      onChange={(event) => {
                        setSearchPhone(digitsOnly(event.target.value));
                      }}
                      placeholder="Nhập số điện thoại..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="drawer-valid-only"
                      className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                      Lọc trạng thái hợp lệ
                    </label>
                    <select
                      id="drawer-valid-only"
                      value={validOnly}
                      onChange={(event) => {
                        setValidOnly(
                          event.target.value as "all" | "true" | "false",
                        );
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                      <option value="all">Tất cả</option>
                      <option value="true">Chỉ số hợp lệ</option>
                      <option value="false">Chỉ số không hợp lệ</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3 flex shrink-0 items-center justify-between">
                  {searchTooShort && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      Vui lòng nhập tối thiểu 3 chữ số.
                    </p>
                  )}
                </div>
              </div>

              {isLoading ? (
                <p className="shrink-0 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Đang tải danh sách số điện thoại...
                </p>
              ) : isError ? (
                <p className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-900/20 dark:text-red-400">
                  Có lỗi xảy ra khi tải dữ liệu.
                </p>
              ) : phoneRecords.length > 0 ? (
                <div
                  className="min-h-0 flex-1 overflow-auto rounded-lg border border-gray-100 dark:border-gray-800"
                  onScroll={handleScroll}>
                  <div className="min-w-0 overflow-x-auto">
                  <table className="min-w-[40rem] w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                      <tr className="text-left text-gray-500 dark:text-gray-300">
                        <th className="px-3 py-2 font-medium">Số</th>
                        <th className="px-3 py-2 font-medium">Nhà mạng</th>
                        <th className="px-3 py-2 font-medium">Loại</th>
                        <th className="px-3 py-2 font-medium">Định danh</th>
                        <th className="px-3 py-2 font-medium">Trạng thái</th>
                        <th className="px-3 py-2 font-medium">Hành động</th>
                      </tr>
                    </thead>

                    <tbody>
                      {phoneRecords.map((record) => (
                        <tr
                          key={`${record.file_code}-${record.index}-${record.phone_full}`}
                          className="border-t border-gray-100 text-gray-700 dark:border-gray-800 dark:text-gray-200">
                          <td className="px-3 py-2 font-mono">
                            {record.phone_full}
                          </td>

                          <td className="px-3 py-2">{record.provider_name}</td>

                          <td className="px-3 py-2">
                            {record.type_number_name}
                          </td>
                          <td className="px-3 py-2">
                            {record.brandname_name || "Chưa có"}
                          </td>

                          <td className="px-3 py-2">
                            {record.is_valid_candidate ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <BsCheckCircleFill className="text-[12px]" />
                                Hợp lệ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                                <BsXCircleFill className="text-[12px]" />
                                Không hợp lệ
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(record)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30">
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>

                  {isFetchingNextPage && (
                    <div className="border-t border-gray-100 px-3 py-3 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      Đang tải thêm dữ liệu...
                    </div>
                  )}

                  {!hasNextPage && phoneRecords.length > 0 && (
                    <div className="border-t border-gray-100 px-3 py-3 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
                      Đã tải toàn bộ dữ liệu
                    </div>
                  )}
                </div>
              ) : (
                <p className="shrink-0 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {hasActiveListFilters
                    ? hasActivePhoneFilter
                      ? "Không tìm thấy số điện thoại phù hợp với bộ lọc hiện tại."
                      : "Không có số nào khớp bộ lọc trạng thái hợp lệ."
                    : "Chưa có dữ liệu số điện thoại cho file này."}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
    </div>
  );

  const detailModal =
    typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedRecord && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className={`max-h-[85vh] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 ${
                    isMobile ? "max-w-full" : "max-w-2xl"
                  }`}>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        Chi tiết số điện thoại
                      </h3>

                      <p className="mt-1 text-sm font-mono text-gray-500 dark:text-gray-400">
                        {selectedRecord.phone_full || "--"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedRecord(null)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                      Đóng
                    </button>
                  </div>

                  {/* Body */}
                  <div className="max-h-[75vh] overflow-y-auto p-5">
                    {/* Status */}
                    <div
                      className={`mb-5 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        selectedRecord.is_valid_candidate
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-300"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300"
                      }`}>
                      {selectedRecord.is_valid_candidate ? (
                        <BsCheckCircleFill className="shrink-0 text-[14px]" />
                      ) : (
                        <BsXCircleFill className="shrink-0 text-[14px]" />
                      )}

                      <span>
                        {selectedRecord.is_valid_candidate
                          ? "Số hợp lệ"
                          : "Số không hợp lệ"}
                      </span>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        {
                          label: "File code",
                          value: selectedRecord.file_code,
                          mono: true,
                        },
                        {
                          label: "Tên file",
                          value: selectedRecord.original_filename,
                        },
                        {
                          label: "Ngày upload",
                          value: formatDateTime(selectedRecord.uploaded_at),
                        },
                        {
                          label: "Index",
                          value: selectedRecord.index,
                        },
                        {
                          label: "Raw",
                          value: selectedRecord.raw,
                          mono: true,
                        },
                        {
                          label: "Số đầy đủ",
                          value: selectedRecord.phone_full,
                          mono: true,
                        },
                        {
                          label: "9 số cuối",
                          value: selectedRecord.phone_last9,
                          mono: true,
                        },
                        {
                          label: "Nhà mạng",
                          value: selectedRecord.provider_name,
                        },
                        {
                          label: "Loại số",
                          value: selectedRecord.type_number_name,
                        },
                        {
                          label: "Số chuyển tiếp",
                          value: selectedRecord.forward_number || "--",
                          mono: true,
                        },
                        {
                          label: "Độ dài",
                          value: selectedRecord.length,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800">
                          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                            {item.label}
                          </p>

                          <p
                            className={`text-sm text-gray-900 dark:text-white ${
                              item.mono ? "font-mono" : ""
                            }`}>
                            {item.value || "--"}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Validation */}
                    <div className="mt-5 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Chi tiết lỗi
                        </h4>

                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedRecord.validation_errors?.length || 0} lỗi
                        </span>
                      </div>

                      {selectedRecord.validation_errors?.length ? (
                        <div className="space-y-2">
                          {selectedRecord.validation_errors.map(
                            (error, idx) => (
                              <div
                                key={`${error}-${idx}`}
                                className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                                <BsXCircleFill className="mt-0.5 shrink-0 text-[12px]" />
                                <span>{error}</span>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Không có lỗi.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        );

  if (isMobile) {
    if (typeof document === "undefined") return null;

    return createPortal(
      <AnimatePresence>
        <motion.div
          key="drawer-phone-check-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/40"
          onClick={onClose}
          aria-hidden
        />
        <motion.div
          key="drawer-phone-check-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-full flex-col shadow-xl sm:max-w-lg">
          {drawerPanel}
        </motion.div>
        {detailModal}
      </AnimatePresence>,
      document.body,
    );
  }

  return (
    <>
      <motion.aside
        initial={{ width: 0, opacity: 0, x: 12 }}
        animate={{ width: 600, opacity: 1, x: 0 }}
        exit={{ width: 0, opacity: 0, x: 12 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className="sticky top-20 h-[calc(100vh-6rem)] shrink-0 self-start overflow-hidden">
        {drawerPanel}
      </motion.aside>
      {detailModal}
    </>
  );
}
