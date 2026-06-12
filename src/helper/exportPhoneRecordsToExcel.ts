import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { UploadPhoneRecord } from "../components/card/CardUpload";

export function buildPhoneListExportFilename(
  originalFilename?: string,
  fileCode?: string,
) {
  const base =
    originalFilename?.replace(/\.[^.]+$/, "") || fileCode || "danh_sach_so";
  return `${base}.xlsx`;
}

export function exportPhoneRecordsToExcel(
  records: UploadPhoneRecord[],
  filename: string,
) {
  if (!records.length) return;

  const rows = records.map((record) => ({
    STT: record.index,
    "Số điện thoại": record.phone_full,
    Raw: record.raw,
    "9 số cuối": record.phone_last9,
    "Nhà mạng": record.provider_name,
    "Loại số": record.type_number_name,
    "Định danh": record.brandname_name || "",
    "Số chuyển tiếp": record.forward_number || "",
    "Trạng thái": record.is_valid_candidate ? "Hợp lệ" : "Không hợp lệ",
    "Chi tiết lỗi": (record.validation_errors || []).join("; "),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename);
}
