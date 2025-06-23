import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { IoIosAdd } from "react-icons/io";

import { useEffect, useState } from "react";
import { ITypeNumber } from "../../types";
import { deleteTypeNumber, getTypeNumber } from "../../services/typeNumber";
import ModalTypeNumber from "./TypeNumberModal";
import ModalSwalAction from "../../hooks/useModalSwal";
import ReusableTable from "../../components/common/ReusableTable";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import TableMobile from "../../mobiles/TableMobile";
import { useScreenSize } from "../../hooks/useScreenSize";
import { LabelValueItem, ActionButton } from "../../mobiles/TableMobile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function convertSecondsToTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes.toString().padStart(2, "0")}m`);
  }
  parts.push(`${secs.toString().padStart(2, "0")}s`);

  return parts.join(" ");
}

const columns: { key: keyof ITypeNumber; label: string }[] = [
  // { key: "id", label: "ID" },
  { key: "name", label: "Định dạng số" },
  { key: "booking_expiration", label: "Thời hạn chờ triển khai" },
  {
    key: "weekend_booking_expiration",
    label: "Thời hạn chờ triển khai cuối tuần",
  },
];

const TypeNumberPages = () => {
  const [openModal, setOpenModal] = useState(false);
  const [type, setType] = useState<ITypeNumber | undefined>(undefined);
  const [types, setTypes] = useState<ITypeNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorData, setErrorData] = useState("");
  const { isMobile } = useScreenSize();

  const user = useSelector((state: RootState) => state.auth.user);

  const getAllData = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getTypeNumber();

      if (res && res.length > 0) {
        const formatData = res.map((item: any) => ({
          ...item,
          booking_expiration: convertSecondsToTime(item.booking_expiration),
          weekend_booking_expiration: convertSecondsToTime(
            item.weekend_booking_expiration
          ),
        }));
        setTypes(formatData);
        setErrorData("");
        setLoading(false);
      } else {
        setTypes([]);
        setErrorData("Không có dữ liệu");
        setLoading(false);
      }
    } catch (err: any) {
      setError(`${err}`);
    }
  };

  useEffect(() => {
    getAllData();
  }, []);

  const handleDelete = async (id: string) => {
    await ModalSwalAction({
      mode: "delete",
      title: "định dạng số",
      action: async () => {
        const res = await deleteTypeNumber(id);
        return res;
      },
      onSuccess: () => getAllData(),
    });
  };

  // Chuyển đổi dữ liệu cho TableMobile
  const convertToMobileData = (): LabelValueItem[][] => {
    return types.map((item) => [
      {
        label: "Mã định dạng số",
        value: item.id,
        fieldName: "id",
        hidden: true,
      },
      {
        label: "Định dạng số",
        value: item.name,
        fieldName: "name",
        hideLabel: true,
      },
      {
        label: "Thời hạn chờ triển khai",
        value: item.booking_expiration,
        fieldName: "booking_expiration",
      },
      {
        label: "Thời hạn chờ triển khai cuối tuần",
        value: item.weekend_booking_expiration,
        fieldName: "weekend_booking_expiration",
      },
    ]);
  };

  // Actions cho TableMobile
  const actions: ActionButton[] = [
    {
      icon: <EditIcon />,
      label: "Chỉnh sửa",
      onClick: (id: string) => {
        const typeNumber = types.find((p) => String(p.id) === String(id));
        if (typeNumber) {
          setType(typeNumber);
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

  return (
    <>
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
          {error && <div className="text-red-500">{error}</div>}

          {isMobile ? (
            // Hiển thị TableMobile cho mobile
            <ComponentCard>
              <TableMobile
                pageTitle="Định dạng số"
                disabledReset={true}
                data={convertToMobileData()}
                actions={actions}
                showAllData={true}
                useTailwindStyling={true}
                hideCheckbox={true}
                labelClassNames={{
                  "Định dạng số": `
                  text-[18px] font-extrabold uppercase
                `,
                }}
                valueClassNames={{
                  "Định dạng số": `
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
            // Hiển thị ReusableTable cho desktop
            <ComponentCard>
              <ReusableTable
                error={errorData}
                disabledReset={true}
                disabled={true}
                role={user.role}
                title="Danh sách định dạng số"
                data={types}
                columns={columns}
                onEdit={(item) => {
                  setType(item);
                  setOpenModal(!openModal);
                }}
                isLoading={loading}
                onDelete={(id) => handleDelete(String(id))}
              />
            </ComponentCard>
          )}
        </div>
        <ModalTypeNumber
          isOpen={openModal}
          onClose={() => setOpenModal(!openModal)}
          data={type}
          onSuccess={getAllData}
        />
      </>
    </>
  );
};

export default TypeNumberPages;
