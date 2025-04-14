import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { IoIosAdd } from "react-icons/io";
import ModalProvider from "./ProviderModal";
import { deleteProvider, getProviders } from "../../services/provider";

import { useEffect, useState } from "react";
import ModalSwalAction from "../../hooks/useModalSwal";
import { IProvider } from "../../types";
import ReusableTable from "../../components/common/ReusableTable";
import { sortByPriority } from "../../helper/priorityProviderList";

const columns: { key: keyof IProvider; label: string }[] = [
  { key: "name", label: "Nhà cung cấp" },
  { key: "description", label: "Mô tả" },
];

const priorityList = [
  { name: "VIETTEL", order: 1 },
  { name: "MOBIFONE_3C", order: 2 },
  { name: "MOBIFONE_CSV", order: 3 },
  { name: "VINAPHONE_VNPT", order: 4 },
  { name: "VINAPHONE_LEEON", order: 5 },
  { name: "GMOBILE_LEEON", order: 6 },
  { name: "HTC", order: 7 },
  { name: "GTEL", order: 8 },
  { name: "VTC", order: 9 },
  { name: "CMC", order: 10 },
];

const ProviderPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [provider, setProvider] = useState<IProvider | undefined>(undefined);
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorData, setErrorData] = useState("");

  const getAllData = async (delay = 0) => {
    setError(null);
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, delay));
      const res = await getProviders();
      const sortedProvider = sortByPriority(res, priorityList);
      const mappedProviders: IProvider[] = sortedProvider.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }));
      setProviders(mappedProviders);

      if (!res || res.length === 0) {
        setErrorData("Không có dữ liệu");
      } else {
        setErrorData("");
      }
    } catch (err: any) {
      setError(`${err}`);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  useEffect(() => {
    getAllData();
  }, []);

  const handleDelete = async (id: string) => {
    await ModalSwalAction({
      mode: "delete",
      title: "nhà cung cấp",
      action: async () => {
        const res = await deleteProvider(id);
        return res;
      },
      onSuccess: () => getAllData(),
    });
  };

  return (
    <>
      <>
        <PageBreadcrumb pageTitle="Nhà cung cấp" />
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setProvider(undefined);
              setOpenModal(!openModal);
            }}
            className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <IoIosAdd size={24} />
            Thêm
          </button>
        </div>
        <div className="space-y-6">
          {error && <div className="text-red-500">{error}</div>}
          <ComponentCard>
            <ReusableTable
              error={errorData}
              title="Danh sách số điện thoại"
              data={providers}
              columns={columns}
              onEdit={(item) => {
                setProvider(item);
                setOpenModal(!openModal);
              }}
              isLoading={loading}
              onDelete={(id) => handleDelete(String(id))}
            />
          </ComponentCard>
        </div>
        <ModalProvider
          isOpen={openModal}
          onCloseModal={() => setOpenModal(!openModal)}
          data={provider}
          onSuccess={getAllData}
        />
      </>
    </>
  );
};

export default ProviderPage;
