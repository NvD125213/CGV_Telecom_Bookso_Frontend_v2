import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useEffect, useState, useCallback } from "react";
import { ILimitBooking } from "../../types";
import {
  getAllBookingLimit,
  updateQuantityLimit,
} from "../../services/phoneNumber";
import ReusableTable from "../../components/common/ReusableTable";
import { formatDate } from "../../helper/formatDateToISOString";
import useDateFilter from "../../hooks/useDateFilter";
import debounce from "lodash/debounce";
import Swal from "sweetalert2";
import Spinner from "../../components/common/LoadingSpinner";

const columns: { key: keyof ILimitBooking; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "username", label: "Sale" },
  { key: "max_booking_per_day", label: "Giới hạn đặt (số)" },
  { key: "created_at", label: "Ngày đặt giới hạn" },
  { key: "updated_at", label: "Cập nhật lần cuối" },
];

const LimitBookingPage = () => {
  const [limitBooking, setLimitBooking] = useState<ILimitBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLimit, setLoadingLimit] = useState(false);
  const [errorData, setErrorData] = useState("");
  const { day, setDay, month, setMonth, year, setYear, getFilter } =
    useDateFilter();

  const getAllData = useCallback(async (filter = {}) => {
    setLoading(true);
    try {
      const res = await getAllBookingLimit(filter);
      if (res.status === 200) {
        const formatData = res.data.map((item: any) => ({
          ...item,
          created_at: formatDate(item.created_at),
          updated_at: formatDate(item.updated_at),
        }));
        setLimitBooking(formatData);
        setErrorData(res.data.length === 0 ? "Không có dữ liệu !" : "");
      }
    } catch (error: any) {
      setErrorData(error.response?.data?.detail || "Lỗi xảy ra !");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    getAllData(getFilter());
  }, [getFilter, getAllData]);

  useEffect(() => {
    const handler = debounce(() => {
      handleSearch();
    }, 500);

    handler();

    return () => handler.cancel();
  }, [handleSearch]);

  const handleLimitBooking = async (data: any) => {
    try {
      const { isConfirmed, value } = await Swal.fire({
        title: "Thay đổi số lượng giới hạn",
        input: "text",
        inputLabel: `Thay đổi số lượng cho ${data.username}`,
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        inputValidator: (value) => {
          if (!value) {
            return "Không được để số lượng giới hạn!";
          }
        },
      });

      if (!isConfirmed) return;
      else {
        setLoadingLimit(true);
        try {
          const res = await updateQuantityLimit(data.id, {
            quantity: value,
          });
          if (res.status === 200) {
            Swal.fire("Thay đổi số lượng thành công!", "", "success");
            setLoadingLimit(false);
            getAllData();
          }
        } catch (error: any) {
          Swal.fire(
            "Lỗi",
            error.response.data.detail ||
              "Có lỗi xảy ra khi thay đổi giới hạn, vui lòng thử lại!",
            "error"
          );
        }
      }
    } catch (err: any) {
      console.error("Lỗi khi giải phóng số:", err);
      setLoadingLimit(false);
    } finally {
      setLoadingLimit(false);
    }
  };
  return (
    <>
      {loadingLimit ? (
        <Spinner />
      ) : (
        <>
          <PageBreadcrumb pageTitle="Giới hạn đặt số" />

          <div className="flex flex-wrap w-full p-6 items-center justify-end gap-3 mb-4">
            <input
              type="number"
              placeholder="Ngày"
              value={day ?? ""}
              onChange={(e) => setDay(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 w-24 dark:placeholder-white/50 dark:text-white"
              min={1}
              max={31}
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
            <input
              type="number"
              placeholder="Năm"
              value={year ?? ""}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 w-24 dark:placeholder-white/50 dark:text-white"
              min={2000}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Tìm kiếm
            </button>
          </div>

          <div className="space-y-6">
            <ComponentCard>
              <ReusableTable
                error={errorData}
                title="Danh sách giới hạn của từng sale"
                data={limitBooking}
                columns={columns}
                isLoading={loading}
                onEdit={(row) => handleLimitBooking(row)}
              />
            </ComponentCard>
          </div>
        </>
      )}
    </>
  );
};

export default LimitBookingPage;
