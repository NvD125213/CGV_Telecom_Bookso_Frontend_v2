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
import debounce from "lodash/debounce";
import Swal from "sweetalert2";
import Spinner from "../../components/common/LoadingSpinner";
import SwitchablePicker from "../../components/common/SwitchablePicker";

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [pickerType, setPickerType] = useState<"date" | "month" | "year">(
    "date"
  );

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
    if (!selectedDate) {
      getAllData({});
      return;
    }

    let filter: any = {};

    switch (pickerType) {
      case "date":
        filter = {
          day: selectedDate.getDate(),
          month: selectedDate.getMonth() + 1,
          year: selectedDate.getFullYear(),
        };
        break;
      case "month":
        filter = {
          month: selectedDate.getMonth() + 1,
          year: selectedDate.getFullYear(),
        };
        break;
      case "year":
        filter = {
          year: selectedDate.getFullYear(),
        };
        break;
    }

    getAllData(filter);
  }, [selectedDate, pickerType, getAllData]);

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
            return "Không được để trống số lượng giới hạn!";
          }
          if (!/^\d+$/.test(value)) {
            return "Chỉ được nhập số nguyên dương!";
          }
          return undefined;
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
          Swal.fire("Oops...", `${error}`, "error");
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
            <SwitchablePicker
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
              }}
              onTypeChange={(type) => {
                setPickerType(type as "date" | "month" | "year");
              }}
            />
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
