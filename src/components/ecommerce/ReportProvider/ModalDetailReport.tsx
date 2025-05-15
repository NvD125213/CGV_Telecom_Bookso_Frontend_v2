import { useCallback, useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { getBookingStatusBySales } from "../../../services/report";
import { revokeNumber } from "../../../services/phoneNumber";
import Select from "../../form/Select";
import { Modal } from "../../ui/modal";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { IoCaretBackCircleOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import ReusableTable from "../../common/ReusableTable";

interface ChartDataItem {
  name: string;
  quantity?: number;
  quantity_booked?: number;
  total?: number;
  value?: number;
  booked?: number;
  deployed?: number;
  seriesName?: string;
}

interface BookingStatusValue {
  provider_name?: string;
  type_name?: string;
  booked_at?: string;
  booked_until?: string;
  id: number;
}

interface ModalDetailReportProps {
  visible: boolean;
  onClose: () => void;
  data: ChartDataItem | null;
  options: any;
  date: string;
  onSuccess?: () => Promise<void>;
}

const getColumns = () => [
  { key: "phone_number", label: "Số điện thoại" },
  { key: "provider_name", label: "Nhà cung cấp" },
  { key: "type_name", label: "Định dạng số" },
  { key: "booked_at", label: "Thời gian đặt" },
  { key: "booked_until", label: "Hạn đặt" },
];

const ModalDetailReport = ({
  visible,
  onClose,
  data,
  options,
  date,
  onSuccess,
}: ModalDetailReportProps) => {
  const [chartData, setChartData] = useState<{
    series: { name: string; data: number[] }[];
    options: any;
  }>({
    series: [],
    options: {},
  });

  const [optionType, setOptionType] = useState<string>("provider");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const user = useSelector((state: RootState) => state.auth.user);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if dark mode is enabled (adjust based on your actual theme logic)
  const darkMode = document.documentElement.classList.contains("dark");

  const handleRevoke = async () => {
    if (selectedIds.length === 0) {
      Swal.fire({
        title: "Vui lòng chọn số cần thu hồi",
        icon: "warning",
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: "Bạn có chắc chắn?",
        text: "Hãy kiểm tra lại danh sách số bạn muốn thu hồi!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Thu hồi",
      });

      if (result.isConfirmed) {
        const res = await revokeNumber({ id_phone_numbers: selectedIds });
        if (res.status === 200) {
          Swal.fire({
            title: "Thu hồi thành công!",
            text: "Bạn đã thu hồi thành công danh sách số.",
            icon: "success",
          });
          setSelectedIds([]);
          await onSuccess?.();
        }
      }
    } catch (err: any) {
      Swal.fire(
        "Oops...",
        `${err}` || "Có lỗi xảy ra khi thu hồi, vui lòng thử lại!",
        "error"
      );
    }
  };

  const fetchData = useCallback(async () => {
    if (!data) return;
    const seriesName =
      data.seriesName === "booked"
        ? optionType === "provider"
          ? "Số booked/nhà mạng"
          : "Số booked/định dạng số"
        : optionType === "provider"
        ? "Số triển khai/nhà mạng"
        : "Số triển khai/định dạng số";

    if (!data?.name || !date) return;

    const [year, month, day] = date.split("/");
    const params: any = {
      year: parseInt(year),
      month: parseInt(month),
      username: data.name,
      option: data.seriesName,
      option_type: optionType,
    };

    if (day) {
      params.day = parseInt(day);
    }

    try {
      const result = await getBookingStatusBySales(params);

      // Extracting the keys and values from the result data
      const categories = Object.keys(result.data); // ["Số vip", "MBS"]
      const values = Object.values(result.data) as number[]; // [2, 1]

      setChartData({
        series: [
          {
            name: seriesName,
            data: values,
          },
        ],
        options: {
          ...options,
          chart: {
            ...options.chart,
            type: "bar",
            height: 350,
            toolbar: {
              show: false,
            },
          },
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: "70%",
              distributed: false,
            },
          },
          xaxis: {
            ...options.xaxis,
            categories: categories, // Setting categories as extracted from result.data
          },
          colors: data.seriesName === "booked" ? ["#3B82F6"] : ["#FF9800"],
          dataLabels: {
            enabled: true,
            style: { fontSize: "12px", colors: ["#fff"] },
          },
          tooltip: {
            theme: darkMode ? "dark" : "light",
            y: {
              formatter: function (val: any) {
                return val.toFixed(0);
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching booking status:", error);
    }
  }, [data?.name, date, optionType, visible, data, options, darkMode]);

  const fetchTableData = useCallback(async () => {
    if (!data?.name || !date) return;
    setLoading(true);
    try {
      const [year, month, day] = date.split("/");
      const params: any = {
        year: parseInt(year),
        month: parseInt(month),
        username: data.name,
        option: data.seriesName,
        option_type: optionType,
      };

      if (day) {
        params.day = parseInt(day);
      }

      const result = await getBookingStatusBySales(params);
      const formattedData = Object.entries(result.data).map(([key, value]) => {
        const typedValue = value as BookingStatusValue;
        return {
          phone_number: key,
          provider_name: typedValue.provider_name || "",
          type_name: typedValue.type_name || "",
          booked_at: typedValue.booked_at || "",
          booked_until: typedValue.booked_until || "",
          id: typedValue.id,
        };
      });
      setTableData(formattedData);
    } catch (error) {
      console.error("Error fetching table data:", error);
    } finally {
      setLoading(false);
    }
  }, [data?.name, date, data?.seriesName, optionType]);

  useEffect(() => {
    if (!visible) {
      setOptionType("provider");
      setChartData({
        series: [],
        options: {},
      });
    }
  }, [visible]);

  useEffect(() => {
    if (visible && data?.name) {
      fetchData();
      fetchTableData();
    }
  }, [visible, data?.name, fetchData, fetchTableData]);

  return (
    <div className="flex justify-center">
      <Modal
        isOpen={visible}
        onClose={onClose}
        className="w-full max-w-4xl p-14 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div className="flex flex-col gap-4 py-4">
          {/* Modal Header */}
          <div className="grid grid-cols-8 gap-4 items-center">
            <h2 className="col-span-6 text-xl font-semibold text-gray-800 dark:text-white capitalize">
              {data?.seriesName === "booked"
                ? `Chi tiết thông tin booked của ${data.name}`
                : `Chi tiết thông tin triển khai ${data?.name}`}
            </h2>

            <div className="col-span-2 flex gap-2">
              <Select
                options={[
                  { label: "Nhà mạng", value: "provider" },
                  { label: "Định dạng số", value: "type_number" },
                ]}
                defaultValue="provider"
                onChange={(value) => setOptionType(value)}
                className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          {/* Chart */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <ReactApexChart
              options={chartData.options}
              series={chartData.series}
              type="bar"
              height={350}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModalDetailReport;
