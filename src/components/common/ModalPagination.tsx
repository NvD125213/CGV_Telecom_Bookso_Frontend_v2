import React, { useCallback, useEffect, useState, useRef } from "react";
import { IoCaretBackCircleOutline } from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { Modal } from "../../components/ui/modal";
import { formatDate } from "../../helper/formatDateToISOString";
import useSelectData from "../../hooks/useSelectData";
import { revokeNumber } from "../../services/phoneNumber";
import { getProviders } from "../../services/provider";
import { getDetailReportByOption } from "../../services/report";
import { getTypeNumber } from "../../services/typeNumber";
import { RootState } from "../../store";
import { IProvider, IReportDetail, ITypeNumber } from "../../types";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Pagination from "../pagination/pagination";
import Button from "../ui/button/Button";
import ReusableTable from "./ReusableTable";
import { setRevokeSuccess, triggerRefresh } from "../../store/reportSlice";
import { resetSelectedIds } from "../../store/selectedPhoneSlice";
import { getPhoneByID } from "../../services/phoneNumber";
import TableMobile, {
  ActionButton,
  LabelValueItem,
} from "../../mobiles/TableMobile";
import { useScreenSize } from "../../hooks/useScreenSize";
import ResponsiveFilterWrapper from "./FlipperWrapper";
import CustomModal from "./CustomModal";
import ViewIcon from "@mui/icons-material/Visibility";
import FloatingActionPanel from "./FloatingActionPanel";

interface Column {
  key: string;
  label: string;
}

interface ModalPaginationProps {
  isOpen: boolean;
  title: string;
  description?: string;
  columns: Column[];
  option: string;
  year?: number;
  month?: number;
  day?: number;
  type_number?: string;
  telco?: string;
  username?: string;
  filter?: string;
  onClose: () => void;
  selectedIdsProp?: number[];
  setSelectedIdsProp?: React.Dispatch<React.SetStateAction<number[]>>;
  currentPage: number;
  pageSize: number;
  onSuccess?: () => Promise<void>;
}

