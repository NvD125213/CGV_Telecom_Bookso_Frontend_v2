import ComponentCard from "../../components/common/ComponentCard";
import { IHistoryBooked } from "../../types";
import ReusableTable from "../../components/common/ReusableTable";
import { getBookingByCurrent } from "../../services/report";
import Label from "../../components/form/Label";
import { useState, useEffect } from "react";
import { formatDate } from "../../helper/formatDateToISOString";
import { formatNumber } from "../../helper/formatCurrencyVND";
import Pagination from "../../components/pagination/pagination";
import { useSearchParams } from "react-router-dom";
import Select from "../../components/form/Select";
import { IoCaretBackCircleOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import {
  getPhoneByID,
  revokeAllNumber,
  revokeNumberForSale,
} from "../../services/phoneNumber";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { resetSelectedIds } from "../../store/selectedPhoneSlice";
import ResponsiveFilterWrapper from "../../components/common/FlipperWrapper";
import TableMobile, {
  ActionButton,
  LabelValueItem,
} from "../../mobiles/TableMobile";
import { useScreenSize } from "../../hooks/useScreenSize";
import SwitchablePicker, {
  PickerType,
} from "../../components/common/SwitchablePicker";
import clsx from "clsx";
import FloatingActionPanel from "../../components/common/FloatingActionPanel";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { MdOutlineSelectAll } from "react-icons/md";

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
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<IHistoryBooked[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pickerType, setPickerType] = useState<PickerType>("date");
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

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);

    if (date) {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (pickerType === "year") {
        fetchData({ year });
      } else if (pickerType === "month") {
        fetchData({ year, month });
      } else {
        fetchData({ day, month, year });
      }
    } else {
      // Reset data when no date is selected
      fetchData();
    }
  };

  const handlePickerTypeChange = (newType: PickerType) => {
    setPickerType(newType);
    setSelectedDate(null);
    setOffset(0);
    fetchData();
  };

  const handleStatusChange = (newStatus: StatusType) => {
    setStatus(newStatus);
    setOffset(0);
    setSelectedDate(null);
    setSearchParams({
      limit: limit.toString(),
      offset: "0",
      option: newStatus,
    });
  };

  useEffect(() => {
    fetchData();
  }, [limit, offset, status]);

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
            <label class="block mb-2 text-sm font-medium text-gray-900">
              Danh sách số sẽ thu hồi:
            </label>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-300">
              <div class="text-sm text-gray-700">${phoneDetails.join(
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

        const res = await revokeNumberForSale(dataRevoke);
        if (res.status === 200) {
          await Swal.fire({
            title: "Thu hồi thành công!",
            html: `
              <div class="text-left">
                <label class="block mb-2 text-sm font-medium text-gray-900">
                  Danh sách số đã thu hồi:
                </label>
                <div class="p-3 bg-gray-50 rounded-lg border border-gray-300">
                  <div class="text-sm text-gray-700">${phoneDetails.join(
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

  // xử lý revoke all số
  const handleRevokeAllNumber = async () => {
    const confirmResult = await Swal.fire({
      title: "Xác nhận thu hồi",
      text: "Bạn có chắc muốn thu hồi toàn bộ các số đang được đặt hay không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      // show loading
      Swal.fire({
        title: "Đang thu hồi...",
        text: "Vui lòng chờ trong giây lát",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await revokeAllNumber();

      if (res?.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Thu hồi thành công",
          text: "Đã thu hồi toàn bộ số đang được đặt",
        });

        // 🔄 reload lại danh sách số
        fetchData?.(); // RTK Query
        // hoặc fetchNumbers();
      }
    } catch (error: any) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Thu hồi thất bại",
        text: error?.response.data.detail || "Có lỗi xảy ra, vui lòng thử lại",
      });
    }
  };

  // Xử lý dữ liệu cho TableMobile
  const convertToMobileData = (data: IHistoryBooked[]): LabelValueItem[][] => {
    return data.map((item) => {
      return [
        { label: "ID", value: item.id, hidden: true },
        { label: "Số điện thoại", value: item.phone_number },
        { label: "Trạng thái", value: item.status },
        { label: "Nhà cung cấp", value: item.provider_name },
        { label: "Loại số", value: item.type_name },
      ];
    });
  };

  const actions =
    status === "booked"
      ? [
          {
            icon: <IoCaretBackCircleOutline size={22} />,
            label: "Thu hồi",
            onClick: handleRevoke,
            color: "error" as const,
          },
        ]
      : [];

  const dataMobile = convertToMobileData(data);

  const { isMobile } = useScreenSize();

  // Function to get status class based on current status
  const getStatusClass = () => {
    switch (status) {
      case "booked":
        return "uppercase text-yellow-500 text-[14px] border border-yellow-500 px-9 py-1 rounded-full text-center shadow-sm dark:shadow-yellow-400/40 bg-yellow-100 dark:bg-yellow-500/40 backdrop-blur-sm dark:border-yellow-400";
      case "released":
        return "uppercase text-red-500 text-[14px] border border-red-500 px-9 py-1 rounded-full text-center shadow-sm dark:shadow-red-400/40 bg-red-100 dark:bg-red-500/40 backdrop-blur-sm dark:border-red-400";
      default:
        return "text-[14px] border border-gray-500 px-9 py-1 rounded-full text-center shadow-sm dark:shadow-gray-400/40 bg-gray-100 dark:bg-gray-500/40 backdrop-blur-sm dark:border-gray-400";
    }
  };

  return (
    <ComponentCard>
      {isMobile ? null : <PageBreadcrumb pageTitle="Lịch sử đặt số" />}{" "}
      <ResponsiveFilterWrapper drawerTitle="Bộ lọc" pageTitle="Lịch sử đặt số">
        <div
          className={`w-full gap-3 mb-4 flex ${
            isMobile ? "block space-y-3" : ""
          }`}>
          <div>
            <Label>Thông tin lọc</Label>
            <div className="flex gap-2">
              <SwitchablePicker
                value={selectedDate}
                onChange={handleDateChange}
                onTypeChange={handlePickerTypeChange}
              />
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
        </div>
      </ResponsiveFilterWrapper>
      <FloatingActionPanel>
        {status === "booked" && (
          <div
            className={clsx(
              isMobile ? "block" : "flex items-end justify-end gap-2"
            )}>
            <button
              onClick={handleRevoke}
              className="flex dark:bg-black dark:text-white items-center gap-2 border rounded-lg border-gray-300 bg-white p-[10px] text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
              <IoCaretBackCircleOutline size={22} />
              Thu hồi
            </button>
            {user.role == 1 && user.sub == "HUYLQ" && (
              <button
                onClick={handleRevokeAllNumber}
                className="flex dark:bg-black dark:text-white items-center gap-2 border rounded-lg border-gray-300 bg-white p-[10px] text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
                <MdOutlineSelectAll size={22} />
                Thu hồi toàn bộ
              </button>
            )}
          </div>
        )}
      </FloatingActionPanel>
      <div className="space-y-6">
        {isMobile ? (
          <TableMobile
            data={dataMobile}
            pageTitle="Lịch sử đặt số"
            hideCheckbox={status !== "booked"}
            hidePagination={false}
            useTailwindStyling={true}
            disabledReset={status !== "booked"}
            showAllData={false}
            actions={actions as ActionButton[]}
            defaultItemsPerPage={limit}
            itemsPerPageOptions={[10, 20, 50, 100]}
            totalPages={totalPages}
            currentPage={offset + 1}
            onPageChange={(page) => setOffset(page - 1)}
            onItemsPerPageChange={(newQuantity) => {
              setLimit(newQuantity);
              setOffset(0);
            }}
            labelClassNames={{
              "Nhà cung cấp": "text-[14px]",
              "Trạng thái": "text-[14px]",
              "Loại số": "text-[14px]",
              "Số điện thoại": "text-[14px]",
            }}
            valueClassNames={{
              "Số điện thoại":
                "text-sm border-blue-500 tracking-wider bg-blue-100 dark:bg-blue-500/40 align-middle rounded-full border border-blue-200 px-5 py-1 dark:border-blue-400 shadow-sm dark:shadow-blue-400/30 backdrop-blur-sm font-semibold",
              "Nhà cung cấp": "text-[14px] backdrop-blur-sm dark:text-gray-200",
              "Loại số": "text-[14px] backdrop-blur-sm dark:text-gray-200",
              "Trạng thái": getStatusClass(),
            }}
          />
        ) : (
          <>
            {!loading && (!data || data.length === 0) ? (
              // Empty State
              <div className="bg-white rounded-lg border p-8">
                <div className="text-center py-12">
                  <svg
                    className="w-20 h-20 text-gray-300 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg text-gray-700 mb-2">
                    Không có dữ liệu
                  </h3>
                </div>
              </div>
            ) : (
              <>
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
                  disabledReset={status !== "booked"}
                  disabled={status !== "booked"}
                  onCheck={(
                    selectedIds: (string | number)[],
                    selectedRows: IHistoryBooked[]
                  ) => {
                    setSelectedIds(selectedIds.map((id) => Number(id)));
                    setSelectedRows(selectedRows);
                  }}
                />

                {data && data.length > 0 && (
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
                )}
              </>
            )}
          </>
        )}
      </div>
    </ComponentCard>
  );
};

export default HistoryBooked;
