import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

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
// import { formatDate } from "../../helper/formatDateToISOString";
import { FiEye } from "react-icons/fi";
import { formatDate } from "../../helper/formatDateToISOString";
// import { IoIosCall } from "react-icons/io";

interface PhoneNumberProps {
  total_pages: number;
  phone_numbers: IPhoneNumber[];
}

const columns: { key: keyof IPhoneNumber; label: string }[] = [
  { key: "phone_number", label: "Số điện thoại" },
  { key: "provider_name" as "provider_id", label: "Nhà cung cấp" },
  { key: "type_name" as "type_number_id", label: "Loại số" },
  { key: "installation_fee", label: "Phí lắp đặt" },
  { key: "maintenance_fee", label: "Phí duy trì" },
  { key: "vanity_number_fee", label: "Phí số đẹp" },
  { key: "booked_until", label: "Hạn đặt" },
];

function PhoneNumbers() {
  // Get and set values query params
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [selectedPhone, setselectedPhone] = useState<IPhoneNumber | null>(null);
  const [search, setSearch] = useState<string>("");
  const [safeData, setSafeData] = useState<IPhoneNumber[]>([]);

  // Get value from query parameter or set default value
  const [quantity, setQuantity] = useState(
    Number(searchParams.get("quantity")) || 20
  );
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [status, setStatus] = useState(
    searchParams.get("status") || "available"
  );
  const [data, setData] = useState<PhoneNumberProps | undefined>(undefined);

  // Call api when data change
  const fetchData = async (
    quantity: number,
    status: string,
    offset: number
  ) => {
    try {
      const response = await bookingPhoneForOption({
        quantity,
        status,
        offset, // change offset to zero based
      });

      const formattedData = response.data.phone_numbers.map(
        (phone: IPhoneNumber) => ({
          ...phone,
          booked_until: phone.booked_until
            ? formatDate(phone.booked_until)
            : "-", // Format date
        })
      );

      setSafeData(formattedData);
      setData({
        ...response.data,
        phone_numbers: formattedData,
      });

      // Update query params trên URL
      setSearchParams({
        quantity: quantity.toString(),
        status,
        offset: offset.toString(),
      });
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    }
  };

  // Automatically call API when query params change
  useEffect(() => {
    fetchData(quantity, status, offset); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, status, offset]);

  // Handle api when change status
  const handleChangeStatus = (value: string) => {
    setStatus(value);
    setOffset(0); // Reset offset when change status
    fetchData(quantity, value, 0);
  };
  const handleGetById = async (id: number) => {
    try {
      const res = await getPhoneByID(id);
      if (res?.data) {
        const { type_number_id, ...rest } = res.data;
        const modifiedData = {
          ...rest,
          type_id: type_number_id, // Đổi tên key
        };
        setselectedPhone(modifiedData);
        setOpenModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch phone data:", error);
      Swal.fire("Lỗi", "Không thể tải dữ liệu chi tiết", "error");
    }
  };

  // Get description number

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

  return (
    <>
      <PageBreadcrumb pageTitle="Trạng thái số" />

      <div className="space-y-6">
        <ComponentCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <Label>Trạng thái</Label>
              <Select
                options={[
                  { label: "Có sẵn", value: "available" },
                  { label: "Đã đặt", value: "booked" },
                  { label: "Đã triển khai", value: "released" },
                ]}
                placeholder="Lựa chọn trạng thái"
                onChange={handleChangeStatus}
                defaultValue={"available"}
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
          </div>

          {safeData.length > 0 ? (
            <ReusableTable
              title="Danh sách số điện thoại"
              data={safeData}
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
          ) : (
            <div>Không có dữ liệu</div>
          )}

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
  );
}

export default PhoneNumbers;
