import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { IoIosAdd } from "react-icons/io";

import { useEffect, useState } from "react";
import { ITypeNumber } from "../../types";
import { deleteTypeNumber, getTypeNumber } from "../../services/typeNumber";
import ModalTypeNumber from "./TypeNumberModal";
import ModalSwalAction from "../../hooks/useModalSwal";
import ReusableTable from "../../components/common/ReusableTable";

function convertSecondsToTime(seconds: any) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Format lại chuỗi trả về: ví dụ 2h 05m 09s
  const formattedHours = hours > 0 ? hours + "h " : "";
  const formattedMinutes = (minutes < 10 ? "0" : "") + minutes + "m ";
  const formattedSeconds = (secs < 10 ? "0" : "") + secs + "s";

  return formattedHours + formattedMinutes + formattedSeconds;
}

const columns: { key: keyof ITypeNumber; label: string }[] = [
  { key: "id", label: "STT" },
  { key: "name", label: "Định dạng số" },
  { key: "booking_expiration", label: "Thời hạn chờ triển khai" },
];

const TypeNumberPages = () => {
  const [openModal, setOpenModal] = useState(false);
  const [type, setType] = useState<ITypeNumber | undefined>(undefined);
  const [types, setTypes] = useState<ITypeNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTypeNumber();
      if (res?.length > 0) {
        const formatData = res.map((item: any) => ({
          ...item,
          booking_expiration: convertSecondsToTime(item.booking_expiration),
        }));
        setTypes(formatData);
      } else {
        setError("Không có dữ liệu");
      }
    } catch (err) {
      setError(`Lỗi dữ liệu: ${err}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getAllData();
  }, []);

  const handleDelete = async (id: string) => {
    await ModalSwalAction({
      mode: "delete",
      title: "Nhà cung cấp",
      action: async () => {
        const res = await deleteTypeNumber(id);
        return res;
      },
      onSuccess: () => getAllData(),
    });
  };

  return (
    <>
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <>
          <PageBreadcrumb pageTitle="Định dạng số" />
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setType(undefined);
                setOpenModal(!openModal);
              }}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              <IoIosAdd size={24} />
              Thêm
            </button>
          </div>
          <div className="space-y-6">
            <ComponentCard>
              {types.length > 0 ? (
                <ReusableTable
                  title="Danh sách định dạng"
                  data={types}
                  columns={columns}
                  onEdit={(item) => {
                    setType(item);
                    setOpenModal(!openModal);
                  }}
                  onDelete={(id) => handleDelete(String(id))}
                />
              ) : (
                <div>Không có dữ liệu</div>
              )}
            </ComponentCard>
          </div>
          <ModalTypeNumber
            isOpen={openModal}
            onClose={() => setOpenModal(!openModal)}
            data={type}
            onSuccess={getAllData}
          />
        </>
      )}
    </>
  );
};

export default TypeNumberPages;
