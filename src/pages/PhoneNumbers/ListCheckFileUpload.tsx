import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { UploadFileCardData } from "../../components/card/CardUpload";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CardUpload from "../../components/card/CardUpload";
import DrawerMenuPhoneCheck from "../../components/drawer/drawerMenuPhoneCheck";
import {
  useListCheckPhoneNumber,
  useListCheckedPhoneNumberData,
  useUploadCheckPhoneNumber,
  useListPhoneErrors,
} from "../../hooks/api-hooks/v3/useCheckPhone";
import Pagination from "../../components/pagination/pagination";
import Swal from "sweetalert2";
import { Tab, Tabs } from "@mui/material";
import axios from "axios";
import ModalDetailFile from "../../components/modals/modalDetailFile";
import ModalDetailFileErrorExcel from "../../components/modals/modalDetailFileErrorExcel";
import CardError, {
  type PhoneErrorFileCardData,
} from "../../components/card/CardError";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Dòng lỗi khi API 400 `{ message: "Invalid data", errors: [...] }`. */
type UploadInvalidRowError = {
  row: number;
  phone: string;
  errors: string[];
};

/** Chuẩn hoá `detail` FastAPI / axios (string | mảng lỗi | object). */
function formatErrorDetail(detail: unknown): string {
  if (detail == null || detail === "") return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .filter(Boolean)
      .join("; ");
  }
  if (typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }
  return String(detail);
}

/**
 * Lấy mảng `errors` khi body là:
 * - `{ message: "Invalid data", errors: [...] }`, hoặc
 * - `{ detail: { message: "Invalid data", errors: [...] } }` (FastAPI / gateway bọc).
 */
function getInvalidDataErrorsArrayFromBody(data: unknown): unknown[] | null {
  if (!data || typeof data !== "object") return null;
  const o = data as { message?: unknown; errors?: unknown; detail?: unknown };

  if (o.message === "Invalid data" && Array.isArray(o.errors)) {
    return o.errors;
  }

  const detail = o.detail;
  if (detail && typeof detail === "object") {
    const inner = detail as { message?: unknown; errors?: unknown };
    if (inner.message === "Invalid data" && Array.isArray(inner.errors)) {
      return inner.errors;
    }
  }

  return null;
}

function parseUploadInvalidDataPayload(
  err: unknown,
): UploadInvalidRowError[] | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 400) return null;
  const list = getInvalidDataErrorsArrayFromBody(err.response?.data);
  if (!list) return null;

  const rows: UploadInvalidRowError[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as { row?: unknown; phone?: unknown; errors?: unknown };
    const row = Number(o.row);
    const phone = o.phone != null ? String(o.phone) : "";
    const errsRaw = o.errors;
    const errors = Array.isArray(errsRaw)
      ? errsRaw.map((e) => String(e)).filter(Boolean)
      : [];
    if (Number.isFinite(row)) {
      rows.push({ row, phone, errors });
    }
  }
  return rows.length > 0 ? rows : null;
}

function getUploadErrorMessage(err: unknown): string {
  const fallback = "Có lỗi xảy ra khi upload file.";
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : fallback;
  }

  const status = err.response?.status;
  const data = err.response?.data as
    | {
        message?: string;
        detail?: unknown;
        errors?: unknown;
      }
    | undefined;

  if (status === 400) {
    const invalidRows = getInvalidDataErrorsArrayFromBody(data);
    if (invalidRows) {
      const n = invalidRows.length;
      return n > 0
        ? `Dữ liệu không hợp lệ (${n} dòng trong file).`
        : "Dữ liệu không hợp lệ.";
    }

    const detail = data?.detail;
    if (typeof detail === "string") {
      const fromDetail = formatErrorDetail(detail);
      if (fromDetail) return fromDetail;
    } else if (detail != null && typeof detail !== "object") {
      const fromDetail = formatErrorDetail(detail);
      if (fromDetail) return fromDetail;
    }
  }

  const fromMessage =
    typeof data?.message === "string" && data.message ? data.message : "";
  const fromDetail = formatErrorDetail(data?.detail);
  if (fromDetail) return fromDetail;
  if (fromMessage) return fromMessage;
  if (err.message) return err.message;
  return fallback;
}

