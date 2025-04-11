import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { PencilIcon } from "../../icons";
import { RiDeleteBinLine } from "react-icons/ri";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useState } from "react";
import { HiDotsVertical } from "react-icons/hi";

interface Action<T> {
  icon?: React.ReactNode;
  label?: string;
  onClick: (item: T) => void;
  className?: string;
  condition?: (item: T) => boolean;
}

interface Props<T> {
  title: string;
  data?: T[];
  columns: {
    key: keyof T;
    label: string;
    type?: string;
    classname?: string;
  }[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string | number) => void;
  actions?: Action<T>[];
  onCheck?: (selectedIds: (string | number)[], selectedRows: T[]) => void;
  selectedIds?: (string | number)[];
  setSelectedIds?: React.Dispatch<React.SetStateAction<number[]>>;
  isLoading: boolean;
  error?: string;
}

const ReusableTable = <T extends { id: string | number }>({
  data = [],
  columns,
  onEdit,
  onDelete,
  actions = [],
  onCheck,
  selectedIds,
  setSelectedIds,
  isLoading = false,
  error = "",
}: Props<T>) => {
  const [dropdownOpenId, setDropdownOpenId] = useState<string | number | null>(
    null
  );

  const hasActionColumn = onEdit || onDelete || actions.length > 0;

  const handleSelectAll = () => {
    if (!setSelectedIds) return;
    if (!selectedIds) return;

    if (data.every((item) => selectedIds.includes(item.id))) {
      setSelectedIds([]);
      onCheck?.([], []);
    } else {
      const allIds = data
        .map((item) => Number(item.id))
        .filter((id) => !isNaN(id));
      setSelectedIds(allIds);
      onCheck?.(allIds, data);
    }
  };

  const handleSelectRow = (id: string | number) => {
    if (!setSelectedIds) return;
    if (!selectedIds) return;

    let updatedSelection: (string | number)[];
    let updatedRows: T[];

    if (selectedIds.includes(id)) {
      updatedSelection = selectedIds.filter((selectedId) => selectedId !== id);
      updatedRows = data.filter((item) => updatedSelection.includes(item.id));
    } else {
      updatedSelection = [...selectedIds, id];
      updatedRows = data.filter((item) => updatedSelection.includes(item.id));
    }

    const numericIds = updatedSelection
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));
    setSelectedIds(numericIds);
    onCheck?.(updatedSelection, updatedRows);
  };

  const toggleDropdown = (id: string | number) => {
    setDropdownOpenId(dropdownOpenId === id ? null : id);
  };
  const totalColumnCount = columns.length + 1 + (hasActionColumn ? 1 : 0);
  const isManyColumns = totalColumnCount > 8;

  return error ? (
    <div className="dark:text-white">{error}</div>
  ) : (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="overflow-x-auto">
        <div className="max-h-[400px] overflow-y-auto dark:bg-black">
          <Table className="dark:text-white">
            {/* Table Header */}
            <TableHeader>
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-base font-semibold text-gray-500 dark:text-gray-300 text-start">
                  <input
                    type="checkbox"
                    className="w-[18px] h-[18px]"
                    checked={
                      selectedIds?.length === data.length && data.length > 0
                    }
                    onChange={handleSelectAll}
                    disabled={!setSelectedIds}
                  />
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.key as string}
                    isHeader
                    className={`px-5 ${
                      isManyColumns ? "text-[13px]" : "text-sm"
                    } dark:text-gray-300 py-3 text-base font-semibold text-gray-500 text-start`}>
                    {col.label}
                  </TableCell>
                ))}
                {hasActionColumn && (
                  <TableCell
                    isHeader
                    className={`px-5 ${
                      isManyColumns ? "text-[13px]" : "text-sm"
                    } dark:text-gray-300 py-3 text-base font-semibold 0 text-gray-500 ml-4 text-start`}>
                    Hành động
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="px-5 py-3">
                        <Skeleton
                          width={18}
                          height={18}
                          baseColor="#e5e7eb" // Light mode: xám nhạt
                          highlightColor="#f3f4f6" // Light mode: sáng hơn
                          className="dark:[&_*]:bg-black dark:[&_*]:bg-opacity-30 dark:[&_*]:shadow-[0_0_8px_rgba(255,255,255,0.1)]" // Dark mode: đen mờ + bóng
                        />
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell
                          key={col.key as string}
                          className={`px-5 py-3 text-sm text-gray-500 dark:text-gray-300  ${
                            isManyColumns ? "text-[13px]" : "text-sm"
                          }`}>
                          <Skeleton
                            width="100%"
                            height={28}
                            baseColor="#e5e7eb"
                            highlightColor="#f3f4f6"
                            className="dark:[&_*]:bg-black dark:[&_*]:bg-opacity-30 dark:[&_*]:shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                          />
                        </TableCell>
                      ))}
                      {hasActionColumn && (
                        <TableCell
                          className={`flex gap-2 px-5 py-3  ${
                            isManyColumns ? "text-[13px]" : "text-sm"
                          }`}>
                          <Skeleton
                            width={80}
                            height={32}
                            baseColor="#e5e7eb"
                            highlightColor="#f3f4f6"
                            className="dark:[&_*]:bg-black dark:[&_*]:bg-opacity-30 dark:[&_*]:shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                          />
                          <Skeleton
                            width={80}
                            height={32}
                            baseColor="#e5e7eb"
                            highlightColor="#f3f4f6"
                            className="dark:[&_*]:bg-black dark:[&_*]:bg-opacity-30 dark:[&_*]:shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                          />
                          <Skeleton
                            width={50}
                            height={32}
                            baseColor="#e5e7eb"
                            highlightColor="#f3f4f6"
                            className="dark:[&_*]:bg-black dark:[&_*]:bg-opacity-30 dark:[&_*]:shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                : data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell
                        className={`px-5 dark:text-gray-300 py-3  ${
                          isManyColumns ? "text-[13px]" : "text-sm"
                        }`}>
                        <input
                          type="checkbox"
                          className="w-[18px] h-[18px]"
                          checked={selectedIds?.includes(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          disabled={!setSelectedIds}
                        />
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell
                          key={col.key as string}
                          className={`px-5 py-3 text-sm text-gray-500 dark:text-gray-300 0 ${
                            isManyColumns ? "text-[13px]" : "text-sm 0"
                          }`}>
                          {col.type === "button" ? (
                            <button className={col.classname}>
                              {item[col.key] as string}
                            </button>
                          ) : col.type === "span" ? (
                            <span className={col.classname}>
                              {item[col.key] as string}
                            </span>
                          ) : (
                            (item[col.key] as string)
                          )}
                        </TableCell>
                      ))}
                      {hasActionColumn && (
                        <TableCell
                          className={`flex gap-2 px-5 py-3 items-center  ${
                            isManyColumns ? "text-[13px]" : "text-sm "
                          }`}>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="bg-yellow-400 text-white 0 px-3 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200 flex items-center gap-2">
                              <PencilIcon />
                              <span>Edit</span>
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item.id)}
                              className="bg-red-400 text-white px-3 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200 flex items-center gap-2 0">
                              <RiDeleteBinLine />
                              <span>Delete</span>
                            </button>
                          )}
                          {actions.length > 0 && (
                            <div className="">
                              <button
                                onClick={() => toggleDropdown(item.id)}
                                className="bg-gray-200 dark:bg-gray-800 dark:text-white text-gray-700 px-4 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200 dropdown-toggle ">
                                <HiDotsVertical />
                                <Dropdown
                                  isOpen={dropdownOpenId === item.id}
                                  onClose={() => setDropdownOpenId(null)}
                                  className="w-48">
                                  <div className="py-1">
                                    {actions
                                      .filter((action) =>
                                        action.condition
                                          ? action.condition(item)
                                          : true
                                      )
                                      .map((action, index) => (
                                        <button
                                          key={index}
                                          onClick={() => {
                                            action.onClick(item);
                                            setDropdownOpenId(null);
                                          }}
                                          className={`w-full dark:text-white dark:hover:bg-black dark:hover:bg-opacity-20 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-all duration-200 ${
                                            action.className || ""
                                          }`}>
                                          {action.icon}
                                          <span>
                                            {action.label || "Action"}
                                          </span>
                                        </button>
                                      ))}
                                  </div>
                                </Dropdown>
                              </button>
                            </div>
                          )}
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
