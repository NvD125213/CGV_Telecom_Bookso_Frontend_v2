import React, { useState, useEffect, ReactNode } from "react";
import {
  getPublicNumberVoiceGTel,
  getPublicNumberVPBX,
  DigitelDataType,
  GvoiceGtelDataType,
  VPBXDataType,
  ResponseType,
  RequestParamsType,
  GigaforeDataType,
  getPublicNumberGigafore,
} from "../../services/digital";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useQueryString } from "../../hooks/useQueryString";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import ReusableTable from "../../components/common/ReusableTable";
import Pagination from "../../components/pagination/pagination";
import Select from "../../components/form/Select";
import TableMobile, { LabelValueItem } from "../../mobiles/TableMobile";
import ResponsiveFilterWrapper from "../../components/common/FlipperWrapper";
import { useScreenSize } from "../../hooks/useScreenSize";

// Define types for different data sources
type DataSource = "gvoice" | "vpbx" | "gigafone";

const gvoiceColumns = (status: string) => {
  const columns: {
    key: keyof GvoiceGtelDataType;
    label: string;
    type?: string;
    classname?: string;
  }[] = [
    { key: "phone_number", label: "Số điện thoại" },
    { key: "number_type", label: "Loại số" },
    { key: "commitment_fee", label: "Phí cam kết" },
    { key: "subscription_fee", label: "Phí hàng tháng" },
    { key: "status", label: "Trạng thái" },
  ];
  if (status === "ListPublicDVGTGT.aspx") {
    return [
      ...columns,
      { key: "vtl_fee", label: "Giá tại Viettel" },
      { key: "vms_fee", label: "Giá tại VMS" },
      { key: "vnpt_fee", label: "Giá tại VNPT" },
      { key: "other_fee", label: "Giá khác" },
    ];
  }

  return columns;
};

const vpbxColumns = [
  { key: "phone_number", label: "Số điện thoại" },
  { key: "subscription_fee", label: "Phí hàng tháng" },
  { key: "call_fee", label: "Phí cuộc gọi" },
];

const gigafoneColumns = [
  { key: "phone_number", label: "Số điện thoại" },
  { key: "number_type", label: "Loại số" },
  { key: "valuation", label: "Giá trị định giá" },
  { key: "commitment_fee", label: "Phí cam kết" },
  { key: "commitment_time", label: "Thời gian cam kết" },
  { key: "subscription_fee", label: "Phí thuê bao" },
  { key: "call_fee", label: "Phí gọi" },
  { key: "status", label: "Trạng thái" },
];

// Define a type for the table data that includes all data sources
type TableData = (
  | DigitelDataType
  | GvoiceGtelDataType
  | VPBXDataType
  | GigaforeDataType
) & {
  id: string;
};

interface PrefixType {
  value: "ListPublicDVGTGT.aspx" | "ListPublicDVGTGT1800.aspx";
  label: string;
}

