import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom"; // Sửa "react-router" thành "react-router-dom"
import {
  releasePhoneNumber,
  IReleasePhoneNumber,
} from "../../services/phoneNumber";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import { IPhoneNumber } from "../../types";
import {
  bookingPhoneForOption,
  getPhoneByID,
  deletePhone,
} from "../../services/phoneNumber";
import ReusableTable from "../../components/common/ReusableTable";
import Pagination from "../../components/pagination/pagination";
import PhoneModalDetail from "./PhoneModalDetail";
import Swal from "sweetalert2";
import { FiEye } from "react-icons/fi";
import { formatDate } from "../../helper/formatDateToISOString";
import { MdOutlineNewReleases } from "react-icons/md";
import Spinner from "../../components/common/LoadingSpinner";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { CiExport } from "react-icons/ci";
import { IoCloudDownloadOutline } from "react-icons/io5";
import exportPivotTableToExcel from "../../helper/exportDataToExcel";

interface PhoneNumberProps {
  total_pages: number;
  phone_numbers: IPhoneNumber[];
}

const getColumns = (status: string) => {
  const columns: {
    key: keyof IPhoneNumber;
    label: string;
    type?: string;
    classname?: string;
  }[] = [
    { key: "phone_number", label: "Số điện thoại" },
    { key: "provider_name" as "provider_id", label: "Nhà cung cấp" },
    { key: "type_name" as "type_number_id", label: "Loại số" },
    { key: "installation_fee", label: "Phí lắp đặt (đ)" },
    { key: "maintenance_fee", label: "Phí duy trì (đ)" },
    { key: "vanity_number_fee", label: "Phí số đẹp (đ)" },
    { key: "updated_at", label: "Ngày đặt" },
    { key: "booked_until", label: "Hạn đặt" },
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

  return columns;
};

function PhoneNumbers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<IPhoneNumber | null>(null);
  const [search, setSearch] = useState<string>("");
  const [safeData, setSafeData] = useState<IPhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(
    Number(searchParams.get("quantity")) || 20
  );
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [status, setStatus] = useState(
    searchParams.get("status") || "available"
  );
  const [selectedRows, setSelectedRows] = useState<IPhoneNumber[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [data, setData] = useState<PhoneNumberProps | undefined>(undefined);
  const [bookLoading, setBookLoading] = useState(false);

  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const user = useSelector((state: RootState) => state.auth.user);

  const fetchData = async (
    quantity: number,
    status: string,
    offset: number
  ) => {
    setLoading(true);
    try {
      const response = await bookingPhoneForOption({
        quantity,
        status,
        offset,
      });

      const formatNumber = (num: any) =>
        num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
      const formattedData = response.data.phone_numbers.map(
        (phone: IPhoneNumber) => ({
          ...phone,
          booked_until: phone.booked_until
            ? formatDate(phone.booked_until)
            : "0",
          updated_at: phone.updated_at ? formatDate(phone.updated_at) : "0",
          installation_fee: formatNumber(phone?.installation_fee),
          maintenance_fee: formatNumber(phone?.maintenance_fee),
          vanity_number_fee: formatNumber(phone?.vanity_number_fee),
        })
      );
      if (response.data.phone_numbers.length === 0) {
        setError("Không có dữ liệu");
      } else {
        setError("");
      }

      setSafeData(formattedData);
      setData({
        ...response.data,
        phone_numbers: formattedData,
      });

      setSearchParams({
        quantity: quantity.toString(),
        status,
        offset: offset.toString(),
      });
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  useEffect(() => {
    fetchData(quantity, status, offset); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, status, offset]);

  const handleChangeStatus = (value: string) => {
    setStatus(value);
    setOffset(0);
    fetchData(quantity, value, 0);
  };

  const handleGetById = async (id: number) => {
    try {
      const res = await getPhoneByID(id);
      if (res?.data) {
        const { type_number_id, ...rest } = res.data;
        const modifiedData = {
          ...rest,
          type_id: type_number_id,
        };
        setSelectedPhone(modifiedData);
        setOpenModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch phone data:", error);
      Swal.fire("Lỗi", "Không thể tải dữ liệu chi tiết", "error");
    }
  };

  const handleSearch = (term: string) => {
    const regexPattern = term.replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexPattern}$`, "i");
    return data?.phone_numbers.filter((phone) =>
      regex.test(phone.phone_number)
    );
  };

  const onChangeInputSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value === "") {
      setSafeData(data?.phone_numbers ?? []);
      return;
    }
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (search === "") {
        setSafeData(data?.phone_numbers ?? []);
        return;
      } else {
        const result = handleSearch(search);
        setSafeData(result ?? []);
      }
    }
  };

  const handleDelete = async (id: any) => {
    if (typeof id !== "number" || isNaN(id)) {
      console.error("Invalid ID:", id);
      Swal.fire("Lỗi", "ID không hợp lệ");
      return;
    }

    try {
      const result = await Swal.fire({
        title: "Bạn có chắc chắn muốn xóa số này?",
        text: "Dữ liệu sẽ không thể khôi phục nếu xóa",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xóa!",
      });

      if (result.isConfirmed) {
        const res = await deletePhone(id);
        if (res?.status === 200) {
          await Swal.fire({
            title: "Xóa thành công!",
            icon: "success",
          });
          fetchData(quantity, status, offset);
        }
      }
    } catch (error: any) {
      Swal.fire("Lỗi", `${error.response?.data?.detail || "Đã xảy ra lỗi"}`);
    }
  };

  const handleReleasedNumber = async (data: any) => {
    setBookLoading(true);
    try {
      const { value: contractCode, isConfirmed } = await Swal.fire({
        title: "Nhập Contract Code",
        input: "text",
        inputLabel: `Nhập mã giao dịch cho số ${data.phone_number}`,
        inputPlaceholder: "Nhập mã giao dịch...",
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        inputValidator: (value) => {
          if (!value) {
            return "Mã giao dịch không được để trống!";
          }
        },
      });

      if (!isConfirmed) return;

      const transformedData: IReleasePhoneNumber = {
        data_releases: [
          {
            username: user.sub,
            phone_number: data.phone_number,
            contract_code: contractCode,
          },
        ],
      };

      const res = await releasePhoneNumber(transformedData);
      if (res.status === 200) {
        await Swal.fire(
          "Thành công",
          `Đã giải phóng ${selectedRows.length} số điện thoại thành công!`,
          "success"
        );
        setSelectedIds([]);
        setSelectedRows([]);
        await fetchData(quantity, status, offset);
        setSearchParams({});
      }
    } catch (err: any) {
      console.error("Lỗi khi giải phóng số:", err);
      Swal.fire(
        "Lỗi",
        err.response.data.detail || "Có lỗi xảy ra, vui lòng thử lại!",
        "error"
      );
      fetchData(quantity, status, offset);
    } finally {
      setBookLoading(false);
    }
  };
  const handleManyRelease = async () => {
    if (selectedRows.length === 0) {
      alert("Vui lòng chọn ít nhất một số để giải phóng");
      return;
    }

    setBookLoading(true);

    try {
      const { value: contractCode, isConfirmed } = await Swal.fire({
        title: "Nhập Contract Code",
        input: "text",
        inputLabel: `Nhập mã giao dịch cho ${selectedRows.length} số được chọn`,
        inputPlaceholder: "Nhập mã giao dịch...",
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        inputValidator: (value) => {
          if (!value) {
            return "Mã giao dịch không được để trống!";
          }
        },
      });

      if (!isConfirmed) {
        setBookLoading(false);
        return;
      }

      const dataReleases = selectedRows.map((row) => ({
        username: user.sub,
        phone_number: row.phone_number,
        contract_code: contractCode,
      }));

      const transformedData: IReleasePhoneNumber = {
        data_releases: dataReleases,
      };

      const res = await releasePhoneNumber(transformedData);
      if (res.status === 200) {
        await Swal.fire(
          "Thành công",
          `Đã giải phóng ${selectedRows.length} số điện thoại thành công!`,
          "success"
        );
        setSelectedIds([]);
        setSelectedRows([]);
        setSearchParams({});
        await fetchData(quantity, status, offset);
      }
    } catch (err: any) {
      console.error("Lỗi khi triển khai số:", err);
      Swal.fire(
        "Lỗi",
        err.response.data.detail ||
          "Có lỗi xảy ra khi triển khai số, vui lòng thử lại!",
        "error"
      );
    } finally {
      setBookLoading(false);
    }
  };

  const exportExcel = async () => {
    setLoadingProgress(true);
    setProgress(0);

    const limit = 100;
    let currentPage = 0;
    let totalPages = 1;
    let allData = [];

    const waitMinimumTime = new Promise((resolve) => setTimeout(resolve, 3000));

    const fetchAndExport = async () => {
      try {
        const firstRes = await bookingPhoneForOption({
          quantity: limit,
          status,
          offset: currentPage,
        });

        if (firstRes.data) {
          totalPages = firstRes.data.total_pages;
          allData = [...firstRes.data.phone_numbers];
          setProgress(Math.round(((currentPage + 1) / totalPages) * 100));

          while (currentPage < totalPages - 1) {
            currentPage++;
            const nextRes = await bookingPhoneForOption({
              quantity: limit,
              status,
              offset: currentPage,
            });

            if (nextRes.data?.phone_numbers) {
              allData = [...allData, ...nextRes.data.phone_numbers];
            }

            setProgress(Math.round(((currentPage + 1) / totalPages) * 100));
          }
          const titleFile =
            status === "booked"
              ? "Tổng số lượng số đã đặt"
              : status === "available"
              ? "Tổng số lượng số tồn kho"
              : "Tổng số lượng số đã triển khai";
          const nameFile =
            status === "booked"
              ? "all_booked_phone.xlsx"
              : status === "available"
              ? "all_available_phone.xlsx"
              : "all_released_phone.xlsx";
          exportPivotTableToExcel(
            allData,
            "provider_name",
            "type_name",
            nameFile,
            titleFile,
            "Nhà mạng"
          );
        }
      } catch (error) {
        console.error("Error fetching paginated data:", error);
      }
    };

    await Promise.all([fetchAndExport(), waitMinimumTime]);

    setProgress(100);
    setTimeout(() => {
      setLoadingProgress(false);
    }, 300);
  };

  return (
    <>
      {loadingProgress && (
        <div className="w-full mt-4">
          <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute top-0 left-0 w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <span className="absolute inset-0 flex justify-center items-center text-xs font-medium text-white">
              {`${progress} %`}
            </span>
          </div>
        </div>
      )}

      {bookLoading ? (
        <Spinner />
      ) : (
        <>
          <PageBreadcrumb pageTitle="Trạng thái số" />

          <div className="space-y-6">
            <ComponentCard>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <div>
                  <Label>Trạng thái</Label>
                  <Select
                    options={[
                      { label: "Có sẵn", value: "available" },
                      { label: "Đã đặt", value: "booked" },
                      { label: "Đã triển khai", value: "released" },
                    ]}
                    placeholder="Lựa chọn trạng thái"
                    defaultValue={status}
                    onChange={handleChangeStatus}
                    className="dark:bg-dark-900"
                  />
                </div>

                <div>
                  <Label>Tìm kiếm theo số điện thoại</Label>
                  <Input
                    placeholder="Nhập vào số điện thoại tìm kiếm..."
                    name="search"
                    value={search}
                    onChange={onChangeInputSearch}
                    onKeyDown={handleOnKeyDown}
                  />
                </div>
                <div></div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={exportExcel}
                    className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:bg-black dark:text-white">
                    <IoCloudDownloadOutline size={20} />
                  </button>
                </div>

                {status === "booked" && (
                  <div className="flex items-end">
                    <button
                      onClick={handleManyRelease}
                      className="flex dark:bg-black dark:text-white items-center gap-2 border rounded-lg border-gray-300 bg-white p-[10px] text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
                      <CiExport size={24} />
                      Triển khai
                    </button>
                  </div>
                )}
              </div>

              <ReusableTable
                isLoading={loading}
                onCheck={(selectedIds, selectedRows) => {
                  setSelectedIds(selectedIds.map((id) => Number(id)));
                  setSelectedRows(selectedRows);
                }}
                setSelectedIds={setSelectedIds}
                selectedIds={selectedIds}
                error={error}
                title="Danh sách số điện thoại"
                data={safeData}
                columns={getColumns(status)}
                actions={[
                  {
                    icon: <FiEye />,
                    onClick: (row) => handleGetById(Number(row.id)),
                    label: "Chi tiết",
                  },
                  {
                    icon: <MdOutlineNewReleases />,
                    onClick: (row) => handleReleasedNumber(row),
                    label: "Triển khai",
                    condition: () => status === "booked",
                  },
                ]}
                onDelete={(id) => handleDelete(Number(id))}
              />

              <Pagination
                limit={quantity}
                offset={offset}
                totalPages={data?.total_pages ?? 0}
                onPageChange={(limit, newOffset) => {
                  setQuantity(limit);
                  setOffset(newOffset);
                }}
                onLimitChange={(newLimit) => {
                  setQuantity(newLimit);
                  setOffset(1);
                }}
              />
            </ComponentCard>
            <PhoneModalDetail
              onSuccess={() => fetchData(quantity, status, offset)}
              isOpen={openModal}
              onCloseModal={() => setOpenModal(false)}
              data={selectedPhone}
            />
          </div>
        </>
      )}
    </>
  );
}

export default PhoneNumbers;
