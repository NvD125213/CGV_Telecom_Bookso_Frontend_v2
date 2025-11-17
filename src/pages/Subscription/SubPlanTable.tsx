import { Edit } from "@mui/icons-material";
import { useState } from "react";
import { BsTrash2 } from "react-icons/bs";
import { motion } from "framer-motion";
import React from "react";

interface StatusConfigItem {
  bg: string;
  text: string;
  label: string;
}

const statusConfig = {
  active: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "active",
  },
  deleted: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-400",
    label: "deleted",
  },
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "pending",
  },
} satisfies Record<string, StatusConfigItem>;

export type StatusKey = keyof typeof statusConfig;

export const StatusBadge = React.memo(({ status }: { status: number }) => {
  // Map số sang key string
  const statusMap: Record<number, StatusKey> = {
    1: "active",
    2: "pending",
    0: "deleted",
  };

  const config = statusConfig[statusMap[status]] ?? statusConfig.deleted;

  return (
    <span
      className={`inline-flex items-center rounded-2xl px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
});

// Skeleton
export const SubPlanSkeleton = () => (
  <div className="animate-pulse w-full p-4 space-y-2">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between py-2.5 px-3 border-b border-gray-200 dark:border-gray-700">
        <div className="h-4 flex-1 bg-gray-300 dark:bg-gray-700 rounded mr-3"></div>
        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    ))}
  </div>
);

export const SubPlanRow = React.memo(
  ({ sub, onEdit, onDelete, isHovered, setHoveredRow }: any) => {
    return (
      <motion.tr
        layout
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        onMouseEnter={() => setHoveredRow(sub.id)}
        onMouseLeave={() => setHoveredRow(null)}
        className={`border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 ${
          isHovered ? "dark:bg-gray-800/40 bg-gray-50" : ""
        }`}>
        {/* Name + Icon - Wider column */}
        <td className="py-2.5 px-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-semibold">
              {sub.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {sub.name}
            </span>
          </div>
        </td>

        {/* Status */}
        <td className="py-2.5 px-3 w-32 text-center">
          <StatusBadge status={sub.status} />
        </td>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <td className="py-2.5 px-3 w-24 flex-shrink-0">
            <div className="flex gap-1 justify-end">
              {onEdit && (
                <button
                  onClick={() => onEdit(sub)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(sub.id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <BsTrash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              )}
            </div>
          </td>
        )}
      </motion.tr>
    );
  }
);

export const SubPlanTable = ({
  subPlans,
  isLoading,
  onEdit,
  onDelete,
}: any) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  return (
    <div className="flex flex-col items-center gap-3 mt-4 max-w-[1200px]">
      <div className="w-full bg-white dark:bg-gray-900 dark:border-gray-800 overflow-hidden p-3">
        {isLoading ? (
          <SubPlanSkeleton />
        ) : (
          <table className="text-sm w-[80%] table-auto">
            <tbody>
              {subPlans.map((sub: any, index: number) => (
                <SubPlanRow
                  key={`${sub.id}-${index}`}
                  sub={sub}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isHovered={hoveredRow === sub.id}
                  setHoveredRow={setHoveredRow}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
