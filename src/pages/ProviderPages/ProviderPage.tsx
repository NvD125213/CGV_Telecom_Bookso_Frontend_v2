import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { IoIosAdd } from "react-icons/io";
import ModalProvider from "./ProviderModal";
import { deleteProvider, getProviders } from "../../services/provider";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useEffect, useState, useRef, useCallback } from "react";
import ModalSwalAction from "../../hooks/useModalSwal";
import { IProvider } from "../../types";
import ReusableTable from "../../components/common/ReusableTable";
import { sortByPriority } from "../../helper/priorityProviderList";
import TableMobile from "../../mobiles/TableMobile";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useIsMobile } from "../../hooks/useScreenSize";
import { LabelValueItem, ActionButton } from "../../mobiles/TableMobile";

const columns: { key: keyof IProvider; label: string }[] = [
  { key: "name", label: "Nhà cung cấp" },
  { key: "description", label: "Mô tả" },
  {
    key: "phone_number_limit_alert",
    label: "Hạn mức cảnh báo",
  },
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
  const isMobile = useIsMobile(768);
  const user = useSelector((state: RootState) => state.auth.user);
  const hasFetchedRef = useRef(false);

  const getAllData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getProviders();
      const sortedProvider = sortByPriority(res, priorityList);
      const mappedProviders: IProvider[] = sortedProvider.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        phone_number_limit_alert: item.phone_number_limit_alert,
      }));
      setProviders(mappedProviders);
      setErrorData(!res || res.length === 0 ? "Không có dữ liệu" : "");
    } catch (err: any) {
      setError(`${err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      getAllData();
      hasFetchedRef.current = true;
    }
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

  // Chuyển đổi dữ liệu cho TableMobile - ID luôn ở vị trí đầu tiên
  const convertToMobileData = (data: IProvider[]): LabelValueItem[][] => {
    return data.map((provider) => [
      { label: "Mã nhà cung cấp", value: provider.id, hidden: true },
      { label: "Nhà cung cấp", value: provider.name, hideLabel: true },
      { label: "Mô tả", value: provider.description || "Không có mô tả" },
      {
        label: "Hạn mức cảnh báo",
        value: provider.phone_number_limit_alert.toString(),
      },
    ]);
  };

  // Actions đã được đơn giản hóa - chỉ nhận ID
  const actions: ActionButton[] = [
    {
      icon: <EditIcon />,
      label: "Chỉnh sửa",
      onClick: (id: string) => {
        const providerData = providers.find((p) => String(p.id) === String(id));
        if (providerData) {
          setProvider(providerData);
          setOpenModal(true);
        }
      },
      color: "primary",
    },
    {
      icon: <DeleteIcon />,
      label: "Xóa",
      onClick: (id: string) => {
        handleDelete(id);
      },
      color: "error",
    },
  ];

  const mobileData = convertToMobileData(providers);

  return (
    <>
      <>
        {isMobile ? null : <PageBreadcrumb pageTitle="Nhà cung cấp" />}
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

          {isMobile ? (
            <ComponentCard>
              <TableMobile
                pageTitle="Nhà cung cấp"
                disabledReset={true}
                data={mobileData}
                actions={actions}
                hideCheckbox={true}
                hidePagination={true}
                showAllData={true}
                useTailwindStyling={true}
                labelClassNames={{
                  "Nhà cung cấp": `
                  text-[18px] font-extrabold uppercase
                `,
                }}
                valueClassNames={{
                  "Nhà cung cấp": `
                    text-base font-semibold 
                    bg-blue-50 text-blue-800
                    dark:bg-blue-900 dark:text-blue-100
                    px-4 py-2
                    rounded-lg
                    border border-blue-200 dark:border-blue-700
                    text-center
                    shadow-sm
                    whitespace-nowrap
                    font-sans
                  `,
                }}
              />
            </ComponentCard>
          ) : (
            <ComponentCard>
              <ReusableTable
                error={errorData}
                role={user.role}
                disabledReset={true}
                title="Danh sách số điện thoại"
                data={providers}
                columns={columns}
                onEdit={(item) => {
                  setProvider(item);
                  setOpenModal(!openModal);
                }}
                disabled={true}
                isLoading={loading}
                onDelete={(id) => handleDelete(String(id))}
              />
            </ComponentCard>
          )}
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
