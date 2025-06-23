import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FiDelete, FiEdit, FiEye } from "react-icons/fi";
import {
  IoCaretBackCircleOutline,
  IoCloudDownloadOutline,
} from "react-icons/io5";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/LoadingSpinner";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ReusableTable from "../../components/common/ReusableTable";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Pagination from "../../components/pagination/pagination";
import exportPivotTableToExcel from "../../helper/exportDataToExcel";
import { formatDate } from "../../helper/formatDateToISOString";
import useSelectData from "../../hooks/useSelectData";
import {
  bookingPhoneForOption,
  deletePhone,
  getPhoneByID,
  revokeNumber,
} from "../../services/phoneNumber";
import { getProviders } from "../../services/provider";
import { getTypeNumber } from "../../services/typeNumber";
import { RootState } from "../../store";
import { IPhoneNumber, IProvider, ITypeNumber } from "../../types";
import PhoneModalDetail from "./PhoneModalDetail";
import { useDispatch } from "react-redux";
import { resetSelectedIds } from "../../store/selectedPhoneSlice";
import { formatPhoneNumber } from "../../helper/formatPhoneNumber";
import TableMobile, {
  ActionButton,
  LabelValueItem,
} from "../../mobiles/TableMobile";
import ResponsiveFilterWrapper from "../../components/common/FlipperWrapper";
import { useScreenSize } from "../../hooks/useScreenSize";

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
      { key: "created_at" as keyof IPhoneNumber, label: "Ngày tạo" },
    ];
  }
  if (status === "booked") {
    return [
      ...columns,
      { key: "user_name" as keyof IPhoneNumber, label: "Người book" },
      { key: "updated_at" as keyof IPhoneNumber, label: "Ngày đặt" },
      { key: "booked_until" as keyof IPhoneNumber, label: "Hạn đặt" },
    ];
  }
  if (status === "released") {
    return [
      ...columns,
      { key: "user_name" as keyof IPhoneNumber, label: "Người book" },
      {
        key: "user_name_release" as keyof IPhoneNumber,
        label: "Người triển khai",
      },
      { key: "released_at" as keyof IPhoneNumber, label: "Ngày triển khai" },
    ];
  }

  return columns;
};

