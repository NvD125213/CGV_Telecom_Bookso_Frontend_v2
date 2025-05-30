import React, { useCallback, useEffect, useState } from "react";
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
import { IProvider, ITypeNumber } from "../../types";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Pagination from "../pagination/pagination";
import Button from "../ui/button/Button";
import ReusableTable from "./ReusableTable";
import { setRevokeSuccess, triggerRefresh } from "../../store/reportSlice";
import {
  resetSelectedIds,
  setSelectedIds,
} from "../../store/selectedPhoneSlice";
import { getPhoneByID } from "../../services/phoneNumber";

import { IPhoneNumber } from "../../types";

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
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    limit: pageSize,
    offset: currentPage,
    totalPages: 1,
  });

  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const selectedIdsFromStore = useSelector(
    (state: RootState) => state.selectedPhone.selectedIds
  );

  const fetchData = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    setError("");
    try {
      const now = new Date();
      const validYear =
        typeof year === "number" && !isNaN(year) ? year : now.getFullYear();

      const response = await getDetailReportByOption({
        option: option || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
        year: validYear,
        month: typeof month === "number" ? month : now.getMonth() + 1,
        day: day ? Number(day) : undefined,
        telco: apiSearchParams.telco || telco,
        filter: apiSearchParams.number || filter,
        type_number: apiSearchParams.typeNumber || type_number,
        username: apiSearchParams.username || username,
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
    } catch (error: any) {
      console.log("Lỗi khi lấy dữ liệu:", error.response?.data?.detail);
      setError(
        error.response?.data?.detail || "Đã xảy ra lỗi, vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
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
  ]);

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
        limit: pageSize,
        offset: currentPage,
        totalPages: 1,
      });
      // Reset selectedIds when modal closes
      dispatch(resetSelectedIds());
      setSelectedIdsProp?.([]);
    }
  }, [isOpen, pageSize, currentPage, dispatch, setSelectedIdsProp]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      dispatch(resetSelectedIds());
      setSelectedIdsProp?.([]);
    };
  }, [dispatch, setSelectedIdsProp]);

  // Fetch data when modal opens or pagination changes
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, pagination.limit, pagination.offset, apiSearchParams]);

  // Handle empty data state
  useEffect(() => {
    if (!isLoading && data.length === 0 && isOpen) {
      setError("Không có dữ liệu");
    } else {
      setError("");
    }
  }, [data, isLoading, isOpen]);

  const handlePageChange = (newLimit: number, newOffset: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      offset: newOffset,
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      offset: 0,
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
      await fetchData();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[90%] min-h-[600px] m-4">
      <div className="relative w-full max-h-[70vh] overflow-y-auto bg-white rounded-tl-3xl rounded-br-3xl dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          {description && (
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {description}
            </p>
          )}
        </div>

        <div className="grid gap-4 mb-6 py-3 md:grid-cols-5">
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
              }}
              className="px-4 py-3 max-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
              Tìm kiếm
            </Button>
            {user.role === 1 && option == "booked" && (
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
      </div>
    </Modal>
  );
};

export default ModalPagination;