const ModalPagination: React.FC<ModalPaginationProps> = ({
  isOpen,
  title,
  description,
  columns,
  option,
  year,
  month,
  day,
  telco,
  type_number,
  username,
  filter,
  onClose,
  selectedIdsProp,
  setSelectedIdsProp,
  currentPage = 0,
  pageSize = 1,
  onSuccess,
}) => {
  const [searchUserName, setSearchUserName] = useState("");
  const [searchNumber, setSearchNumber] = useState("");
  const [searchTelco, setSearchTelco] = useState("");
  const [searchTypeNumber, setSearchTypeNumber] = useState("");
  const [apiSearchParams, setApiSearchParams] = useState({
    username: "",
    number: "",
    telco: "",
    typeNumber: "",
  });

  // Sử dụng useRef để theo dõi các thay đổi và tránh gọi API không cần thiết
  const hasFetchedRef = useRef(false);
  const lastFetchParamsRef = useRef<any>(null);
  const isInitialMountRef = useRef(true);

  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    limit: [10, 20, 50, 100].includes(pageSize) ? pageSize : 10,
    offset: currentPage,
    totalPages: 1,
  });

  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const selectedIdsFromStore = useSelector(
    (state: RootState) => state.selectedPhone.selectedIds
  );

  // Tạo object chứa tất cả các tham số để so sánh
  const getCurrentParams = useCallback(
    () => ({
      isOpen,
      option,
      limit: pagination.limit,
      offset: pagination.offset,
      year:
        typeof year === "number" && !isNaN(year)
          ? year
          : new Date().getFullYear(),
      month: typeof month === "number" ? month : new Date().getMonth() + 1,
      day: day ? Number(day) : undefined,
      telco: apiSearchParams.telco || telco,
      filter: apiSearchParams.number || filter,
      type_number: apiSearchParams.typeNumber || type_number,
      username: apiSearchParams.username || username,
    }),
    [
      isOpen,
      option,
      pagination.limit,
      pagination.offset,
      year,
      month,
      day,
      telco,
      filter,
      type_number,
      username,
      apiSearchParams,
    ]
  );

  // Kiểm tra xem có cần fetch data hay không
  const shouldFetchData = useCallback(() => {
    const currentParams = getCurrentParams();

    // Nếu modal chưa mở, không fetch
    if (!currentParams.isOpen) return false;

    // Nếu là lần đầu mount và modal đang mở, cần fetch
    if (isInitialMountRef.current && currentParams.isOpen) {
      isInitialMountRef.current = false;
      return true;
    }

    // So sánh với lần fetch cuối cùng
    if (lastFetchParamsRef.current === null) {
      return true;
    }

    // So sánh từng tham số
    const lastParams = lastFetchParamsRef.current;
    return (
      currentParams.option !== lastParams.option ||
      currentParams.limit !== lastParams.limit ||
      currentParams.offset !== lastParams.offset ||
      currentParams.year !== lastParams.year ||
      currentParams.month !== lastParams.month ||
      currentParams.day !== lastParams.day ||
      currentParams.telco !== lastParams.telco ||
      currentParams.filter !== lastParams.filter ||
      currentParams.type_number !== lastParams.type_number ||
      currentParams.username !== lastParams.username
    );
  }, [getCurrentParams]);

  const fetchData = useCallback(async () => {
    if (!shouldFetchData()) return;

    setIsLoading(true);
    setError("");
    try {
      const currentParams = getCurrentParams();

      const response = await getDetailReportByOption({
        option: currentParams.option || undefined,
        limit: currentParams.limit,
        offset: currentParams.offset,
        year: currentParams.year,
        month: currentParams.month,
        day: currentParams.day,
        telco: currentParams.telco,
        filter: currentParams.filter,
        type_number: currentParams.type_number,
        username: currentParams.username,
      });

      const formattedData = response.data.data.map((item: any) => ({
        ...item,
        booked_until: item.booked_until ? formatDate(item.booked_until) : "0",
        booked_at: item.booked_at ? formatDate(item.booked_at) : "0",
        released_at: item.released_at ? formatDate(item.released_at) : "0",
      }));

      setData(formattedData);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.total_pages,
      }));

      // Cập nhật tham số cuối cùng đã fetch
      lastFetchParamsRef.current = currentParams;
      hasFetchedRef.current = true;
    } catch (error: any) {
      console.log("Lỗi khi lấy dữ liệu:", error.response?.data?.detail);
      setError(
        error.response?.data?.detail || "Đã xảy ra lỗi, vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  }, [shouldFetchData, getCurrentParams]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchUserName("");
      setSearchNumber("");
      setSearchTelco("");
      setSearchTypeNumber("");
      setApiSearchParams({
        username: "",
        number: "",
        telco: "",
        typeNumber: "",
      });
      setError("");
      setData([]);
      setPagination({
        limit: [10, 20, 50, 100].includes(pageSize) ? pageSize : 10,
        offset: currentPage,
        totalPages: 1,
      });
      // Reset selectedIds when modal closes
      dispatch(resetSelectedIds());
      setSelectedIdsProp?.([]);

      // Reset refs khi modal đóng
      hasFetchedRef.current = false;
      lastFetchParamsRef.current = null;
      isInitialMountRef.current = true;
    }
  }, [isOpen, pageSize, currentPage, dispatch, setSelectedIdsProp]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      dispatch(resetSelectedIds());
      setSelectedIdsProp?.([]);
    };
  }, [dispatch, setSelectedIdsProp]);

  // Fetch data khi có thay đổi
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle empty data state
  useEffect(() => {
    if (!isLoading && data.length === 0 && isOpen) {
      setError("Không có dữ liệu");
    } else {
      setError("");
    }
  }, [data, isLoading, isOpen]);

  // Fix: Separate handlers for desktop and mobile pagination
  const handlePageChange = (newLimit: number, newOffset: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      offset: newOffset,
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    // Đảm bảo newLimit nằm trong danh sách hợp lệ
    const validLimits = [10, 20, 50, 100];
    const validLimit = validLimits.includes(newLimit) ? newLimit : 10;

    setPagination((prev) => ({
      ...prev,
      limit: validLimit,
      offset: 0, // Reset to first page
    }));
  };

  // Fix: Add separate handler for mobile page change
  const handleMobilePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      offset: page - 1, // Convert 1-based to 0-based
    }));
  };

  // Fix: Add separate handler for mobile items per page change
  const handleMobileItemsPerPageChange = (newQuantity: number) => {
    const validLimits = [10, 20, 50, 100];
    const validLimit = validLimits.includes(newQuantity) ? newQuantity : 10;

    setPagination((prev) => ({
      ...prev,
      limit: validLimit,
      offset: 0, // Reset to first page
    }));
  };

  const { data: providers } = useSelectData<IProvider>({
    service: getProviders,
  });

  const { data: types } = useSelectData<ITypeNumber>({
    service: getTypeNumber,
  });

  const handleRevoke = async () => {
    if (selectedIdsFromStore.length === 0) {
      alert("Vui lòng chọn ít nhất một số để thu hồi");
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
            setSelectedIdsProp?.([]);
            dispatch(setRevokeSuccess(true));
            dispatch(triggerRefresh());
            // Force refetch data after revoke
            lastFetchParamsRef.current = null;
            fetchData();
            onSuccess?.();
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
      setSelectedIdsProp?.([]);
      // Force refetch data after error
      lastFetchParamsRef.current = null;
      await fetchData();
    }
  };

  // Xử lý dữ liệu cho mobile
  const { isMobile } = useScreenSize();
  const convertToMobileData = (data: IReportDetail[]): LabelValueItem[][] => {
    return data.map((item) => [
      { label: "ID", value: item.id, hidden: true },
      {
        label: "Số điện thoại",
        value: item.phone_number || "N/A",
      },
      { label: "Trạng thái", value: item.status || "N/A" },

      {
        label: "Nhà mạng",
        value: item.provider_name || "N/A",
      },
      { label: "Loại số", value: item.type_name || "N/A" },
    ]);
  };

  const [isOpenDetail, setIsOpenDetail] = useState(false);

  const handleViewDetail = async (id: string) => {
    if (!id) return;
    const res = await getPhoneByID(Number(id));
    if (res?.status == 200) {
      const data = res.data;
      const formattedData = {
        ...data,
        booked_until: data.booked_until ? formatDate(data.booked_until) : "0",
        booked_at: data.booked_at ? formatDate(data.booked_at) : "0",
        released_at: data.released_at ? formatDate(data.released_at) : "0",
      };

      return (
        <CustomModal
          isOpen={isOpenDetail}
          onClose={() => {
            setIsOpenDetail(false);
          }}
          title="Chi tiết số điện thoại"
          description="Chi tiết số điện thoại"
          fields={formattedData}
        />
      );
    }
  };

  // Chỉ lấy data cho trang hiện tại khi sử dụng TableMobile
  const mobileData = convertToMobileData(data);
  const actions: ActionButton[] = [
    {
      icon: <ViewIcon />,
      label: "Xem chi tiết",
      onClick: handleViewDetail,
      color: "primary",
    },
    ...(option == "booked"
      ? [
          {
            icon: <IoCaretBackCircleOutline />,
            label: "Thu hồi",
            onClick: handleRevoke,
            color: "error" as const,
          },
        ]
      : []),
  ];

  // Function to get status class based on current status
  const getStatusClass = () => {
    switch (option) {
      case "available":
        return "uppercase text-[10px] border border-green-500 rounded-full py-1 text-center shadow-sm dark:shadow-green-400/40 bg-green-100 dark:bg-green-500/40 backdrop-blur-sm dark:border-green-400 text-green-500";
      case "booked":
        return "uppercase text-[10px] border border-yellow-500 rounded-full py-1 text-center shadow-sm dark:shadow-yellow-400/40 bg-yellow-100 dark:bg-yellow-500/40 backdrop-blur-sm dark:border-yellow-400 text-yellow-500";
      case "released":
        return "uppercase text-[10px] border border-red-500 rounded-full py-1 text-center shadow-sm dark:shadow-red-400/40 bg-red-100 dark:bg-red-500/40 backdrop-blur-sm dark:border-red-400 text-red-500";
      default:
        return "uppercase text-[10px] border border-gray-500 py-1 rounded-full text-center shadow-sm dark:shadow-gray-400/40 bg-gray-100 dark:bg-gray-500/40 backdrop-blur-sm dark:border-gray-400";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`max-w-[90%] min-h-[600px] ${
        isMobile ? "max-w-[100%] w-full h-full" : ""
      }`}>
      <div
        className={`relative w-full max-h-[70vh] overflow-y-auto bg-white rounded-tl-3xl rounded-br-3xl dark:bg-gray-900 lg:p-11 ${
          isMobile ? "p-1 rounded-none h-full max-h-full" : ""
        }`}>
        <div className="px-2 pr-14">
          <h4
            className={`mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 ${
              isMobile ? "text-[18px] p-2" : ""
            }`}>
            {title}
          </h4>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {description}
            </p>
          )}
        </div>

        <ResponsiveFilterWrapper>
          <div className="grid gap-4 py-3 md:grid-cols-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Tìm kiếm theo nhân viên
              </label>
              <Input
                type="text"
                id="username"
                placeholder="Nhập tên nhân viên..."
                value={searchUserName}
                onChange={(e) => setSearchUserName(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Tìm kiếm theo số điện thoại
              </label>
              <Input
                type="text"
                id="filter"
                placeholder="Nhập số điện thoại..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Tìm kiếm theo loại số
              </label>
              <Select
                options={[
                  { label: "Tất cả", value: "" },
                  ...types.map((type) => ({
                    label: type.name,
                    value: type.name,
                    key: type.id,
                  })),
                ]}
                className="dark:bg-black dark:text-white "
                onChange={(value: any) => {
                  setSearchTypeNumber(value);
                }}
                placeholder="Chọn nhà mạng"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Tìm kiếm theo nhà mạng
              </label>
              <Select
                options={[
                  { label: "Tất cả", value: "" },
                  ...providers.map((provider) => ({
                    label: provider.name,
                    value: provider.name,
                    key: provider.id,
                  })),
                ]}
                className="dark:bg-black dark:text-white "
                onChange={(value: any) => {
                  setSearchTelco(value);
                }}
                placeholder="Chọn loại số"
              />
            </div>
            <div className="flex justify-start items-end gap-2">
              <Button
                onClick={() => {
                  setApiSearchParams({
                    username: searchUserName,
                    number: searchNumber,
                    telco: searchTelco,
                    typeNumber: searchTypeNumber,
                  });
                  // Force refetch khi thay đổi search params
                  lastFetchParamsRef.current = null;
                }}
                className="px-4 py-3 max-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Tìm kiếm
              </Button>
            </div>
          </div>
        </ResponsiveFilterWrapper>
        <FloatingActionPanel>
          {user.role === 1 && option == "booked" && (
            <div className="flex items-center gap-2 justify-end mb-4">
              <button
                onClick={handleRevoke}
                className="flex dark:bg-black dark:text-white items-center gap-2 border rounded-lg border-gray-300 bg-white p-[10px] text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
                <IoCaretBackCircleOutline size={22} />
                Thu hồi
              </button>
            </div>
          )}
        </FloatingActionPanel>

        {isMobile ? (
          <TableMobile
            pageTitle={`Danh sách số ${option}`}
            data={mobileData}
            hideCheckbox={option == "booked" ? false : true}
            hidePagination={false}
            disabledReset={option == "booked" ? false : true}
            useTailwindStyling={true}
            showAllData={false}
            actions={actions}
            itemsPerPageOptions={[10, 20, 50, 100]}
            totalPages={pagination.totalPages}
            currentPage={pagination.offset + 1}
            onPageChange={handleMobilePageChange}
            onItemsPerPageChange={handleMobileItemsPerPageChange}
            labelClassNames={{
              "Nhà cung cấp": "text-[13px]",
              "Trạng thái": "text-[13px]",
              "Loại số": "text-[13px]",
              "Số điện thoại": "text-[13px]",
            }}
            valueClassNames={{
              "Số điện thoại":
                "text-[12px] tracking-wider bg-blue-100 dark:bg-blue-500/40 align-middle rounded-full border border-blue-200 py-1 dark:border-blue-400 shadow-sm dark:shadow-blue-400/30 backdrop-blur-sm font-semibold dark:text-[#03e3fc]",
              "Nhà cung cấp": "text-[13px] backdrop-blur-sm dark:text-gray-200",
              "Loại số": "text-[13px] backdrop-blur-sm dark:text-gray-200",
              "Nhà mạng": "text-[13px] backdrop-blur-sm dark:text-gray-200",
              "Trạng thái": getStatusClass(),
            }}
          />
        ) : (
          <>
            <ReusableTable
              title={title}
              error={error}
              data={data}
              columns={columns}
              selectedIds={selectedIdsProp}
              role={user.role}
              setSelectedIds={setSelectedIdsProp}
              pagination={{
                currentPage: pagination.offset,
                pageSize: pagination.limit,
              }}
              onCheck={(selectedIds) => {
                if (setSelectedIdsProp) {
                  setSelectedIdsProp(selectedIds.map((id) => Number(id)));
                }
              }}
              isLoading={isLoading}
            />

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Pagination
                limit={pagination.limit}
                offset={pagination.offset}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ModalPagination;
