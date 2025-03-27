import { useCallback, useState, useRef, useEffect } from "react";
import { IoIosAdd } from "react-icons/io";
import { useSearchParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import PhoneNumberModal from "./PhoneModalAdd";
import { IPhoneNumber, IProvider } from "../../types";
import { getProviders } from "../../services/provider";
import useSelectData from "../../hooks/useSelectData";
import ReusableTable from "../../components/common/ReusableTable";
import { FiEye } from "react-icons/fi";
import { formatDate } from "../../helper/formatDateToISOString";
import {
  booking,
  bookingPhone,
  deletePhone,
  IBookPhoneNumber,
  getPhoneByID,
} from "../../services/phoneNumber";
import Pagination from "../../components/pagination/pagination";
import PhoneModalDetail from "./PhoneModalDetail";

import Swal from "sweetalert2";

interface PhoneNumberProps {
  total_pages: number;
  phone_numbers: IPhoneNumber[];
}

const columns: { key: keyof IPhoneNumber; label: string }[] = [
  { key: "phone_number", label: "Số điện thoại" },
  { key: "provider_name" as "provider_id", label: "Nhà cung cấp" },
  { key: "type_name" as "type_number_id", label: "Loại số" },
  { key: "installation_fee", label: "Phí lắp đặt (đ)" },
  { key: "maintenance_fee", label: "Phí duy trì (đ)" },
  { key: "vanity_number_fee", label: "Phí số đẹp (đ)" },
  { key: "status", label: "Trạng thái" },
];

function PhoneNumberFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [openModalDetail, setOpenModalDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [search, setSearch] = useState<string>(
    searchParams.get("search") || ""
  );
  const [data, setData] = useState<PhoneNumberProps | undefined>(undefined);
  const [provider, setProvider] = useState<string | null>(
    searchParams.get("provider") || null
  );
  const [quantity, setQuantity] = useState(
    Number(searchParams.get("quantity")) || 20
  );
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [previousSearch, setPreviousSearch] = useState<string>("");
  const controllerRef = useRef<AbortController | null>(null);
  const [selectedPhone, setselectedPhone] = useState<IPhoneNumber | null>(null);

  // Set default value of quantity và offset if do not have
  useEffect(() => {
    if (!searchParams.get("quantity") || !searchParams.get("offset")) {
      setSearchParams((prev: any) => {
        const newParams = new URLSearchParams(prev);
        if (!newParams.get("quantity")) newParams.set("quantity", "20");
        if (!newParams.get("offset")) newParams.set("offset", "0");
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);

  // Cleanup AbortController when component unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  // Get list providers
  const { data: providers } = useSelectData<IProvider>({
    service: getProviders,
  });

  // Call api when change properties
  const fetchData = useCallback(async () => {
    // Cancel old request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    let isMounted = true;

    try {
      const response = await bookingPhone({
        offset: offset,
        quantity,
        telco: provider || "",
        search: search || "",
        signal: controller.signal,
      });
      const formatNumber = (num: any) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
      };
      const formattedData = response.data.phone_numbers.map(
        (phone: IPhoneNumber) => ({
          ...phone,
          booked_until: phone.booked_until
            ? formatDate(phone.booked_until)
            : "0",
          installation_fee: formatNumber(phone?.installation_fee),
          maintenance_fee: formatNumber(phone?.maintenance_fee),
          vanity_number_fee: formatNumber(phone?.vanity_number_fee),
        })
      );

      if (isMounted) {
        setData({
          ...response.data,
          phone_numbers: formattedData,
        });
        setSelectedIds([]);

        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("quantity", quantity.toString());
          newParams.set("offset", offset.toString());
          if (provider) newParams.set("provider", provider);
          else newParams.delete("provider");

          if (search) newParams.set("search", search);
          else newParams.delete("search");

          return newParams;
        });
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error when get data:", error);
      }
    }

    return () => {
      isMounted = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [search, provider, quantity, offset, setSearchParams]);

  // Call api when click enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search !== previousSearch) {
      fetchData();
      setPreviousSearch(search);
    }
  };

  // Call API when change offset, quantity, provider
  useEffect(() => {
    fetchData(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, quantity, provider]);

  const handleGetById = async (id: number) => {
    try {
      const res = await getPhoneByID(id);
      if (res?.data) {
        const { type_number_id, ...rest } = res.data;
        const modifiedData = {
          ...rest,
          type_id: type_number_id, // change key name
        };
        setselectedPhone(modifiedData);
        setOpenModalDetail(true);
      }
    } catch (error) {
      console.error("Failed to fetch phone data:", error);
      Swal.fire("Lỗi", "Không thể tải dữ liệu chi tiết", "error");
    }
  };

  const safeData = data?.phone_numbers ?? [];

  // Handle Book Number
  const getIds = (data: any) => {
    setSelectedIds(data);
  };
  const handleBookNumber = async () => {
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 số điện thoại !");
      return;
    }

    const requestBody: IBookPhoneNumber = {
      id_phone_numbers: selectedIds,
    };

    try {
      const res = await booking(requestBody);
      if (res.status === 200) {
        Swal.fire("Book thành công!", "", "success");
        fetchData();
        setSelectedIds([]);
      }
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
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
          Swal.fire({
            title: "Xóa thành công!",
            text: `${res?.data.message}`,
            icon: "success",
          });
          fetchData();
        }
      }
    } catch (error: any) {
      Swal.fire("Lỗi", `${error.response?.data?.detail || "Đã xảy ra lỗi"}`);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Đặt số điện thoại" />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
          <IoIosAdd size={24} />
          Thêm
        </button>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <ComponentCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <Label htmlFor="inputTwo">Tìm kiếm theo đầu số</Label>
              <Input
                type="text"
                id="inputTwo"
                placeholder="Nhập đầu số..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <Label>Nhà cung cấp</Label>
              <Select
                options={[
                  { label: "Tất cả", value: "" },
                  ...providers.map((provider) => ({
                    label: provider.name,
                    value: provider.name,
                    key: provider.id,
                  })),
                ]}
                onChange={(value) => setProvider(value)}
                placeholder="Lựa chọn nhà cung cấp"
              />
            </div>
            <div className="flex items-end ">
              <button
                onClick={() => handleBookNumber()}
                className="flex items-center gap-2 border rounded-lg border-gray-300 bg-white p-[10px] text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
                <IoIosAdd size={24} />
                Book số
              </button>
            </div>
          </div>

          {/* Data table */}
          <ReusableTable
            title="Danh sách số điện thoại"
            data={safeData}
            onCheck={(selectedIds) => getIds(selectedIds)}
            setSelectedIds={setSelectedIds}
            selectedIds={selectedIds}
            columns={columns}
            actions={[
              {
                icon: <FiEye />,
                onClick: (row) => handleGetById(Number(row.id)),
                className: "bg-blue-400 text-white",
              },
            ]}
            onDelete={(id) => handleDelete(Number(id))}
          />

          {/* Pagination */}
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
              setOffset(1); // Reset offset when change limit
            }}
          />
        </ComponentCard>
      </div>

      {/* Modal */}
      <PhoneNumberModal
        isOpen={openModal}
        onCloseModal={() => setOpenModal(false)}
        onSuccess={fetchData}
      />
      <PhoneModalDetail
        isOpen={openModalDetail}
        onCloseModal={() => setOpenModalDetail(false)}
        data={selectedPhone}
        onSuccess={fetchData}
      />
    </>
  );
}

export default PhoneNumberFilters;
