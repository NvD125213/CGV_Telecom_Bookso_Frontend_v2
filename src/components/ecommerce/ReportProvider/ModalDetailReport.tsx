import { useCallback, useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { getBookingStatusBySales } from "../../../services/report";
import Select from "../../form/Select";
import { Modal } from "../../ui/modal";

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

const ModalDetailReport = ({
  visible,
  onClose,
  data,
  options,
  date,
}: ModalDetailReportProps) => {
  const [option, setOption] = useState<"booked" | "deployed">("booked");
  const [optionType, setOptionType] = useState<string>("provider");
  const [chartData, setChartData] = useState<{
    series: { name: string; data: number[] }[];
    options: any;
  }>({
    series: [],
    options: {},
  });

  const darkMode = document.documentElement.classList.contains("dark");

  // Fetch chart data
  const fetchData = useCallback(async () => {
    if (!data?.name || !date) return;

    const seriesName =
      option === "booked"
        ? optionType === "provider"
          ? "Số booked/nhà mạng"
          : "Số booked/định dạng số"
        : optionType === "provider"
        ? "Số triển khai/nhà mạng"
        : "Số triển khai/định dạng số";

    const [year, month, day] = date.split("/");
    const params: any = {
      year: parseInt(year),
      month: parseInt(month),
      username: data.name,
      option: option, // Use option instead of data.seriesName
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
            categories: categories,
          },
          colors: option === "booked" ? ["#3B82F6"] : ["#FF9800"],
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
  }, [data?.name, date, optionType, option, options, darkMode]);

  // Fetch table data
  const fetchTableData = useCallback(async () => {
    if (!data?.name || !date) return;
    try {
      const [year, month, day] = date.split("/");
      const params: any = {
        year: parseInt(year),
        month: parseInt(month),
        username: data.name,
        option: option, // Use option instead of data.seriesName
        option_type: optionType,
      };

      if (day) {
        params.day = parseInt(day);
      }

      const result = await getBookingStatusBySales(params);
      Object.entries(result.data).map(([key, value]) => {
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
    } catch (error) {
      console.error("Error fetching table data:", error);
    }
  }, [data?.name, date, option, optionType]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setOptionType("provider");
      setOption("booked");
      setChartData({
        series: [],
        options: {},
      });
    }
  }, [visible]);

  // Fetch data when modal is opened or dependencies change
  useEffect(() => {
    if (visible && data?.name) {
      fetchData();
      fetchTableData();
    }
  }, [
    visible,
    data?.name,
    option,
    optionType,
    date,
    fetchData,
    fetchTableData,
  ]);

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
              {option === "booked"
                ? `Chi tiết thông tin book của ${data?.name}`
                : `Chi tiết thông tin triển khai của ${data?.name}`}
            </h2>
          </div>
          {/* Chart */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
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
              <Select
                options={[
                  { label: "Đã book", value: "booked" },
                  { label: "Đã triển khai", value: "deployed" },
                ]}
                value={option}
                onChange={(value) => setOption(value as "booked" | "deployed")}
                className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
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
