import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { PencilIcon } from "../../icons";
import { RiDeleteBinLine } from "react-icons/ri";
import { useState } from "react";








interface Action<T> {
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  className?: string;
}

interface Props<T> {
  title: string;
  data?: T[];
  columns: {
    key: keyof T;
    label: string;
  }[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string | number) => void;
  actions?: Action<T>[];
  onCheck?: (selectedIds: (string | number)[]) => void;
}

const ReusableTable = <T extends { id: string | number }>({
  data = [],
  columns,
  onEdit,
  onDelete,
  actions = [],
  onCheck,
}: Props<T>) => {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const hasActionColumn = onEdit || onDelete || actions.length > 0;

  // ✅ Xử lý chọn/bỏ chọn tất cả
  const handleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
      onCheck?.([]);
    } else {
      const allIds = data.map((item) => item.id);
      setSelectedIds(allIds);
      onCheck?.(allIds);
    }
  };

  // ✅ Xử lý chọn/bỏ chọn từng hàng
  const handleSelectRow = (id: string | number) => {
    if (selectedIds.includes(id)) {
      const updatedSelection = selectedIds.filter(
        (selectedId) => selectedId !== id
      );
      setSelectedIds(updatedSelection);
      onCheck?.(updatedSelection);
    } else {
      const updatedSelection = [...selectedIds, id];
      setSelectedIds(updatedSelection);
      onCheck?.(updatedSelection);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            {/* Table Header */}
            <TableHeader>
              <TableRow>
                {/* ✅ Checkbox All */}
                <TableCell
                  isHeader
                  className="px-5 py-3 text-base font-semibold text-gray-500 text-start">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === data.length && data.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.key as string}
                    isHeader
                    className="px-5 py-3 text-base font-semibold text-gray-500 text-start">
                    {col.label}
                  </TableCell>
                ))}
                {hasActionColumn && (
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-base font-semibold text-gray-500 text-start">
                    Hành động
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  {/* ✅ Checkbox cho từng hàng */}
                  <TableCell className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                    />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key as string}
                      className="px-5 py-3 text-sm text-gray-500">
                      {item[col.key] as string}
                    </TableCell>
                  ))}
                  {hasActionColumn && (
                    <TableCell className="flex gap-2 px-5 py-3">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="bg-yellow-400 text-white px-4 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200">
                          <PencilIcon />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item.id)}
                          className="bg-red-400 text-white px-4 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200">
                          <RiDeleteBinLine />
                        </button>
                      )}
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => action.onClick(item)}
                          className={`px-4 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200 ${action.className}`}>
                          {action.icon}
                        </button>
                      ))}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ReusableTable;
