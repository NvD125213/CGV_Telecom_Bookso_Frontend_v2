import { useMemo, useState } from "react";
import { IoIosAdd } from "react-icons/io";
import { MdOutlineSyncAlt } from "react-icons/md";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ReusableTable from "../../components/common/ReusableTable";
import EmptyState from "../../components/EmptyData";
import { useTypeNumberTelcoMap } from "../../hooks/api-hooks/v3/useTypeNumberTelco";
import ModalActionTelco from "./ModalActionTelco";
import ModalTelcoBulk, { ReplaceTelcoTarget } from "./ModalTelcoBulk";

type ViewMode = "by_type" | "by_telco";

type TypeNumberTelcoMapRow = {
  id: number | string;
  primary: string;
  items: string[];
  count: number;
  type_id?: number;
  type_name?: string;
  telcos?: string[];
};

const BadgeList = ({ items }: { items: string[] }) => {
  if (!items.length) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {item}
        </span>
      ))}
    </div>
  );
};

const ListDataTable = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("by_type");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<ReplaceTelcoTarget | null>(
    null,
  );

  const {
    data: mapData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useTypeNumberTelcoMap();

  const rows = useMemo((): TypeNumberTelcoMapRow[] => {
    if (viewMode === "by_type") {
      return (mapData?.by_type ?? []).map((item) => {
        const typeName = item.type_name?.trim() || `ID: ${item.type_id}`;
        return {
          id: item.type_id,
          primary: typeName,
          items: item.telcos,
          count: item.telcos.length,
          type_id: item.type_id,
          type_name: typeName,
          telcos: item.telcos,
        };
      });
    }

    return (mapData?.by_telco ?? []).map((item) => ({
      id: item.telco,
      primary: item.telco,
      items: item.types,
      count: item.types.length,
    }));
  }, [mapData, viewMode]);

  const handleOpenReplace = (item: TypeNumberTelcoMapRow) => {
    if (!item.type_id) return;
    setReplaceTarget({
      type_id: item.type_id,
      type_name: item.type_name || item.primary,
      telcos: item.telcos ?? item.items,
    });
  };

  const columns = useMemo(() => {
    if (viewMode === "by_type") {
      return [
        { key: "primary", label: "Định dạng số" },
        {
          key: "items",
          label: "Telco",
          render: (item: TypeNumberTelcoMapRow) => ({
            text: <BadgeList items={item.items} />,
          }),
        },
        { key: "count", label: "Số nhà mạng" },
        // {
        //   key: "action",
        //   label: "Hành động",
        //   render: (item: TypeNumberTelcoMapRow) => ({
        //     text: (
        //       <button
        //         type="button"
        //         onClick={() => handleOpenReplace(item)}
        //         className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110">
        //         <MdOutlineSyncAlt className="h-4 w-4" />
        //         Thay đổi
        //       </button>
        //     ),
        //   }),
        // },
      ];
    }

    return [
      { key: "primary", label: "Telco" },
      {
        key: "items",
        label: "Định dạng số",
        render: (item: TypeNumberTelcoMapRow) => ({
          text: <BadgeList items={item.items} />,
        }),
      },
      { key: "count", label: "Số định dạng" },
    ];
  }, [viewMode]);

  const errorData = isError
    ? (error as Error)?.message || "Không thể tải map định dạng – Telco"
    : rows.length === 0 && !isLoading && !isFetching
      ? "Không có dữ liệu"
      : "";

  return (
    <>
      <PageBreadcrumb pageTitle="Định dạng – Telco" />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("by_type")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "by_type"
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            }`}>
            Theo định dạng
          </button>
          <button
            type="button"
            onClick={() => setViewMode("by_telco")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "by_telco"
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            }`}>
            Theo Telco
          </button>
        </div>

        {/* <button
          type="button"
          onClick={() => setOpenCreateModal(true)}
          className="flex shrink-0 items-center gap-2 self-end rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
          <IoIosAdd size={24} />
          Gán nhà mạng
        </button> */}
      </div>

      <ComponentCard>
        {rows.length === 0 && !isLoading && !isFetching ? (
          <EmptyState />
        ) : (
          <ReusableTable
            title={
              viewMode === "by_type"
                ? "Map theo định dạng số"
                : "Map theo nhà mạng"
            }
            data={rows}
            columns={columns}
            error={errorData}
            isLoading={isLoading || isFetching}
            showId={false}
            disabled
            disabledReset
          />
        )}
      </ComponentCard>

      <ModalActionTelco
        isOpen={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={() => refetch()}
      />

      <ModalTelcoBulk
        isOpen={Boolean(replaceTarget)}
        data={replaceTarget}
        onClose={() => setReplaceTarget(null)}
        onSuccess={() => refetch()}
      />
    </>
  );
};

export default ListDataTable;
