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
import { IoCaretBackCircleOutline } from "react-icons/io5";
import Input from "../../components/form/input/InputField";
import Swal from "sweetalert2";
import { getPhoneByID, revokeNumber } from "../../services/phoneNumber";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { resetSelectedIds } from "../../store/selectedPhoneSlice";

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
  const dispatch = useDispatch();
  const selectedIdsFromStore = useSelector(
    (state: RootState) => state.selectedPhone.selectedIds
  );
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<IHistoryBooked[]>([]);

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

  const handleRevoke = async () => {
    if (selectedIdsFromStore.length === 0) {
      Swal.fire(
        "Thông báo",
        "Vui lòng chọn ít nhất một số để thu hồi",
        "warning"
      );
      return;
    }

    try {
      // Fetch phone details for all selected IDs from store
      const phoneDetailsPromises = selectedIdsFromStore.map((id) =>
        getPhoneByID(Number(id))
      );
      const phoneDetailsResponses = await Promise.all(phoneDetailsPromises);

      // Extract phone numbers from responses
      const phoneDetails = phoneDetailsResponses
        .filter((res) => res?.data)
        .map((res) => res?.data.phone_number);

      // Show confirmation modal with phone details first
      const confirmResult = await Swal.fire({
        title: "Xác nhận danh sách số",
        html: `
          <div class="text-left">
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Danh sách số sẽ thu hồi:
            </label>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
              <div class="text-sm text-gray-700 dark:text-gray-300">${phoneDetails.join(
                ", "
              )}</div>
            </div>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xác nhận thu hồi",
        cancelButtonText: "Hủy",
        allowOutsideClick: false,
      });

      if (confirmResult.isConfirmed) {
        const dataRevoke = {
          id_phone_numbers: selectedIdsFromStore,
        };

        const res = await revokeNumber(dataRevoke);
        if (res.status === 200) {
          // Show success modal with phone list
          await Swal.fire({
            title: "Thu hồi thành công!",
            html: `
              <div class="text-left">
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Danh sách số đã thu hồi:
                </label>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                  <div class="text-sm text-gray-700 dark:text-gray-300">${phoneDetails.join(
                    ", "
                  )}</div>
                </div>
              </div>
            `,
            showDenyButton: true,
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "Sao chép",
            denyButtonText: "Bỏ qua",
            allowOutsideClick: false,
          }).then((result) => {
            if (result.isConfirmed) {
              // Copy to clipboard
              navigator.clipboard.writeText(phoneDetails.join(", "));
              Swal.fire("Đã sao chép!", "", "success");
            }
            // Reset states regardless of copy action
            dispatch(resetSelectedIds());
            setSelectedIds([]);
            setSelectedRows([]);
            fetchData();
            setSearchParams({});
          });
        }
      }
    } catch (err: any) {
      const error = err.response?.data?.detail;
      Swal.fire(
        "Oops...",
        `${error || "Có lỗi xảy ra khi thu hồi, vui lòng thử lại!"}`,
        "error"
      );
      // Reset states on error
      dispatch(resetSelectedIds());
      setSelectedIds([]);
      setSelectedRows([]);
      await fetchData();
    }
  };

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

        <div>
          {status === "booked" && (
            <div className="flex items-end gap-2">
              <button
                onClick={handleRevoke}
                className="flex dark:bg-black dark:text-white items-center gap-2 border rounded-lg border-gray-300 bg-white p-[10px] text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
                <IoCaretBackCircleOutline size={22} />
                Thu hồi
              </button>
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
            columns={getColumns(status)}
            isLoading={loading}
            pagination={{
              currentPage: offset,
              pageSize: limit,
            }}
            disabled={status !== "booked"}
            onCheck={(
              selectedIds: (string | number)[],
              selectedRows: IHistoryBooked[]
            ) => {
              setSelectedIds(selectedIds.map((id) => Number(id)));
              setSelectedRows(selectedRows);
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