function mapGroupsToUploadFileList(
  response: { data?: { groups?: any[] } } | null | undefined,
): UploadFileCardData[] {
  const files = response?.data?.groups || [];
  return files.map((file: any) => ({
    file_code: file.file_code,
    original_filename: file.original_filename,
    uploaded_at: file.uploaded_at,
    uploaded_by: file.uploaded_by,
    total_records: file.total_records,
    valid_records: file.valid_records,
    invalid_records: file.invalid_records,

    records:
      file.records?.map((record: any) => ({
        file_code: record.file_code,
        original_filename: record.original_filename,
        uploaded_at: record.uploaded_at,

        raw: record.raw,
        phone_full: record.phone_full,
        phone_last9: record.phone_last9,

        provider_name: record.provider_name,
        type_number_name: record.type_number_name,

        forward_number: record.forward_number,
        length: record.length,

        is_valid_candidate: record.is_valid_candidate,
        validation_errors: record.validation_errors || [],

        index: record.index,

        provider_id: record.provider_id,
        type_number_id: record.type_number_id,
      })) || [],
  }));
}

export default function ListCheckFileUpload() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<
    UploadFileCardData | undefined
  >(undefined);
  const [searchPhone] = useState("");
  const [validOnly] = useState<"all" | "true">("all");

  const [mainTab, setMainTab] = useState(0);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [uploadInvalidRows, setUploadInvalidRows] = useState<
    UploadInvalidRowError[] | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [checkedDataOffset, setCheckedDataOffset] = useState(0);
  /** Offset trang (0-based), đồng bộ với `Pagination` — phân trang client cho danh sách file lỗi. */
  const [phoneErrorsOffset, setPhoneErrorsOffset] = useState(0);

  const [phoneErrorPreviewFile, setPhoneErrorPreviewFile] = useState<
    string | null
  >(null);

  const listQueryParams = useMemo(
    () => ({
      file_size: limit,
      file_page: offset + 1,
      phone: searchPhone.trim(),
      /** Chỉ gửi khi lọc "chỉ hợp lệ"; không gửi `valid_only=false` — backend có thể vẫn lọc. */
      ...(validOnly === "true" ? { valid_only: true } : {}),
    }),
    [limit, offset, searchPhone, validOnly],
  );

  const checkedListQueryParams = useMemo(
    () => ({
      file_size: limit,
      file_page: checkedDataOffset + 1,
      phone: searchPhone.trim(),
      ...(validOnly === "true" ? { valid_only: true } : {}),
    }),
    [limit, checkedDataOffset, searchPhone, validOnly],
  );

  const {
    data: fileListResponse,
    isLoading,
    isError,
  } = useListCheckPhoneNumber(listQueryParams, { enabled: mainTab === 0 });

  const {
    data: checkedFileListResponse,
    isLoading: isLoadingCheckedData,
    isError: isErrorCheckedData,
  } = useListCheckedPhoneNumberData(checkedListQueryParams, {
    enabled: mainTab === 1,
  });

  const {
    data: phoneErrorsResponse,
    isLoading: isLoadingPhoneErrors,
    isError: isErrorPhoneErrors,
  } = useListPhoneErrors(undefined, { enabled: mainTab === 2 });

  const { mutateAsync: uploadCheckFile, isPending: isUploading } =
    useUploadCheckPhoneNumber();

  const { phoneErrorsItemsAll, phoneErrorsTotal } = useMemo(() => {
    const payload = phoneErrorsResponse?.data as
      | { items?: PhoneErrorFileCardData[]; total?: number }
      | undefined;
    const items = payload?.items ?? [];
    const total = payload?.total ?? items.length;
    return { phoneErrorsItemsAll: items, phoneErrorsTotal: total };
  }, [phoneErrorsResponse?.data]);

  const phoneErrorsPageItems = useMemo(() => {
    const start = phoneErrorsOffset * limit;
    return phoneErrorsItemsAll.slice(start, start + limit);
  }, [phoneErrorsItemsAll, phoneErrorsOffset, limit]);

  const phoneErrorsTotalPages = Math.max(
    1,
    Math.ceil(phoneErrorsTotal / limit) || 1,
  );

  const fileList = useMemo(
    () => mapGroupsToUploadFileList(fileListResponse),
    [fileListResponse],
  );

  const checkedFileList = useMemo(
    () => mapGroupsToUploadFileList(checkedFileListResponse),
    [checkedFileListResponse],
  );

  const filePagination = fileListResponse?.data.meta?.files;
  const checkedFilePagination = checkedFileListResponse?.data.meta?.files;

  const resetUploadModal = useCallback(() => {
    setPendingUploadFile(null);
    setUploadInvalidRows(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleMainTabChange = useCallback(
    (_event: React.SyntheticEvent, value: number) => {
      if (isUploading && mainTab === 3 && value !== 3) return;
      if (value === 3 || mainTab === 3) {
        resetUploadModal();
      }
      setMainTab(value);
    },
    [isUploading, mainTab, resetUploadModal],
  );

  const leaveUploadTab = useCallback(() => {
    if (isUploading) return;
    setMainTab(0);
    resetUploadModal();
  }, [isUploading, resetUploadModal]);

  const handlePickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadInvalidRows(null);
    setPendingUploadFile(file);
  };

  const handleConfirmUpload = async () => {
    if (!pendingUploadFile) {
      Swal.fire({
        icon: "error",
        title: "Lỗi khi upload file",
        text: "Vui lòng chọn file trước khi xác nhận.",
      });
      return;
    }

    setUploadInvalidRows(null);

    try {
      await uploadCheckFile(pendingUploadFile);

      Swal.fire({
        icon: "success",
        title: "Upload file kiểm tra thành công.",
      });
      setMainTab(0);
      resetUploadModal();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("[Upload check-phone] Error info:", {
          code: err.code,
          status: err.response?.status,
          statusText: err.response?.statusText,
          message: err.message,
          data: err.response?.data,
        });
      } else {
        console.error("[Upload check-phone]", err);
      }

      const invalidParsed = parseUploadInvalidDataPayload(err);

      if (invalidParsed) {
        setUploadInvalidRows(invalidParsed);
        return;
      }

      setUploadInvalidRows(null);
      Swal.fire({
        icon: "error",
        title: "Lỗi khi upload file",
        text: getUploadErrorMessage(err),
      });
    }
  };
  return (
    <div>
      <div className="mb-4">
        <PageBreadcrumb pageTitle="Danh sách file đã upload" />
      </div>

      <Tabs
        value={mainTab}
        onChange={handleMainTabChange}
        variant="fullWidth"
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
        }}>
        <Tab
          label="Danh sách file chưa kiểm tra"
          disabled={isUploading && mainTab === 3}
          id="check-file-tab-list"
          aria-controls="check-file-panel-list"
        />
        <Tab
          label="Danh sách file đã kiểm tra"
          disabled={isUploading && mainTab === 3}
          id="check-file-tab-checked-data"
          aria-controls="check-file-panel-checked-data"
        />
        <Tab
          label="Danh sách file lỗi"
          disabled={isUploading && mainTab === 3}
          id="check-file-tab-phone-errors"
          aria-controls="check-file-panel-phone-errors"
        />

        <Tab
          label="Upload file kiểm tra"
          id="check-file-tab-upload"
          aria-controls="check-file-panel-upload"
        />
      </Tabs>

      <div
        id="check-file-panel-list"
        role="tabpanel"
        hidden={mainTab !== 0}
        aria-labelledby="check-file-tab-list">
        {mainTab === 0 && (
          <>
            {isLoading && (
              <div className="py-10 text-center text-sm text-gray-500">
                Đang tải dữ liệu...
              </div>
            )}

            {isError && (
              <div className="py-10 text-center text-sm text-red-500">
                Có lỗi xảy ra khi tải danh sách file
              </div>
            )}

            {!isLoading && !isError && (
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  {fileList.length === 0 ? (
                    <div className="rounded-xl h-full border border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900/40">
                      <svg
                        className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                        Chưa có file nào được upload
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Hãy chuyển sang tab Upload kiểm tra (tab cuối) để tải
                        file Excel hoặc CSV lên hệ thống.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {fileList.map((file, index) => (
                          <CardUpload
                            key={`${file.file_code}-${index}`}
                            data={file}
                            onDetail={(data) => {
                              setSelectedFile(data);
                              setOpenDrawer(true);
                            }}
                            onDeleted={(fileCode) => {
                              if (selectedFile?.file_code === fileCode) {
                                setOpenDrawer(false);
                                setSelectedFile(undefined);
                              }
                            }}
                          />
                        ))}
                      </div>

                      <div className="mt-6">
                        <Pagination
                          changeLimitOptions={[10, 20, 50]}
                          limit={limit}
                          offset={offset}
                          totalPages={filePagination?.pages || 1}
                          totalResults={filePagination?.total || 0}
                          onPageChange={(_limit, newOffset) => {
                            setOffset(newOffset);
                          }}
                          onLimitChange={(newLimit) => {
                            setLimit(newLimit);
                            setOffset(0);
                            setCheckedDataOffset(0);
                            setPhoneErrorsOffset(0);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <AnimatePresence initial={false} mode="wait">
                  {openDrawer && (
                    <DrawerMenuPhoneCheck
                      key="drawer-menu-phone-check"
                      onClose={() => setOpenDrawer(false)}
                      data={selectedFile}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      <div
        id="check-file-panel-checked-data"
        role="tabpanel"
        hidden={mainTab !== 1}
        aria-labelledby="check-file-tab-checked-data">
        {mainTab === 1 && (
          <>
            {isLoadingCheckedData && (
              <div className="py-10 text-center text-sm text-gray-500">
                Đang tải dữ liệu...
              </div>
            )}

            {isErrorCheckedData && (
              <div className="py-10 text-center text-sm text-red-500">
                Có lỗi xảy ra khi tải danh sách file đã check
              </div>
            )}

            {!isLoadingCheckedData && !isErrorCheckedData && (
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  {checkedFileList.length === 0 ? (
                    <div className="rounded-xl h-full border border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900/40">
                      <svg
                        className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                        Chưa có file đã check
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Dữ liệu sẽ hiển thị sau khi có file đã qua bước kiểm tra
                        trên hệ thống.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {checkedFileList.map((file, index) => (
                          <CardUpload
                            key={`checked-${file.file_code}-${index}`}
                            data={file}
                            onDetail={(data) => {
                              setSelectedFile(data);
                              setOpenDrawer(true);
                            }}
                            onDeleted={(fileCode) => {
                              if (selectedFile?.file_code === fileCode) {
                                setOpenDrawer(false);
                                setSelectedFile(undefined);
                              }
                            }}
                          />
                        ))}
                      </div>

                      <div className="mt-6">
                        <Pagination
                          changeLimitOptions={[10, 20, 50]}
                          limit={limit}
                          offset={checkedDataOffset}
                          totalPages={checkedFilePagination?.pages || 1}
                          totalResults={checkedFilePagination?.total || 0}
                          onPageChange={(_limit, newOffset) => {
                            setCheckedDataOffset(newOffset);
                          }}
                          onLimitChange={(newLimit) => {
                            setLimit(newLimit);
                            setOffset(0);
                            setCheckedDataOffset(0);
                            setPhoneErrorsOffset(0);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <AnimatePresence initial={false} mode="wait">
                  {openDrawer && (
                    <DrawerMenuPhoneCheck
                      key="drawer-menu-phone-check-checked"
                      listSource="checked-data"
                      onClose={() => setOpenDrawer(false)}
                      data={selectedFile}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      <div
        id="check-file-panel-phone-errors"
        role="tabpanel"
        hidden={mainTab !== 2}
        aria-labelledby="check-file-tab-phone-errors">
        {mainTab === 2 && (
          <>
            {isLoadingPhoneErrors && (
              <div className="py-10 text-center text-sm text-gray-500">
                Đang tải dữ liệu...
              </div>
            )}

            {isErrorPhoneErrors && (
              <div className="py-10 text-center text-sm text-red-500">
                Có lỗi xảy ra khi tải danh sách file lỗi
              </div>
            )}

            {!isLoadingPhoneErrors && !isErrorPhoneErrors && (
              <div className="min-w-0 flex-1">
                {phoneErrorsItemsAll.length === 0 ? (
                  <div className="rounded-xl h-full border border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900/40">
                    <svg
                      className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                      Chưa có file lỗi
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Các file export lỗi (nếu có) sẽ hiển thị tại đây.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {phoneErrorsPageItems.map((row) => (
                        <CardError
                          key={row.file_name}
                          data={row}
                          onViewDetail={(item) =>
                            setPhoneErrorPreviewFile(item.file_name)
                          }
                        />
                      ))}
                    </div>

                    <div className="mt-6">
                      <Pagination
                        changeLimitOptions={[10, 20, 50]}
                        limit={limit}
                        offset={phoneErrorsOffset}
                        totalPages={phoneErrorsTotalPages}
                        totalResults={phoneErrorsTotal}
                        onPageChange={(_l, newOffset) => {
                          setPhoneErrorsOffset(newOffset);
                        }}
                        onLimitChange={(newLimit) => {
                          setLimit(newLimit);
                          setOffset(0);
                          setCheckedDataOffset(0);
                          setPhoneErrorsOffset(0);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div
        id="check-file-panel-upload"
        role="tabpanel"
        hidden={mainTab !== 3}
        aria-labelledby="check-file-tab-upload">
        {mainTab === 3 && (
          <div
            className={`mx-auto mt-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-8 w-full`}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
              <div>
                <h3
                  id="upload-check-panel-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upload file kiểm tra số
                </h3>
                <p
                  id="upload-check-panel-desc"
                  className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Chọn file từ máy, kiểm tra thông tin rồi bấm Xác nhận để gửi
                  lên server.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={handlePickFile}
              />

              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm font-medium text-gray-600 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 dark:hover:text-blue-300">
                {pendingUploadFile
                  ? "Đổi file khác"
                  : "Chọn file (Excel / CSV…)"}
              </button>

              {pendingUploadFile && (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800/80">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pendingUploadFile.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Dung lượng: {formatFileSize(pendingUploadFile.size)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isUploading}
                onClick={leaveUploadTab}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                Hủy
              </button>
              <button
                type="button"
                disabled={!pendingUploadFile || isUploading}
                onClick={handleConfirmUpload}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isUploading ? "Đang upload…" : "Xác nhận"}
              </button>
            </div>
          </div>
        )}
      </div>

      <ModalDetailFile
        open={Boolean(uploadInvalidRows && uploadInvalidRows.length > 0)}
        onClose={() => setUploadInvalidRows(null)}
        rows={uploadInvalidRows ?? []}
      />

      <ModalDetailFileErrorExcel
        open={!!phoneErrorPreviewFile}
        fileName={phoneErrorPreviewFile}
        onClose={() => setPhoneErrorPreviewFile(null)}
      />
    </div>
  );
}
