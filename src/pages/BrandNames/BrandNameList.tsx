import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { IoIosAdd } from "react-icons/io";
import { useEffect, useState, useMemo } from "react";
import {
  IBrandName,
  formatSaleNames,
  IBrandNameListParams,
  formatBrandNameDateTime,
} from "../../types/brandName";
import { BrandNameActionModal } from "./BrandNameActionModal";
import ModalSwalAction from "../../hooks/useModalSwal";
import ReusableTable from "../../components/common/ReusableTable";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import TableMobile from "../../mobiles/TableMobile";
import { useScreenSize } from "../../hooks/useScreenSize";
import Pagination from "../../components/pagination/pagination";
import { LabelValueItem, ActionButton } from "../../mobiles/TableMobile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useDebounce } from "../../hooks/useDebounce";
import Select from "../../components/form/Select";
import { buildSaleFilterOptions } from "./customerOptions";
import { users } from "../../constants/user";
import {
  useBrandNameList,
  useDeleteBrandName,
} from "../../hooks/api-hooks/v3/useBrandname";
import EmptyState from "../../components/EmptyData";
import { useSearchParams } from "react-router";

type BrandNameTableRow = IBrandName & {
  sale_names_display: string;
  created_at_display: string;
  updated_at_display: string;
  expired_at: string;
};

const columns: { key: keyof BrandNameTableRow; label: string }[] = [
  { key: "name", label: "Tên định danh" },
  { key: "sale_names_display", label: "Sale" },
  { key: "description", label: "Mô tả" },
  { key: "created_by", label: "Người tạo" },
  { key: "updated_by", label: "Người cập nhật" },
  { key: "created_at_display", label: "Ngày tạo" },
  { key: "updated_at_display", label: "Ngày cập nhật" },
  { key: "expired_at", label: "Ngày hết hạn" },
];

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 10;

const parsePageFromSearchParams = (params: URLSearchParams) => {
  const page = Number(params.get("page"));
  if (page >= 1) return page;
  const legacyOffset = params.get("offset");
  if (legacyOffset != null) {
    const offset = Number(legacyOffset);
    if (offset >= 0) return offset + 1;
  }
  return DEFAULT_PAGE;
};

const parseSizeFromSearchParams = (params: URLSearchParams) => {
  const size = Number(params.get("size"));
  if (size >= 1) return size;
  const legacyLimit = Number(params.get("limit"));
  if (legacyLimit >= 1) return legacyLimit;
  return DEFAULT_SIZE;
};

