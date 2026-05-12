import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import { FaFileExcel } from "react-icons/fa";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useGetPhoneErrorDownload } from "../../hooks/api-hooks/v3/useCheckPhone";

export type PhoneErrorPreviewSheet = {
  name: string;
  rows: string[][];
};

/** Cột Excel: A, B, … Z, AA, … (index 0 → A). */
function excelColumnLabel(zeroBasedIndex: number): string {
  let n = zeroBasedIndex + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

type ExcelLikeGridProps = {
  matrix: string[][];
};

/** Font / màu gần Excel for Windows (Calibri 11, lưới #d4d4d4, tiêu đề hàng/cột xám). */
const excelSurface =
  "rounded-sm bg-[#f5f5f5] p-px shadow-[inset_0_0_0_1px_#d9d9d9] dark:bg-[#121212] dark:shadow-[inset_0_0_0_1px_#404040]";

function ExcelLikeGrid({ matrix }: ExcelLikeGridProps) {
  const colCount = useMemo(
    () => Math.max(1, ...matrix.map((r) => r.length), matrix[0]?.length ?? 0),
    [matrix],
  );

  const padRow = useCallback(
    (cells: string[]) => {
      const next = [...cells];
      while (next.length < colCount) next.push("");
      return next;
    },
    [colCount],
  );

  if (matrix.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Sheet trống.
      </p>
    );
  }

  return (
    <div
      className={`max-h-[min(62vh,580px)] overflow-auto ${excelSurface}`}
      style={{ fontFamily: "'Segoe UI', Calibri, sans-serif" }}>
      <table
        className="w-max min-w-full border-collapse text-left"
        style={{ fontSize: "11px", lineHeight: "1.286" }}>
        <thead className="sticky top-0 z-[20]">
          <tr>
            {/* Ô góc — vùng tiêu đề hàng/cột Excel */}
            <th
              className="sticky left-0 z-[30] h-[22px] w-[46px] min-w-[46px] max-w-[46px] border border-[#d4d4d4] bg-[#f3f3f3] p-0 shadow-[2px_2px_5px_rgba(0,0,0,0.08)] dark:border-[#505050] dark:bg-[#2d2d2d] dark:shadow-[2px_2px_8px_rgba(0,0,0,0.45)]"
              aria-hidden
            />
            {Array.from({ length: colCount }, (_, ci) => (
              <th
                key={`col-${ci}`}
                className="h-[22px] min-w-[64px] border border-[#d4d4d4] bg-[#f3f3f3] px-2 py-0.5 text-center font-normal tracking-tight text-[#333333] shadow-[0_2px_5px_rgba(0,0,0,0.06)] dark:border-[#505050] dark:bg-[#2d2d2d] dark:text-[#e6e6e6] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                {excelColumnLabel(ci)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, ri) => (
            <tr key={`row-${ri}`} className="hover:bg-[#fafafa] dark:hover:bg-[#252526]">
              <td
                className="sticky left-0 z-[10] h-[19px] w-[46px] min-w-[46px] max-w-[46px] border border-[#d4d4d4] bg-[#f3f3f3] py-0.5 pr-1.5 text-right font-normal tabular-nums text-[#666666] shadow-[3px_0_6px_-1px_rgba(0,0,0,0.08)] dark:border-[#505050] dark:bg-[#2d2d2d] dark:text-[#b0b0b0] dark:shadow-[4px_0_10px_rgba(0,0,0,0.35)]">
                {ri + 1}
              </td>
              {padRow(
                Array.isArray(row) ? row.map((c) => String(c ?? "")) : [],
              ).map((cell, ci) => (
                <td
                  key={`c-${ri}-${ci}`}
                  className="h-[19px] min-w-[64px] max-w-[18rem] border border-[#d4d4d4] bg-white px-2 py-0.5 align-top text-[#222222] dark:border-[#404040] dark:bg-[#1e1e1e] dark:text-[#e8e8e8]">
                  <span className="block max-w-full whitespace-pre-wrap break-words">
                    {cell || "\u00a0"}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ModalDetailFileErrorExcelProps = {
  open: boolean;
  fileName: string | null;
  onClose: () => void;
};

export default function ModalDetailFileErrorExcel({
  open,
  fileName,
  onClose,
}: ModalDetailFileErrorExcelProps) {
  const effectiveName = open ? (fileName ?? "") : "";

  const {
    data: phoneErrorDownloadAxios,
    isLoading: isLoadingDownload,
    isError: isDownloadError,
  } = useGetPhoneErrorDownload(effectiveName, {
    enabled: open && !!fileName,
  });

  const blob = phoneErrorDownloadAxios?.data as Blob | undefined;

  const [sheets, setSheets] = useState<PhoneErrorPreviewSheet[]>([]);
  const [sheetTab, setSheetTab] = useState(0);
  const [parseError, setParseError] = useState(false);
  const [parsingXlsx, setParsingXlsx] = useState(false);

  useEffect(() => {
    if (!open || !fileName || !blob) {
      setSheets([]);
      setSheetTab(0);
      setParseError(false);
      setParsingXlsx(false);
      return;
    }

    let cancelled = false;
    setParseError(false);
    setParsingXlsx(true);

    (async () => {
      try {
        const buf = await blob.arrayBuffer();
        if (cancelled) return;

        const wb = XLSX.read(buf, { type: "array" });
        const next: PhoneErrorPreviewSheet[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const raw = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: "",
          }) as unknown[][];
          const rows = raw.map((row) =>
            Array.isArray(row) ? row.map((c) => String(c ?? "")) : [],
          );
          return { name, rows };
        });

        if (!cancelled) {
          setSheets(next);
          setSheetTab(0);
          setParseError(false);
        }
      } catch {
        if (!cancelled) {
          setSheets([]);
          setSheetTab(0);
          setParseError(true);
        }
      } finally {
        if (!cancelled) setParsingXlsx(false);
      }
    })();

    return () => {
      cancelled = true;
      setParsingXlsx(false);
    };
  }, [open, fileName, blob]);

  const handleDownload = useCallback(() => {
    if (!blob || !fileName) return;
    saveAs(blob, fileName);
  }, [blob, fileName]);

  const loading = isLoadingDownload || parsingXlsx;

  return (
    <Dialog
      open={open && !!fileName}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      aria-labelledby="modal-phone-error-excel-title">
      <DialogTitle
        id="modal-phone-error-excel-title"
        component="div"
        className="flex items-start justify-between gap-3 border-b border-gray-200 pr-2 pb-2 pt-3 dark:border-gray-700">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <FaFileExcel className="text-2xl" aria-hidden />
          </div>
          <span className="min-w-0 flex-1 truncate pt-1.5 text-base font-semibold text-gray-900 dark:text-white">
            {fileName ?? ""}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!blob || isLoadingDownload || isDownloadError}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            Tải xuống
          </button>
          <IconButton
            aria-label="Đóng"
            onClick={onClose}
            size="small"
            className="text-gray-600 dark:text-gray-300">
            <Close />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent dividers className="min-h-[240px]">
        {loading && (
          <div className="flex justify-center py-16">
            <CircularProgress size={36} />
          </div>
        )}

        {!loading && isDownloadError && (
          <p className="py-8 text-center text-sm text-red-600 dark:text-red-400">
            Không tải được file. Vui lòng thử lại.
          </p>
        )}

        {!loading && !isDownloadError && parseError && (
          <p className="py-8 text-center text-sm text-red-600 dark:text-red-400">
            Không đọc được nội dung Excel. Vẫn có thể tải file bằng nút Tải
            xuống.
          </p>
        )}

        {!loading && !isDownloadError && !parseError && sheets.length > 1 && (
          <Tabs
            value={sheetTab}
            onChange={(_e, v: number) => setSheetTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              minHeight: 36,
              bgcolor: "#ececec",
              borderRadius: "6px 6px 0 0",
              borderBottom: "1px solid #d4d4d4",
              "& .MuiTab-root": {
                textTransform: "none",
                minHeight: 36,
                fontSize: "12px",
                fontFamily: "'Segoe UI', Calibri, sans-serif",
                color: "#444",
              },
              "& .Mui-selected": {
                color: "#222",
                bgcolor: "#ffffff",
              },
              "& .MuiTabs-indicator": {
                height: 3,
                bgcolor: "#217346",
              },
            }}>
            {sheets.map((s, i) => (
              <Tab
                key={`err-sheet-${i}-${s.name}`}
                label={s.name || `Sheet ${i + 1}`}
              />
            ))}
          </Tabs>
        )}

        {!loading && !isDownloadError && !parseError && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50/80 px-3 py-2 dark:border-green-900/40 dark:bg-green-950/25">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-green-600 shadow-sm dark:bg-green-900/40 dark:text-green-400">
                <FaFileExcel className="text-xl" aria-hidden />
              </div>
              <p className="text-xs text-green-900 dark:text-green-100/90">
                Xem trước nội dung file Excel (chỉ đọc). Dùng{" "}
                <span className="font-semibold">Tải xuống</span> để lưu bản
                .xlsx.
              </p>
            </div>
            <ExcelLikeGrid matrix={sheets[sheetTab]?.rows ?? []} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
