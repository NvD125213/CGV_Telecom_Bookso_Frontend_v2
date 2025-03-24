import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { IoIosAdd } from "react-icons/io";

import { useEffect, useState } from "react";
import { ITypeNumber } from "../../types";
import { deleteTypeNumber, getTypeNumber } from "../../services/typeNumber";
import ModalTypeNumber from "./TypeNumberModal";
import ModalSwalAction from "../../hooks/useModalSwal";
import ReusableTable from "../../components/common/ReusableTable";

const columns: { key: keyof ITypeNumber; label: string }[] = [
  { key: "id", label: "STT" },
  { key: "name", label: "Định dạng số" },
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
        setTypes(res);
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
