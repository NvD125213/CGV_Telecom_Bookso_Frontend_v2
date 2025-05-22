import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { IHistoryBooked } from "../../types";
import useDateFilter from "../../hooks/useDateFilter";
import ReusableTable from "../../components/common/ReusableTable";
import { getBookingByCurrent } from "../../services/report";
import Label from "../../components/form/Label";
import { useState, useEffect, useCallback } from "react";
import { formatDate } from "../../helper/formatDateToISOString";
import { formatNumber } from "../../helper/formatCurrencyVND";
import Pagination from "../../components/pagination/pagination";
import { useSearchParams } from "react-router-dom";
import { debounce } from "lodash";
import DatePicker from "../../components/form/date-picker";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
const getColumns = (status: string) => {
  const columns: {
    key: keyof IHistoryBooked;
    label: string;
    type?: string;
    classname?: string;
  }[] = [
    { key: "phone_number", label: "Số điện thoại" },
    { key: "provider_name", label: "Nhà cung cấp" },
    { key: "type_name", label: "Loại số" },
    { key: "installation_fee", label: "Phí lắp đặt (đ)" },
    { key: "maintenance_fee", label: "Phí duy trì (đ)" },
    { key: "vanity_number_fee", label: "Phí số đẹp (đ)" },
    {
      key: "status",
      label: "Trạng thái",
      type: "span",
      classname:
        status === "available"
          ? "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
          : status === "booked"
          ? "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400"
          : status === "released"
          ? "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
          : "",
    },
  ];
  if (status === "available") {
    return [
      ...columns,
      { key: "created_at" as keyof IHistoryBooked, label: "Ngày tạo" },
    ];
  }
  if (status === "booked") {
    return [
      ...columns,
      { key: "booked_at" as keyof IHistoryBooked, label: "Ngày đặt" },
      { key: "booked_until" as keyof IHistoryBooked, label: "Hạn đặt" },
    ];
  }
  if (status === "released") {
    return [
      ...columns,
      { key: "released_at" as keyof IHistoryBooked, label: "Ngày triển khai" },
    ];
  }

  return columns;
};
type StatusType = "booked" | "released";

