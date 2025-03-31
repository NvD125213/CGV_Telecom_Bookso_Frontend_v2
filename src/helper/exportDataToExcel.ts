import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface DataItem {
  [key: string]: any;
}

/**
 * Xuất dữ liệu thành file Excel với dạng bảng tổng hợp.
 * @param data Mảng dữ liệu gốc
 * @param rowKey Trường dữ liệu để làm hàng dọc
 * @param colKey Trường dữ liệu để làm hàng ngang
 * @param title Tiêu đề file Excel (mặc định là "data_summary.xlsx")
 */
const exportPivotTableToExcel = (
  data: DataItem[],
  rowKey: string,
  colKey: string,
  title: string = "data_summary.xlsx"
) => {
  if (!data.length) {
    console.warn("Dữ liệu rỗng, không thể xuất file Excel.");
    return;
  }

  // 1. Tổng hợp dữ liệu
  const pivotData: Record<string, Record<string, number>> = {};

  data.forEach((item) => {
    const rowValue = item[rowKey];
    const colValue = item[colKey];

    if (!pivotData[rowValue]) {
      pivotData[rowValue] = {};
    }
    if (!pivotData[rowValue][colValue]) {
      pivotData[rowValue][colValue] = 0;
    }
    pivotData[rowValue][colValue] += 1;
  });

  // 2. Lấy danh sách tất cả các giá trị cột
  const colValues = Array.from(new Set(data.map((d) => d[colKey])));

  // 3. Chuyển đổi thành mảng 2D để tạo Excel
  const excelData = [
    [`${rowKey} / ${colKey}`, ...colValues], // Tiêu đề
    ...Object.entries(pivotData).map(([row, cols]) => [
      row,
      ...colValues.map((col) => cols[col] || 0),
    ]),
  ];

  // 4. Tạo worksheet và workbook
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Summary");

  // 5. Xuất file Excel
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, title);
};

export default exportPivotTableToExcel;