function PhoneNumbers() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<IPhoneNumber | null>(null);
  const [search, setSearch] = useState<string>("");
  const [searchProvider, setSearchProvider] = useState<string>("");
  const [searchTypeNumber, setSearchTypeNumber] = useState<string>("");

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
  const [exportOption, setExportOption] = useState("status");
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const user = useSelector((state: RootState) => state.auth.user);

  // Get list providers
  const { data: providers } = useSelectData<IProvider>({
    service: getProviders,
  });

  // Get list type number
  const { data: type_numbers } = useSelectData<ITypeNumber>({
    service: getTypeNumber,
  });

  const selectedIdsFromStore = useSelector(
    (state: RootState) => state.selectedPhone.selectedIds
  );

  const prevSelectedIdsRef = useRef(selectedIdsFromStore);

  // Add cleanup effect specifically for booked status
  useEffect(() => {
    return () => {
      if (status === "booked") {
        dispatch(resetSelectedIds());
      }
    };
  }, [dispatch, status]);

  // Track selectedIds changes without causing re-renders
  useEffect(() => {
    if (
      status === "booked" &&
      prevSelectedIdsRef.current !== selectedIdsFromStore
    ) {
      prevSelectedIdsRef.current = selectedIdsFromStore;
    }
  }, [selectedIdsFromStore, status]);

  const handleChangeStatus = (value: string) => {
    setStatus(value);
    setOffset(0);
    // Reset selectedIds when status changes
    dispatch(resetSelectedIds());
    setSelectedIds([]);
    setSelectedRows([]);
    fetchData(quantity, value, 0, search, searchProvider, searchTypeNumber);
  };

  const fetchData = async (
    quantity: number,
    status: string,
    offset: number,
    search?: string,
    provider?: string,
    type_number?: string
  ) => {
    setLoading(true);
    try {
      const response = await bookingPhoneForOption({
        quantity,
        status,
        offset,
        search: search?.trim(),
        provider: provider?.trim(),
        type_number: type_number?.trim(),
      });

      const formatNumber = (num: any) =>
        num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
      const formattedData = response.data.phone_numbers.map(
        (phone: IPhoneNumber) => ({
          ...phone,
          phone_number:
            status == "available" && user.role !== 1
              ? formatPhoneNumber(phone.phone_number)
              : phone.phone_number,
          booked_until: phone.booked_until
            ? formatDate(phone.booked_until)
            : "0",
          updated_at: phone.updated_at ? formatDate(phone.updated_at) : "0",
          created_at: phone.created_at ? formatDate(phone.created_at) : "0",
          released_at: phone.released_at ? formatDate(phone.released_at) : "0",
          installation_fee: formatNumber(phone?.installation_fee),
          maintenance_fee: formatNumber(phone?.maintenance_fee),
          vanity_number_fee: formatNumber(phone?.vanity_number_fee),
        })
      );

      // Update selectedRows based on selectedIds from store
      const updatedSelectedRows = formattedData.filter((phone: IPhoneNumber) =>
        selectedIdsFromStore.includes(Number(phone.id))
      );
      setSelectedRows(updatedSelectedRows);

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

      // Only include non-empty parameters in the URL
      const params: Record<string, string> = {
        quantity: quantity.toString(),
        status,
        offset: offset.toString(),
      };

      if (search) {
        params.search = search;
      }

      if (provider) {
        params.provider = provider;
      }

      if (type_number) {
        params.type_number = type_number;
      }

      setSearchParams(params);
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(
      quantity,
      status,
      offset,
      search,
      searchProvider,
      searchTypeNumber
    ); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, status, offset]);

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

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (search == "") {
        const originalData = data?.phone_numbers ?? [];
        fetchData(
          quantity,
          status,
          offset,
          search,
          searchProvider,
          searchTypeNumber
        );
        setError(originalData.length === 0 ? "Không có dữ liệu" : "");
      } else {
        const result = handleSearch(search) ?? [];
        fetchData(
          quantity,
          status,
          offset,
          search,
          searchProvider,
          searchTypeNumber
        );
        setError(result.length === 0 ? "Không có dữ liệu" : "");
      }
    }
  };

  const handleDelete = async (id: any) => {
    if (typeof id !== "number" || isNaN(id)) {
      console.error("Invalid ID:", id);
      Swal.fire("Oops...", "ID không hợp lệ", "error");
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
      if (error.status === 403) {
        Swal.fire({
          title: "Oops...",
          text: "Bạn không có quyền thực hiện hành động này",
          icon: "error",
        });
      } else {
        Swal.fire("Oops...", `${error || "Đã xảy ra lỗi"}`);
      }
    }
  };

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
            fetchData(
              quantity,
              status,
              offset,
              search,
              searchProvider,
              searchTypeNumber
            );
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
      await fetchData(
        quantity,
        status,
        offset,
        search,
        searchProvider,
        searchTypeNumber
      );
    }
  };

  const handleExport = async (typeExport: any) => {
    setLoadingProgress(true);
    setProgress(0);

    const limit = 100;
    let allData: any[] = [];

    const waitMinimumTime = new Promise((resolve) => setTimeout(resolve, 3000));

    const updateProgress = (current: number, total: number) => {
      const percentage = Math.min(100, Math.round((current / total) * 100));
      setProgress(percentage);
    };

    if (typeExport === "status") {
      if (!status) {
        console.error("Status is not provided");
        setLoadingProgress(false);
        return;
      }

      let currentPage = 0;
      let totalPages = 1;
      let statusData: any[] = [];

      try {
        const firstRes = await bookingPhoneForOption({
          search: "",
          quantity: limit,
          status,
          offset: currentPage,
        });

        if (firstRes?.data?.phone_numbers) {
          totalPages = firstRes.data.total_pages || 1;
          statusData = [...firstRes.data.phone_numbers];

          updateProgress(1, totalPages);

          for (currentPage = 1; currentPage < totalPages; currentPage++) {
            const nextRes = await bookingPhoneForOption({
              quantity: limit,
              status,
              offset: currentPage,
              search: "",
            });

            if (nextRes?.data?.phone_numbers) {
              statusData = [...statusData, ...nextRes.data.phone_numbers];
            }

            updateProgress(currentPage + 1, totalPages);
          }

          exportPivotTableToExcel(
            statusData,
            "provider_name",
            "type_name",
            `${status}_data.xlsx`,
            `Danh sách số theo trạng thái: ${status}`,
            "Nhà mạng"
          );
        } else {
          console.error("No data returned from API for status:", status);
        }
      } catch (error) {
        console.error(`Error fetching data for status ${status}:`, error);
      }

      await waitMinimumTime;
      setProgress(100);
      setLoadingProgress(false);
      return;
    }

    if (typeExport === "allStatus") {
      const statuses = ["available", "booked", "released"];
      let totalRequests = 0;
      let finishedRequests = 0;

      // First, determine total pages for each status
      const pagesPerStatus: Record<string, number> = {};
      for (const status of statuses) {
        try {
          const res = await bookingPhoneForOption({
            quantity: limit,
            status,
            offset: 0,
            search: "",
          });
          pagesPerStatus[status] = res?.data?.total_pages || 1;
          totalRequests += pagesPerStatus[status];
        } catch (err) {
          pagesPerStatus[status] = 0;
          console.error(`Error getting total pages for status ${status}`, err);
        }
      }

      const fetchDataByStatus = async (status: string) => {
        let statusData: any[] = [];
        const totalPages = pagesPerStatus[status];

        for (let page = 0; page < totalPages; page++) {
          try {
            const res = await bookingPhoneForOption({
              quantity: limit,
              status,
              offset: page,
              search: "",
            });

            if (res?.data?.phone_numbers) {
              statusData = [...statusData, ...res.data.phone_numbers];
            }
          } catch (error) {
            console.error(
              `Error fetching data for status ${status} at page ${page}`,
              error
            );
          }

          finishedRequests++;
          updateProgress(finishedRequests, totalRequests);
        }

        const dataWithStatus = statusData.map((item) => ({
          ...item,
          status,
        }));

        allData = [...allData, ...dataWithStatus];
      };

      for (const status of statuses) {
        await fetchDataByStatus(status);
      }

      exportPivotTableToExcel(
        allData,
        "provider_name",
        "status",
        "all_statuses_pivot.xlsx",
        "Tổng hợp số theo nhà mạng và trạng thái",
        "Nhà mạng"
      );

      await waitMinimumTime;
      setProgress(100);
      setLoadingProgress(false);
    }
  };

  // Xử lý dữ liệu cho TableMobile
  const convertToMobileData = (data: IPhoneNumber[]): LabelValueItem[][] => {
    return data.map((item) => [
      { label: "ID", value: item.id ?? "N/A", hidden: true },
      { label: "Trạng thái", value: item.status ?? "N/A" },
      { label: "Số điện thoại", value: item.phone_number ?? "N/A" },
      { label: "Nhà cung cấp", value: item.provider_name ?? "N/A" },
      { label: "Loại số", value: item.type_name ?? "N/A" },
    ]);
  };

  const dataMobile = convertToMobileData(safeData);

  const actions: ActionButton[] = [
    {
      icon: <FiEye />,
      label: "Xem chi tiết",
      onClick: (id) => handleGetById(Number(id)),
      color: "primary",
    },
    {
      icon: <FiDelete />,
      label: "Xóa",
      onClick: (id) => handleDelete(Number(id)),
      color: "error",
    },
  ];
  const { isMobile } = useScreenSize();

  // Function to get status class based on current status
  const getStatusClass = () => {
    switch (status) {
      case "available":
        return "text-[14px] border border-green-500 px-9 py-1 rounded-full text-center shadow-sm dark:shadow-green-400/40 bg-green-100 dark:bg-green-500/40 backdrop-blur-sm dark:border-green-400";
      case "booked":
        return "text-[14px] border border-yellow-500 px-9 py-1 rounded-full text-center shadow-sm dark:shadow-yellow-400/40 bg-yellow-100 dark:bg-yellow-500/40 backdrop-blur-sm dark:border-yellow-400";
      case "released":
        return "text-[14px] border border-red-500 px-9 py-1 rounded-full text-center shadow-sm dark:shadow-red-400/40 bg-red-100 dark:bg-red-500/40 backdrop-blur-sm dark:border-red-400";
      default:
        return "text-[14px] border border-gray-500 px-9 py-1 rounded-full text-center shadow-sm dark:shadow-gray-400/40 bg-gray-100 dark:bg-gray-500/40 backdrop-blur-sm dark:border-gray-400";
    }
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
            <ResponsiveFilterWrapper drawerTitle="Bộ lọc trạng thái số ">
              <div
                className={`grid grid-cols-1 items-end gap-4 lg:grid-cols-3`}>
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
                  <Label htmlFor="inputTwo">Tìm kiếm theo đầu số</Label>
                  <Input
                    type="text"
                    id="inputTwo"
                    placeholder="Nhập đầu số..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleOnKeyDown}
                  />
                </div>
                <div>
                  <Label htmlFor="providerSelect">
                    Tìm kiếm theo nhà cung cấp
                  </Label>
                  <Select
                    options={[
                      { label: "Tất cả", value: "" },
                      ...(providers?.map((provider) => ({
                        label: provider.name,
                        value: provider.name,
                      })) || []),
                    ]}
                    placeholder="Chọn nhà cung cấp..."
                    defaultValue={searchProvider}
                    onChange={(value) => {
                      setSearchProvider(value);
                      fetchData(
                        quantity,
                        status,
                        offset,
                        search,
                        value,
                        searchTypeNumber
                      );
                    }}
                    className="dark:bg-dark-900"
                  />
                </div>
                <div>
                  <Label htmlFor="typeSelect">Tìm kiếm theo định dạng số</Label>
                  <Select
                    options={[
                      { label: "Tất cả", value: "" },
                      ...(type_numbers?.map((type) => ({
                        label: type.name,
                        value: type.name,
                      })) || []),
                    ]}
                    placeholder="Chọn định dạng số..."
                    defaultValue={searchTypeNumber}
                    onChange={(value) => {
                      console.log("Type number selected:", value); // Debug log
                      setSearchTypeNumber(value);
                      // Make sure we're passing the current search and provider values
                      fetchData(
                        quantity,
                        status,
                        offset,
                        search,
                        searchProvider,
                        value
                      );
                    }}
                    className="dark:bg-dark-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    placeholder="Option export"
                    className="flex-2"
                    onChange={(value) => setExportOption(value)}
                    options={[
                      {
                        label: "Theo trạng thái",
                        value: "status",
                      },
                      {
                        label: "Tổng hợp",
                        value: "allStatus",
                      },
                    ]}
                  />

                  <button
                    onClick={() => handleExport(exportOption)}
                    className="flex flex-1 items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:bg-black dark:text-white">
                    <IoCloudDownloadOutline size={20} />
                  </button>
                </div>
                {status === "booked" && user.role === 1 && (
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
            </ResponsiveFilterWrapper>
            {isMobile ? (
              <TableMobile
                pageTitle="Trạng thái số"
                data={dataMobile}
                hideCheckbox={false}
                hidePagination={false}
                useTailwindStyling={true}
                showAllData={false}
                actions={actions as ActionButton[]}
                defaultItemsPerPage={quantity}
                itemsPerPageOptions={[10, 20, 50, 100]}
                totalPages={data?.total_pages ?? 0}
                currentPage={offset + 1}
                onPageChange={(page) => setOffset(page - 1)}
                onItemsPerPageChange={(newQuantity) => {
                  setQuantity(newQuantity);
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
                    " text-sm tracking-wider bg-blue-100 dark:bg-blue-500/40 align-middle rounded-full border border-blue-200 px-5 py-1 dark:border-blue-400 shadow-sm dark:shadow-blue-400/30 backdrop-blur-sm font-semibold",
                  "Nhà cung cấp":
                    "text-[14px] backdrop-blur-sm dark:text-gray-200",
                  "Loại số": "text-[14px] backdrop-blur-sm dark:text-gray-200",
                  "Trạng thái": getStatusClass(),
                }}
              />
            ) : (
              <>
                <ReusableTable
                  disabled={status === "available" || status === "released"}
                  disabledReset={
                    status === "available" || status === "released"
                  }
                  isLoading={loading}
                  onCheck={(selectedIds, selectedRows) => {
                    setSelectedIds(selectedIds.map((id) => Number(id)));
                    setSelectedRows(selectedRows);
                  }}
                  role={user.role}
                  setSelectedIds={setSelectedIds}
                  selectedIds={selectedIds}
                  error={error}
                  title="Danh sách số điện thoại"
                  data={safeData}
                  columns={getColumns(status)}
                  pagination={{
                    currentPage: offset,
                    pageSize: quantity,
                  }}
                  actions={[
                    {
                      icon: <FiEye />,
                      onClick: (row) => handleGetById(Number(row.id)),
                      label: "Chi tiết",
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
              </>
            )}
            <PhoneModalDetail
              role={user.role}
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
