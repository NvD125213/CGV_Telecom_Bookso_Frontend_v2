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

const baseColumns: { key: keyof IHistoryBooked; label: string }[] = [
  { key: "user_name", label: "Tên" },
  { key: "phone_number", label: "Số đã book" },
  { key: "provider_name", label: "Nhà cung cấp" },
  { key: "type_name", label: "Kiểu số" },
  { key: "installation_fee", label: "Phí cài đặt" },
  { key: "maintenance_fee", label: "Phí bảo trì" },
  { key: "vanity_number_fee", label: "Phí số đẹp" },
  { key: "created_at", label: "Ngày thêm số" },
  { key: "updated_at", label: "Ngày book" },
  { key: "booked_until", label: "Hạn đặt" },
];

const HistoryBooked = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status] = useState("booked");
  const [data, setData] = useState<IHistoryBooked[]>([]);
  const [loading, setLoading] = useState(false);
  const { month, year, setYear, setMonth, setAll } = useDateFilter();
  const [filterType, setFilterType] = useState<"day" | "monthYear">("day");
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 20);
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
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

      const res = await getBookingByCurrent(params);
      const formattedData = res.data.data.map((phone: IHistoryBooked) => ({
        ...phone,
        created_at: phone.created_at ? formatDate(phone.created_at) : "N/A",
        booked_until: phone.booked_until
          ? formatDate(phone.booked_until)
          : "N/A",
        updated_at: phone.updated_at ? formatDate(phone.updated_at) : "N/A",
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
          <select
            value={filterType}
            onChange={(e) =>
              handleFilterTypeChange(e.target.value as "day" | "monthYear")
            }
            className="border rounded-md px-3 py-3 w-full md:w-auto dark:text-white">
            <option className="bg-white dark:bg-black" value="day">
              Tìm kiếm cụ thể từng ngày
            </option>
            <option className="bg-white dark:bg-black" value="monthYear">
              Tìm kiếm theo năm, tháng
            </option>
          </select>
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
            <div className="flex flex-wrap items-center justify-start gap-3 ">
              <input
                type="number"
                placeholder="Năm..."
                value={year ?? ""}
                onChange={(e) => setYear(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 w-24 dark:placeholder-white/50 dark:text-white"
                min={1}
              />
              <input
                type="number"
                placeholder="Tháng"
                value={month ?? ""}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 w-24 dark:placeholder-white/50 dark:text-white"
                min={1}
                max={12}
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <ComponentCard>
          <ReusableTable
            error={errors}
            title="Bảng lịch sử chi tiết"
            data={data ?? []}
            columns={baseColumns}
            isLoading={loading}
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
              });
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setOffset(0);
              setSearchParams({ limit: newLimit.toString(), offset: "0" });
            }}
          />
        </ComponentCard>
      </div>
    </>
  );
};

export default HistoryBooked;