const DigitalChannel = () => {
  const { search, page, perPage, setPage, setPerPage } = useQueryString<{
    search: string;
    page: string;
    perPage: string;
  }>(["search", "page", "perPage"]);

  // Local state quản lý input và dữ liệu
  const [searchTerm, setSearchTerm] = useState<string>(search || "");
  const [searchQuery, setSearchQuery] = useState<string>(search || "");
  const [data, setData] = useState<ResponseType>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorData, setErrorData] = useState("");
  const [dataSource, setDataSource] = useState<DataSource>("gvoice");
  const [allVPBXData, setAllVPBXData] = useState<VPBXDataType[]>([]);
  const [prefix, setPrefix] = useState<PrefixType>({
    value: "ListPublicDVGTGT.aspx",
    label: "Đầu số 1900",
  });

  // Effect để đồng bộ URL params với state
  useEffect(() => {
    if (!page) {
      setPage("1");
    }
  }, [page, setPage]);

  // Effect để đồng bộ search param với state
  useEffect(() => {
    setSearchTerm(search || "");
    setSearchQuery(search || "");
  }, [search]);

  // Effect để fetch data
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      if (!page) return;

      setLoading(true);
      setError(null);

      try {
        const currentPage = Number(page);
        const currentPerPage = Number(perPage) || 10;

        const params: RequestParamsType = {
          page: currentPage,
          per_page: currentPerPage,
        };
        if (searchQuery) {
          params.search = searchQuery;
        }

        // Choose API based on data source
        let res;
        switch (dataSource) {
          case "gigafone":
            res = await getPublicNumberGigafore(params);
            break;
          case "gvoice":
            params.option = prefix.value;
            res = await getPublicNumberVoiceGTel(params);
            break;
          case "vpbx":
            // For VPBX, we'll fetch all data and handle pagination on client side
            res = await getPublicNumberVPBX();
            if (isMounted) {
              // Store all VPBX data
              setAllVPBXData(res.data.data as VPBXDataType[]);

              // Calculate pagination info
              const totalResults = res.data.data.length;
              const totalPages = Math.ceil(totalResults / currentPerPage);

              // Get current page data
              const startIndex = (currentPage - 1) * currentPerPage;
              const endIndex = startIndex + currentPerPage;
              const currentPageData = res.data.data.slice(startIndex, endIndex);

              // Update response data with paginated data
              res.data = {
                ...res.data,
                data: currentPageData,
                pagination: {
                  ...res.data.pagination,
                  total_results: totalResults,
                  total_pages: totalPages,
                  current_page: currentPage,
                  per_page: currentPerPage,
                },
              };
            }
            break;
          default:
            throw new Error("Invalid data source");
        }

        if (isMounted) {
          // Add 1 to total_pages for gigafone data source
          if (
            dataSource === "gigafone" &&
            res.data.pagination &&
            typeof res.data.pagination.total_pages === "number"
          ) {
            res.data.pagination.total_pages += 1;
          }
          setData(res.data);
          if (!res.data.data || res.data.data.length === 0) {
            setErrorData("Không có dữ liệu");
          } else {
            setErrorData("");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Lỗi tải dữ liệu");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [page, perPage, searchQuery, dataSource, prefix.value]);

  // Handle search for VPBX data
  useEffect(() => {
    if (dataSource === "vpbx" && searchQuery) {
      const filteredData = allVPBXData.filter((item) =>
        item.phone_number.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const currentPage = Number(page) || 1;
      const currentPerPage = Number(perPage) || 10;
      const totalResults = filteredData.length;
      const totalPages = Math.ceil(totalResults / currentPerPage);

      const startIndex = (currentPage - 1) * currentPerPage;
      const endIndex = startIndex + currentPerPage;
      const currentPageData = filteredData.slice(startIndex, endIndex);

      setData((prev) => ({
        ...prev!,
        data: currentPageData,
        pagination: {
          ...prev!.pagination,
          total_results: totalResults,
          total_pages: totalPages,
          current_page: currentPage,
          per_page: currentPerPage,
        },
      }));
    }
  }, [searchQuery, page, perPage, allVPBXData, dataSource]);

  // Effect để cập nhật URL
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set("search", searchQuery);
    if (page) newParams.set("page", page);
    if (perPage) newParams.set("perPage", perPage);

    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({}, "", newUrl);
  }, [searchQuery, page, perPage]);

  // Handle search term changes
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchQuery(searchTerm);
      setPage("1"); // Reset to page 1 when searching
    }
  };

  // Handle data source changes
  const handleDataSourceChange = (newSource: DataSource) => {
    setDataSource(newSource);
    setPage("1"); // Reset to page 1 when changing data source
    setSearchQuery(""); // Clear search when changing data source
    setSearchTerm(""); // Clear search term when changing data source
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage.toString());
  };

  const handleLimitChange = (newLimit: number) => {
    setPerPage(newLimit.toString());
    setPage("1");
  };

  const onPaginationChange = (_limit: number, newOffset: number) => {
    handlePageChange(newOffset + 1);
  };

  const getTableTitle = (): ReactNode => {
    switch (dataSource) {
      case "gvoice":
        return "Danh sách đầu số Gvoice GTel";
      case "vpbx":
        return "Danh sách đầu số VPBX";
      case "gigafone":
        return (
          <div className="flex items-center gap-2">
            <span>Danh sách đầu số GigaFone</span>
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              thử nghiệm
            </span>
          </div>
        );
      default:
        return "Danh sách đầu số";
    }
  };

  const getColumns = () => {
    switch (dataSource) {
      case "gvoice":
        return gvoiceColumns(prefix.value);
      case "vpbx":
        return vpbxColumns;
      case "gigafone":
        return gigafoneColumns;
      default:
        return [];
    }
  };

  const handleChangeNumberPrefix = (value: PrefixType) => {
    setPrefix(value);
    setPage("1");
  };
  // Xử lý dữ liệu cho TableMobile
  // Xử lý dữ liệu cho TableMobile
  const convertToMobileData = (data: any[]): LabelValueItem[][] => {
    return data.map((item) => {
      const baseFields = [
        { label: "ID", value: item.phone_number ?? "N/A", hidden: true },
        { label: "Số điện thoại", value: item.phone_number ?? "N/A" },
      ];

      switch (dataSource) {
        case "gvoice": {
          const gvoiceFields = [
            ...baseFields,
            { label: "Loại số", value: item.number_type ?? "N/A" },
            { label: "Phí cam kết", value: item.commitment_fee ?? "N/A" },
            { label: "Phí hàng tháng", value: item.subscription_fee ?? "N/A" },
            { label: "Trạng thái", value: item.status ?? "N/A" },
          ];

          // Thêm các trường đặc biệt cho prefix 1900
          if (prefix.value === "ListPublicDVGTGT.aspx") {
            gvoiceFields.push(
              { label: "Giá tại Viettel", value: item.vtl_fee ?? "N/A" },
              { label: "Giá tại VMS", value: item.vms_fee ?? "N/A" },
              { label: "Giá tại VNPT", value: item.vnpt_fee ?? "N/A" },
              { label: "Giá khác", value: item.other_fee ?? "N/A" }
            );
          }

          return gvoiceFields;
        }

        case "vpbx": {
          return [
            ...baseFields,
            { label: "Phí hàng tháng", value: item.subscription_fee ?? "N/A" },
            { label: "Phí cuộc gọi", value: item.call_fee ?? "N/A" },
          ];
        }

        case "gigafone": {
          return [
            ...baseFields,
            { label: "Loại số", value: item.number_type ?? "N/A" },
            { label: "Giá trị định giá", value: item.valuation ?? "N/A" },
            { label: "Phí cam kết", value: item.commitment_fee ?? "N/A" },
            {
              label: "Thời gian cam kết",
              value: item.commitment_time ?? "N/A",
            },
            { label: "Phí thuê bao", value: item.subscription_fee ?? "N/A" },
            { label: "Phí gọi", value: item.call_fee ?? "N/A" },
            { label: "Trạng thái", value: item.status ?? "N/A" },
          ];
        }
      }
    });
  };

  const dataMobile = convertToMobileData(data?.data || []);

  const { isMobile } = useScreenSize();

  // Xử lý phân trang cho TableMobile
  const handleMobilePageChange = (newPage: number) => {
    setPage(newPage.toString());
  };

  const handleMobileItemsPerPageChange = (newItemsPerPage: number) => {
    setPerPage(newItemsPerPage.toString());
    setPage("1");
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Danh sách đầu số" />
      <span className="text-xs text-red-500 italic font-normal py-4 px-4">
        *Chức năng thử nghiệm
      </span>
      <div className="space-y-6">
        {error && <div className="text-red-500">{error}</div>}
        <ComponentCard>
          <ResponsiveFilterWrapper>
            <div
              className={`${
                isMobile ? "block" : "flex"
              } justify-start gap-4 mb-4`}>
              <div>
                <Label>Nguồn dữ liệu</Label>
                <Select
                  options={[
                    { label: "Gtel", value: "gvoice" },
                    { label: "HTC", value: "vpbx" },
                    { label: "CMC", value: "gigafone" },
                  ]}
                  value={dataSource}
                  onChange={(e) => handleDataSourceChange(e as DataSource)}
                  className="border dark:text-gray-300 border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {dataSource === "gvoice" && (
                <div>
                  <Label>Đầu số</Label>
                  <Select
                    options={[
                      { label: "Đầu số 1900", value: "ListPublicDVGTGT.aspx" },
                      {
                        label: "Đầu số 1800",
                        value: "ListPublicDVGTGT1800.aspx",
                      },
                    ]}
                    value={prefix.value}
                    onChange={(value) =>
                      handleChangeNumberPrefix({
                        value: value as
                          | "ListPublicDVGTGT.aspx"
                          | "ListPublicDVGTGT1800.aspx",
                        label:
                          value === "ListPublicDVGTGT.aspx"
                            ? "Đầu số 1900"
                            : "Đầu số 1800",
                      })
                    }
                    className="border dark:text-gray-300 border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              )}

              <div>
                <Label>Tìm kiếm</Label>
                <Input
                  placeholder="Tìm theo số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          </ResponsiveFilterWrapper>

          {isMobile ? (
            <TableMobile
              data={dataMobile}
              pageTitle="Danh sách đầu số các kênh"
              totalPages={data?.pagination.total_pages ?? 1}
              currentPage={Number(page) || 1}
              onPageChange={handleMobilePageChange}
              onItemsPerPageChange={handleMobileItemsPerPageChange}
              disabled={true}
              disabledReset={true}
              hideCheckbox={true}
              showAllData={false}
            />
          ) : (
            <>
              <ReusableTable<TableData>
                error={errorData}
                disabledReset={true}
                title={getTableTitle()}
                showId={false}
                data={data?.data.map((item) => ({
                  ...item,
                  id: item.phone_number,
                }))}
                columns={
                  getColumns() as {
                    key: string;
                    label: string;
                    type?: string;
                    classname?: string;
                  }[]
                }
                isLoading={loading}
                disabled={true}
              />
              <Pagination
                limit={Number(perPage) || 10}
                offset={(Number(page) || 1) - 1}
                totalPages={data?.pagination.total_pages ?? 1}
                totalResults={data?.pagination.total_results}
                paginationMode={dataSource === "vpbx" ? "total" : "page"}
                onPageChange={(limit, newOffset) =>
                  onPaginationChange(limit, newOffset)
                }
                onLimitChange={handleLimitChange}
                showLimitSelector={false}
              />
            </>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default DigitalChannel;
