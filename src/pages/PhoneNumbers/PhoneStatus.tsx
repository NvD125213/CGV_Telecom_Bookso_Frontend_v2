import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { IPhoneNumber } from "../../types";

import { bookingPhoneForOption } from "../../services/phoneNumber";
import ReusableTable from "../../components/common/ReusableTable";
import Pagination from "../../components/pagination/pagination";
import PhoneModalDetail from "./PhoneModalDetail";
import { formatDate } from "../../helper/formatDateToISOString";
import { FiEye } from "react-icons/fi";
import { IoIosCall } from "react-icons/io";

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
  { key: "booked_until", label: "Hạn đặt" },
  { key: "vanity_number_fee", label: "Phí số đẹp" },
];

function PhoneNumbers() {
  // Get and set values query params
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [selectedPhone, setselectedPhone] = useState<IPhoneNumber | null>(null);

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
        offset: offset, // change offset to zero based
      });
      const formattedData = response.data.phone_numbers.map(
        (item: IPhoneNumber) => ({
          ...item,
          booked_until: formatDate(item.booked_until),
        })
      );

      setData({
        total_pages: response.data.total_pages,
        phone_numbers: formattedData,
      });

      // Update query params on URL
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
  const safeData = data?.phone_numbers ?? [];

  // Get description number
  const getDataDetail = (row: IPhoneNumber) => {
    setselectedPhone(row); // Save data in state
    setOpenModal(true);
  };
  const handleBookNumber = (item: IPhoneNumber) => {
    if (item.status === "booked") {
      alert("Số đã được đặt");
      return;
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Đặt số điện thoại" />

      <div className="space-y-6">
        <ComponentCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <Label>Trạng thái</Label>
              <Select
                options={[
                  { label: "Có sẵn", value: "available" },
                  { label: "Đã đặt", value: "booked" },
                ]}
                placeholder="Lựa chọn trạng thái"
                onChange={handleChangeStatus}
                defaultValue={"available"}
                className="dark:bg-dark-900"
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
                  onClick: getDataDetail,
                  className: "bg-blue-400 text-white",
                },
                {
                  icon: <IoIosCall />,
                  onClick: handleBookNumber,
                  className: "bg-green-500 text-white",
                },
              ]}
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
          onSuccess={() => fetchData}
          isOpen={openModal}
          onCloseModal={() => setOpenModal(false)}
          data={selectedPhone}
        />
      </div>
    </>
  );
}

export default PhoneNumbers;
