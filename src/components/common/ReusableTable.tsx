import React, { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { PencilIcon } from "../../icons";
import { RiDeleteBinLine } from "react-icons/ri";
import { IoMdRefresh } from "react-icons/io";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useState } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  resetSelectedIds,
  setSelectedIds,
} from "../../store/selectedPhoneSlice";
import { IoEyeOutline } from "react-icons/io5";

interface Action<T> {
  icon?: React.ReactNode;
  label?: string;
  onClick: (item: T) => void;
  className?: string;
  condition?: (item: T) => boolean;
}

interface Props<T> {
  title: ReactNode;
  data?: T[];
  columns: {
    key: string;
    label: string;
    type?: string;
    classname?: string;
  }[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string | number) => void;
  onDetail?: (item: T) => void;
  actions?: Action<T>[];
  onCheck?: (selectedIds: (string | number)[], selectedRows: T[]) => void;
  selectedIds?: (string | number)[];
  setSelectedIds?: React.Dispatch<React.SetStateAction<number[]>>;
  isLoading: boolean;
  error?: string;
  role?: number;
  pagination?: {
    currentPage: number;
    pageSize: number;
  };
  showId?: boolean; // Renamed from showStt to showId for clarity
  disabled?: boolean; // Simple disabled prop
  disabledReset?: boolean;
  classname?: string;
}