const BrandNameList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<IBrandName | undefined>(
    undefined,
  );
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") || "",
  );
  const [saleFilter, setSaleFilter] = useState(
    () => searchParams.get("sale_name") || "",
  );
  const [errorData, setErrorData] = useState("");
  const [page, setPage] = useState(() =>
    parsePageFromSearchParams(searchParams),
  );
  const [size, setSize] = useState(() =>
    parseSizeFromSearchParams(searchParams),
  );

  const debouncedSearch = useDebounce(searchInput, 400);
  const { isMobile } = useScreenSize();
  const user = useSelector((state: RootState) => state.auth?.user);
  const deleteBrandName = useDeleteBrandName();

  const listParams = useMemo((): Partial<IBrandNameListParams> => {
    const params: Partial<IBrandNameListParams> = {
      page,
      size,
      is_active: true,
    };
    const search = debouncedSearch.trim();
    const sale = saleFilter.trim();
    if (search) params.search = search;
    if (sale) params.sale_name = sale;
    return params;
  }, [page, size, debouncedSearch, saleFilter]);

  const {
    data: listData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useBrandNameList(listParams);

  const { brandNames, totalPages, totalResults } = useMemo(() => {
    const items = listData?.items ?? [];
    const rows: BrandNameTableRow[] = items.map((item) => ({
      ...item,
      sale_names_display: formatSaleNames(item.sale_names),
      created_at_display: formatBrandNameDateTime(item.created_at),
      updated_at_display: formatBrandNameDateTime(item.updated_at),
      expired_at: formatBrandNameDateTime(item.expired_at),
    }));
    return {
      brandNames: rows,
      totalPages: Math.max(1, listData?.meta.pages ?? 1),
      totalResults: listData?.meta.total ?? 0,
    };
  }, [listData]);

  const saleFilterOptions = useMemo(() => {
    const fromApi = new Set<string>();
    (listData?.items ?? []).forEach((item) =>
      item.sale_names?.forEach((name) => fromApi.add(name)),
    );
    users.forEach((name) => fromApi.add(name));
    return buildSaleFilterOptions(Array.from(fromApi).sort());
  }, [listData]);

  useEffect(() => {
    if (!searchParams.get("page") || !searchParams.get("size")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!next.get("page")) next.set("page", String(DEFAULT_PAGE));
          if (!next.get("size")) next.set("size", String(DEFAULT_SIZE));
          next.delete("limit");
          next.delete("offset");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearch, saleFilter]);

  useEffect(() => {
    const next = new URLSearchParams();
    next.set("page", String(page));
    next.set("size", String(size));
    const search = debouncedSearch.trim();
    if (search) next.set("search", search);
    else next.delete("search");
    const sale = saleFilter.trim();
    if (sale) next.set("sale_name", sale);
    else next.delete("sale_name");

    if (searchParams.toString() === next.toString()) return;

    setSearchParams(next, { replace: true });
  }, [debouncedSearch, saleFilter, page, size, searchParams, setSearchParams]);

  useEffect(() => {
    if (isLoading) {
      setErrorData("");
      return;
    }
    if (isError) {
      setErrorData(
        (error as Error)?.message || "Không thể tải danh sách định danh",
      );
      return;
    }
    setErrorData(
      brandNames.length > 0
        ? ""
        : totalResults === 0
          ? "Không có dữ liệu"
          : "Không có dữ liệu trên trang này",
    );
  }, [isLoading, isError, error, brandNames.length, totalResults]);

  const handleDelete = async (id: string) => {
    await ModalSwalAction({
      mode: "delete",
      title: "brandname",
      action: async () => deleteBrandName.mutateAsync(Number(id)),
      onSuccess: () => refetch(),
    });
  };

  const paginationOffset = page - 1;

  const handlePageChange = (newSize: number, newOffset: number) => {
    setSize(newSize);
    setPage(newOffset + 1);
  };

  const handleLimitChange = (newSize: number) => {
    setSize(newSize);
    setPage(DEFAULT_PAGE);
  };

  const handleSaleFilterChange = (value: string) => {
    setSaleFilter(value);
    setPage(DEFAULT_PAGE);
  };

  const convertToMobileData = (): LabelValueItem[][] => {
    return brandNames.map((item) => [
      {
        label: "Mã brandname",
        value: item.id,
        fieldName: "id",
        hidden: true,
      },
      {
        label: "Tên định danh",
        value: item.name,
        fieldName: "name",
        hideLabel: true,
      },
      {
        label: "Sale",
        value: formatSaleNames(item.sale_names),
        fieldName: "sale_names",
      },
      {
        label: "Mô tả",
        value: item.description || "Không có",
        fieldName: "description",
      },
      {
        label: "Người tạo",
        value: item.created_by || "Không có",
        fieldName: "created_by",
      },
      {
        label: "Người cập nhật",
        value: item.updated_by || "Không có",
        fieldName: "updated_by",
      },
      {
        label: "Ngày tạo",
        value: item.created_at_display,
        fieldName: "created_at",
      },
      {
        label: "Ngày cập nhật",
        value: item.updated_at_display,
        fieldName: "updated_at",
      },
    ]);
  };

  const actions: ActionButton[] = [
    {
      icon: <EditIcon />,
      label: "Chỉnh sửa",
      onClick: (id: string) => {
        const brand = brandNames.find((b) => String(b.id) === String(id));
        if (brand) {
          setSelectedBrand(brand);
          setOpenModal(true);
        }
      },
      color: "primary",
    },
    {
      icon: <DeleteIcon />,
      label: "Xóa",
      onClick: (id: string) => {
        handleDelete(id);
      },
      color: "error",
    },
  ];

  const showPagination = totalResults > 0 && totalPages >= 1;

  const searchBlock = (
    <div className="mb-4 w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="brandname-search">Tìm kiếm định danh</Label>
          <Input
            id="brandname-search"
            type="text"
            placeholder="Nhập tên định danh..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="brandname-sale-filter">Tìm kiếm sale</Label>
          <Select
            options={saleFilterOptions}
            value={saleFilter}
            placeholder="Tất cả sale"
            onChange={handleSaleFilterChange}
            className="dark:bg-black dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? null : <PageBreadcrumb pageTitle="Tên định danh" />}
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-end sm:justify-end">
        <button
          onClick={() => {
            setSelectedBrand(undefined);
            setOpenModal(true);
          }}
          className="flex shrink-0 items-center gap-2 self-end rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
          <IoIosAdd size={24} />
          Thêm
        </button>
      </div>
      <div className="space-y-6">
        {isMobile ? (
          <div className="space-y-4">
            {searchBlock}
            <TableMobile
              pageTitle="Brandname"
              disabledReset={true}
              data={convertToMobileData()}
              actions={actions}
              showAllData={true}
              hidePagination={true}
              useTailwindStyling={true}
              hideCheckbox={true}
              labelClassNames={{
                "Tên định danh": `
                  text-[18px] font-extrabold uppercase
                `,
              }}
              valueClassNames={{
                "Tên định danh": `
                    text-base font-semibold 
                    bg-blue-50 text-blue-800
                    dark:bg-blue-900 dark:text-blue-100
                    px-4 py-2
                    rounded-lg
                    border border-blue-200 dark:border-blue-700
                    text-center
                    shadow-sm
                    whitespace-nowrap
                    font-sans
                `,
                Sale: `
                    justify-end text-sm
                  `,
                "Mô tả": `
                    justify-end text-sm
                  `,
                "Người tạo": `
                    justify-end text-sm
                  `,
                "Người cập nhật": `
                    justify-end text-sm
                  `,
                "Ngày tạo": `
                    justify-end text-sm
                  `,
                "Ngày cập nhật": `
                    justify-end text-sm
                  `,
              }}
            />
            {showPagination && (
              <div className="mt-4">
                <Pagination
                  limit={size}
                  offset={paginationOffset}
                  totalPages={totalPages}
                  totalResults={totalResults}
                  changeLimitOptions={[10, 20, 50]}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            )}
          </div>
        ) : (
          <ComponentCard>
            {searchBlock}
            {brandNames.length === 0 && <EmptyState />}
            {brandNames.length > 0 && (
              <ReusableTable
                error={errorData}
                disabledReset={true}
                disabled={true}
                showId={false}
                role={user.role}
                title="Danh sách định danh"
                data={brandNames}
                columns={columns}
                onEdit={(item) => {
                  setSelectedBrand(item as IBrandName);
                  setOpenModal(true);
                }}
                isLoading={isLoading || isFetching}
                onDelete={(id) => handleDelete(String(id))}
              />
            )}
            {showPagination && (
              <div className="mt-4 px-2 pb-2">
                <Pagination
                  limit={size}
                  offset={paginationOffset}
                  totalPages={totalPages}
                  totalResults={totalResults}
                  changeLimitOptions={[10, 20, 50]}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            )}
          </ComponentCard>
        )}
      </div>
      <BrandNameActionModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        data={selectedBrand}
        onSuccess={() => refetch()}
      />
    </>
  );
};

export default BrandNameList;
