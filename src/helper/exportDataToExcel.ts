import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

interface DataItem {
  [key: string]: any;
}

const exportPivotTableToExcel = (
  data: DataItem[],
  rowKey: string,
  colKey: string,
  title: string = "data_summary.xlsx",
  titleContent: string = "BẢNG TỔNG HỢP",
  titleFirst: string = "Nội dung"
) => {
  if (!data.length) {
    console.warn("Dữ liệu rỗng, không thể xuất file Excel.");
    return;
  }

  const pivotData: Record<string, Record<string, number>> = {};
  data.forEach((item) => {
    const rowValue = item[rowKey];
    const colValue = item[colKey];
    if (!pivotData[rowValue]) pivotData[rowValue] = {};
    if (!pivotData[rowValue][colValue]) pivotData[rowValue][colValue] = 0;
    pivotData[rowValue][colValue] += 1;
  });

  const colValues = Array.from(new Set(data.map((d) => d[colKey])));
  const excelData: (string | number | Partial<XLSX.CellObject>)[][] = [];

  // Header title
  excelData.push([
    {
      v: titleContent,
      s: {
        font: { bold: true, sz: 14 },
      },
    },
  ]);

  // Header row
  excelData.push([
    { v: titleFirst, s: { font: { bold: true }, border: borderAll } },
    ...colValues.map((col) => ({
      v: col,
      s: {
        font: { bold: true },
        border: borderAll,
      },
    })),
    {
      v: "Tổng",
      s: {
        font: { bold: true },
        border: borderAll,
      },
    },
  ]);

  // Data rows
  Object.entries(pivotData).forEach(([row, cols]) => {
    const rowData = colValues.map((col) => ({
      v: cols[col] || 0,
      s: { border: borderAll },
    }));
    const rowTotal = rowData.reduce((sum, val) => sum + (val.v as number), 0);
    excelData.push([
      { v: row, s: { border: borderAll } },
      ...rowData,
      {
        v: rowTotal,
        s: {
          font: { bold: true },
          border: borderAll,
        },
      },
    ]);
  });

  // Column totals
  const columnTotals = colValues.map((col) =>
    Object.values(pivotData).reduce((sum, row) => sum + (row[col] || 0), 0)
  );
  const grandTotal = columnTotals.reduce((sum, val) => sum + val, 0);
  excelData.push([
    {
      v: "Tổng",
      s: {
        font: { bold: true },
        border: borderAll,
      },
    },
    ...columnTotals.map((val) => ({
      v: val,
      s: { border: borderAll, font: { bold: true } },
    })),
    {
      v: grandTotal,
      s: {
        font: { bold: true },
        border: borderAll,
      },
    },
  ]);

  const ws = XLSX.utils.aoa_to_sheet(excelData);

  // Set column width
  ws["!cols"] = [
    { wch: 30 },
    ...colValues.map(() => ({ wch: 15 })),
    { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Summary");

  const excelBuffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, title);
};

// Border style định nghĩa sẵn
const borderAll = {
  top: { style: "medium", color: { rgb: "000000" } },
  bottom: { style: "medium", color: { rgb: "000000" } },
  left: { style: "medium", color: { rgb: "000000" } },
  right: { style: "medium", color: { rgb: "000000" } },
};

export default exportPivotTableToExcel;