const ReusableTable = <T extends { id: string | number; [key: string]: any }>({
  data = [],
  columns,
  onEdit,
  onDelete,
  onDetail,
  actions = [],
  onCheck,
  isLoading = false,
  error = "",
  showId = true,
  disabled = false, // Default to false
  disabledReset = false,
  classname,
}: Props<T>) => {
  const dispatch = useDispatch();
  const { selectedIds } = useSelector(
    (state: RootState) => state.selectedPhone
  );
  const [dropdownOpenId, setDropdownOpenId] = useState<string | number | null>(
    null
  );
  const hasActionColumn = onEdit || onDelete || onDetail || actions.length > 0;

  const handleSelectAll = () => {
    if (disabled) return; // Simply return if disabled

    if (data.every((item) => selectedIds.includes(item.id))) {
      dispatch(resetSelectedIds());
      onCheck?.([], []);
    } else {
      const allIds = data.map((item) => item.id);
      dispatch(setSelectedIds({ ids: allIds, rows: data }));
      onCheck?.(allIds, data);
    }
  };

  const handleSelectRow = (id: string | number) => {
    if (disabled) return; // Simply return if disabled

    let updatedSelection: (string | number)[];
    let updatedRows: T[];

    if (selectedIds.includes(id)) {
      updatedSelection = selectedIds.filter((selectedId) => selectedId !== id);
      updatedRows = data.filter((item) => updatedSelection.includes(item.id));
    } else {
      updatedSelection = [...selectedIds, id];
      updatedRows = data.filter((item) => updatedSelection.includes(item.id));
    }

    dispatch(setSelectedIds({ ids: updatedSelection, rows: updatedRows }));
    onCheck?.(updatedSelection, updatedRows);
  };

  const handleResetSelection = () => {
    if (selectedIds.length == 0) {
      alert("Không có số nào được chọn!");
    }
    dispatch(resetSelectedIds());
    onCheck?.([], []);
  };

  const toggleDropdown = (id: string | number) => {
    setDropdownOpenId(dropdownOpenId === id ? null : id);
  };
  const totalColumnCount = columns.length + 1 + (hasActionColumn ? 1 : 0);
  const isManyColumns = totalColumnCount > 8;

  return error ? (
    <div className="dark:text-white">{error}</div>
  ) : (
    <div
      className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black ${classname}`}>
      {disabledReset == false ? (
        <div className="flex justify-end px-4 py-2">
          <button
            onClick={handleResetSelection}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-800 bg-white text-black rounded-full text-sm hover:bg-red-600 hover:text-white transition-colors shadow-md"
            title="Reset selection">
            <IoMdRefresh className="w-4 h-4" />
            Reset ({selectedIds.length})
          </button>
        </div>
      ) : (
        <></>
      )}

      <div className="w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <div className="max-h-[800px] overflow-y-auto dark:bg-black min-w-[900px]">
            <Table className="dark:text-white">
              {/* Table Header */}
              <TableHeader>
                <TableRow>
                  {!disabled && (
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-base font-semibold text-gray-500 dark:text-gray-300 text-start">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="w-[18px] h-[18px]"
                          checked={
                            selectedIds?.length === data.length &&
                            data.length > 0
                          }
                          onChange={handleSelectAll}
                        />
                      </div>
                    </TableCell>
                  )}

                  {showId && (
                    <TableCell
                      isHeader
                      className={`px-5 ${
                        isManyColumns ? "text-[13px]" : "text-sm"
                      } dark:text-gray-300 py-3 text-base font-semibold text-gray-500 text-start`}>
                      ID
                    </TableCell>
                  )}
                  {columns.map((col, idx) => (
                    <TableCell
                      key={`${col.key}-${idx}`}
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
                      className={`px-5 flex justify-center ${
                        isManyColumns ? "text-[13px]" : "text-sm"
                      } dark:text-gray-300 py-3 text-base font-semibold text-gray-500 text-start`}>
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
                            baseColor="#e5e7eb"
                            highlightColor="#f3f4f6"
                            className="dark:[&_*]:bg-black dark:[&_*]:bg-opacity-30 dark:[&_*]:shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                          />
                        </TableCell>
                        {showId && (
                          <TableCell className="px-5 py-3">
                            <Skeleton
                              width={50}
                              height={18}
                              baseColor="#e5e7eb"
                              highlightColor="#f3f4f6"
                              className="dark:[&_*]:bg-black dark:[&_*]:bg-opacity-30 dark:[&_*]:shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                            />
                          </TableCell>
                        )}
                        {columns.map((col) => (
                          <TableCell
                            key={col.key}
                            className={`px-5 py-3 text-sm text-gray-500 dark:text-gray-300 ${
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
                            className={`flex gap-2 px-5 py-3 ${
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
                        {!disabled && (
                          <TableCell
                            className={`px-5 dark:text-gray-300 py-3 ${
                              isManyColumns ? "text-[13px]" : "text-sm"
                            }`}>
                            <input
                              type="checkbox"
                              className={`w-[18px] h-[18px] ${
                                disabled ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              checked={selectedIds?.includes(item.id)}
                              onChange={() => handleSelectRow(item.id)}
                              disabled={disabled}
                            />
                          </TableCell>
                        )}

                        {showId && (
                          <TableCell
                            className={`px-5 dark:text-gray-300 py-3 ${
                              isManyColumns ? "text-[13px]" : "text-sm"
                            }`}>
                            {item.id}
                          </TableCell>
                        )}
                        {columns.map((col) => {
                          const value = item[col.key];
                          const displayValue =
                            value === null ||
                            value === undefined ||
                            value === ""
                              ? "-"
                              : value;

                          return (
                            <TableCell
                              key={col.key}
                              className={`px-5 py-3 text-sm text-gray-500 dark:text-gray-300 ${
                                isManyColumns ? "text-[13px]" : "text-sm"
                              }`}>
                              {col.type === "button" ? (
                                <button className={col.classname}>
                                  {displayValue as string}
                                </button>
                              ) : col.type === "span" ? (
                                <span className={col.classname}>
                                  {displayValue as string}
                                </span>
                              ) : (
                                displayValue
                              )}
                            </TableCell>
                          );
                        })}
                        {hasActionColumn && (
                          <TableCell
                            align="center"
                            className={`px-5 py-3 items-center justify-center ${
                              isManyColumns ? "text-[13px]" : "text-sm"
                            }`}>
                            <div className="flex items-center justify-center gap-2">
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(item)}
                                  className="bg-yellow-400 text-white px-3 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200 flex items-center gap-2">
                                  <PencilIcon />
                                </button>
                              )}
                              {onDetail && (
                                <button
                                  onClick={() => onDetail(item)}
                                  className="bg-blue-400 text-white px-3 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200 flex items-center gap-2"
                                  title="Xem chi tiết">
                                  <IoEyeOutline className="w-3 h-3" />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(item.id)}
                                  className="bg-red-400 text-white px-3 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200 flex items-center gap-2">
                                  <RiDeleteBinLine />
                                </button>
                              )}
                              {actions.length > 0 && (
                                <div className="relative">
                                  <button
                                    onClick={() => toggleDropdown(item.id)}
                                    className="bg-gray-200 dark:bg-gray-800 dark:text-white text-gray-700 px-4 py-2 rounded-full text-sm hover:brightness-110 transition-all duration-200 dropdown-toggle">
                                    <HiDotsVertical />
                                  </button>
                                  <Dropdown
                                    isOpen={dropdownOpenId === item.id}
                                    onClose={() => setDropdownOpenId(null)}
                                    className="w-50">
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
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReusableTable;
