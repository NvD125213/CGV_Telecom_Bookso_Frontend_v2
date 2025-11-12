import { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode;
  className?: string;
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  align?: "left" | "center" | "right"; // 👈 thêm prop align
}
// Table Component
const Table: React.FC<TableProps> = ({ children, className }) => {
  return <table className={`min-w-full z-0 ${className}`}>{children}</table>;
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return <thead className={className}>{children}</thead>;
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={className}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return <tr className={className}>{children}</tr>;
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = "",
  colSpan,
  rowSpan,
  align = "left", // 👈 mặc định là left
}) => {
  const CellTag = isHeader ? "th" : "td";

  // Tạo class căn giữa
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
      ? "text-right"
      : "text-left";

  return (
    <CellTag
      className={`${alignClass} ${className}`}
      colSpan={colSpan}
      rowSpan={rowSpan}>
      {children}
    </CellTag>
  );
};
export { Table, TableHeader, TableBody, TableRow, TableCell };
