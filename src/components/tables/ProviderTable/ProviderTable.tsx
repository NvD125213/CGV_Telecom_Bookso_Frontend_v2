import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { initialData } from "../../DataApi/provider";
import { sortAndAddIndex } from "../../../helper/countQuantity";
import { PencilIcon } from "../../../icons";
import { RiDeleteBinLine } from "react-icons/ri";

export default function ProviderTable() {
  const sortedTableData = sortAndAddIndex(initialData);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs--line-height dark:text-gray-400">
                    STT
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-l--line-height dark:text-gray-400">
                    Nhà cung cấp
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs--line-height dark:text-gray-400">
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {sortedTableData.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {provider.stt}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {provider.name}
                    </TableCell>
                    <TableCell className="flex px-5 py-3 gap-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <button
                        className="
                        bg-gradient-to-r from-yellow-400 to-amber-500
                        text-white font-bold py-2 px-6 rounded-full
                        shadow-[0_2px_6px_rgba(255,193,7,0.3)]
                        hover:shadow-[0_3px_8px_rgba(255,193,7,0.4)]
                        hover:brightness-110
                        transition-all duration-200 ease-out
                      ">
                        <PencilIcon />
                      </button>
                      <button
                        className="
                        bg-gradient-to-r from-red-400 to-red-600
                        text-white font-bold py-2 px-6 rounded-full
                        shadow-[0_2px_6px_rgba(239,68,68,0.3)]
                        hover:shadow-[0_3px_8px_rgba(239,68,68,0.4)]
                        hover:brightness-110
                        transition-all duration-200 ease-out
                      ">
                        <RiDeleteBinLine />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