const HistoryBooked = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<IHistoryBooked[]>([]);
  const [loading, setLoading] = useState(false);
  const { month, year, setYear, setMonth, setAll } = useDateFilter();
  const [filterType, setFilterType] = useState<"day" | "monthYear">("day");
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 20);
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [status, setStatus] = useState<StatusType>("booked");

  const [totalPages, setTotalPages] = useState(0);
  const [errors, setErrors] = useState("");

  useEffect(() => {
    if (!searchParams.get("limit") || !searchParams.get("offset")) {
      setSearchParams((prev: any) => {
        const newParams = new URLSearchParams(prev);
        if (!newParams.get("limit")) newParams.set("limit", "20");
        if (!newParams.get("offset")) newParams.set("offset", "0");
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);

  const fetchData = async ({
    day,
    month,
    year,
  }: {
    day?: number;
    month?: number;
    year?: number;
  } = {}) => {
    try {
      setLoading(true);
      setErrors("");
      const params: any = {
        option: status,
        limit: limit,
        offset: offset,
      };

      if (year) params.year = year;
      if (month) params.month = month;
      if (day) params.day = day;
      if (status) params.option = status;

      const res = await getBookingByCurrent(params);
      const formattedData = res.data.data.map((phone: IHistoryBooked) => ({
        ...phone,
        created_at: phone.created_at ? formatDate(phone.created_at) : "N/A",
        booked_until: phone.booked_until
          ? formatDate(phone.booked_until)
          : "N/A",
        booked_at: phone.booked_at ? formatDate(phone.booked_at) : "N/A",
        released_at: phone.released_at ? formatDate(phone.released_at) : "N/A",
        installation_fee: formatNumber(String(phone?.installation_fee ?? 0)),
        maintenance_fee: formatNumber(String(phone?.maintenance_fee ?? 0)),
        vanity_number_fee: formatNumber(String(phone?.vanity_number_fee ?? 0)),
      }));
      const rawData = res.data.data || [];

      if (rawData.length === 0) {
        setErrors("Không có dữ liệu!");
      }
      setData(formattedData || []);
      setTotalPages(res.data.total_pages || Math.ceil(res.data.total / limit));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchData = useCallback(
    debounce((month: number | undefined, year: number | undefined) => {
      if (year) {
        fetchData({ month, year });
      }
    }, 500),
    [limit, offset, status]
  );

  const handleDateChange = (date: Date[]) => {
    if (date.length > 0) {
      const selectedDate = date[0];
      setAll(selectedDate);

      const day = selectedDate.getDate();
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();

      if (filterType === "monthYear") {
        fetchData({ year, month });
      } else {
        fetchData({ day, month, year });
      }
    }
  };

  const handleFilterTypeChange = (newFilterType: "day" | "monthYear") => {
    setFilterType(newFilterType);
    setOffset(0);
    setMonth(null);
    setYear(null);
    fetchData();
  };
  const handleStatusChange = (newStatus: StatusType) => {
    setStatus(newStatus);
    setOffset(0);
    setMonth(null); // Đặt lại month nếu cần
    setYear(null); // Đặt lại year nếu cần
    setSearchParams({
      limit: limit.toString(),
      offset: "0",
      option: newStatus,
    });
  };
  useEffect(() => {
    if (filterType !== "monthYear") {
      fetchData();
    }
  }, [limit, offset, status, filterType]);

  useEffect(() => {
    if (filterType === "monthYear") {
      const adjustedMonth = month === null ? undefined : month;
      const adjustedYear = year === null ? undefined : year;
      debouncedFetchData(adjustedMonth, adjustedYear);
    }
  }, [month, year, filterType, debouncedFetchData]);

  return (
    <>
      <PageBreadcrumb pageTitle="Lịch sử book số của bạn" />
      <div className="flex flex-wrap w-full items-end justify-start gap-3 mb-4">
        <div className="w-full md:w-auto">
          <Label htmlFor="filterType">Lọc theo</Label>
          <Select
            options={[
              { label: "Tìm kiếm cụ thể từng ngày", value: "day" },
              { label: "Tìm kiếm theo năm, tháng", value: "monthYear" },
            ]}
            className="border rounded-md px-3 py-3 w-full md:w-auto dark:bg-black dark:text-white"
            onChange={(value) =>
              handleFilterTypeChange(value as "day" | "monthYear")
            }
            placeholder="Chọn kiểu tìm kiếm"
          />
        </div>

        <div className="w-full md:w-auto">
          {filterType === "day" ? (
            <div className=" w-full">
              <DatePicker
                id="date-picker"
                label="Nhập mốc thời gian"
                placeholder="Select a date"
                onChange={(dates) => handleDateChange(dates)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 items-center justify-start gap-3 ">
              <div>
                <Label htmlFor="">Nhập năm</Label>

                <Input
                  type="number"
                  placeholder="Năm..."
                  value={year ?? ""}
                  onChange={(e: any) => setYear(Number(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 w-24 dark:placeholder-white/50 dark:text-white"
                  min={1}
                />
              </div>
              <div>
                <Label htmlFor="">Nhập tháng</Label>
                <Input
                  type="number"
                  placeholder="Tháng"
                  value={month ?? ""}
                  onChange={(e: any) => setMonth(Number(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 w-24 dark:placeholder-white/50 dark:text-white"
                  min={1}
                  max={12}
                />
              </div>
            </div>
          )}
        </div>
        <div>
          <Label>Trạng thái</Label>
          <Select
            options={[
              { label: "Đã book", value: "booked" },
              { label: "Triển khai", value: "released" },
            ]}
            className="border rounded-md px-3 py-3 w-full md:w-auto dark:bg-black dark:text-white"
            onChange={(value) => handleStatusChange(value as StatusType)}
            placeholder="Chọn trạng thái"
          />
        </div>
      </div>

      <div className="space-y-6">
        <ComponentCard>
          <ReusableTable
            disabledReset={true}
            error={errors}
            title="Bảng lịch sử chi tiết"
            data={data ?? []}
            columns={getColumns(status)}
            isLoading={loading}
            pagination={{
              currentPage: offset,
              pageSize: limit,
            }}
          />
          <Pagination
            limit={limit}
            offset={offset}
            totalPages={totalPages}
            onPageChange={(newLimit, newOffset) => {
              setLimit(newLimit);
              setOffset(newOffset);
              setSearchParams({
                limit: newLimit.toString(),
                offset: newOffset.toString(),
                option: status,
              });
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setOffset(0);
              setSearchParams({
                limit: newLimit.toString(),
                offset: "0",
                option: status,
              });
            }}
          />
        </ComponentCard>
      </div>
    </>
  );
};

export default HistoryBooked;
