import { useCallback, useEffect, useState, useRef, useMemo } from "react";
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

interface RawData {
  categories: string[];
  values: number[];
}

const ModalDetailReport = ({
  visible,
  onClose,
  data,
  options,
  date,
}: ModalDetailReportProps) => {
  // Khởi tạo option dựa trên data.seriesName
  const [option, setOption] = useState<"booked" | "deployed">(() => {
    if (data?.seriesName === "deployed" || data?.seriesName === "booked")
      return data.seriesName;
    return "booked";
  });
  const [optionType, setOptionType] = useState("provider");
  const [chartData, setChartData] = useState({
    series: [] as Array<{ name: string; data: number[] }>,
    options: {},
  });
  const [chartHeight, setChartHeight] = useState(350);
  const [rawData, setRawData] = useState<RawData>({
    categories: [],
    values: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const isFetching = useRef(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastFetchParams = useRef<{
    option: string;
    optionType: string;
    name: string;
    date: string;
  } | null>(null);

  const darkMode = document.documentElement.classList.contains("dark");

  const seriesName = useMemo(() => {
    const labelPrefix = option === "booked" ? "Số booked" : "Số triển khai";
    const labelSuffix =
      optionType === "provider" ? "/nhà mạng" : "/định dạng số";
    return `${labelPrefix}${labelSuffix}`;
  }, [option, optionType]);

  // Xử lý resize chart
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setChartHeight(300);
      else if (width < 768) setChartHeight(320);
      else if (width < 1024) setChartHeight(350);
      else setChartHeight(400);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getResponsiveChartOptions = useCallback(
    (baseOptions: any, categories: string[], values: number[]) => {
      const screenWidth = window.innerWidth;
      const isMobile = screenWidth < 640;
      const isTablet = screenWidth >= 640 && screenWidth < 1024;

      return {
        ...baseOptions,
        chart: {
          ...baseOptions.chart,
          type: "bar",
          height: chartHeight,
          toolbar: { show: !isMobile },
          fontFamily: "inherit",
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: isMobile ? "60%" : isTablet ? "65%" : "70%",
            distributed: false,
          },
        },
        xaxis: {
          ...baseOptions.xaxis,
          categories,
          labels: {
            style: {
              fontSize: isMobile ? "6px" : isTablet ? "11px" : "12px",
              colors: darkMode ? "#E5E7EB" : "#374151",
            },
            ...(isMobile && {
              rotate: categories.some((cat) => cat.length > 8) ? -45 : 0,
              maxHeight: 60,
            }),
          },
          axisBorder: {
            show: true,
            color: darkMode ? "#374151" : "#E5E7EB",
          },
          axisTicks: {
            show: true,
            color: darkMode ? "#374151" : "#E5E7EB",
          },
        },
        yaxis: {
          labels: {
            style: {
              fontSize: isMobile ? "8px" : isTablet ? "11px" : "12px",
              colors: darkMode ? "#E5E7EB" : "#374151",
            },
            maxWidth: isMobile ? 80 : isTablet ? 100 : 120,
          },
        },
        colors: option === "booked" ? ["#3B82F6"] : ["#FF9800"],
        dataLabels: {
          enabled: true,
          style: {
            fontSize: isMobile ? "8px" : isTablet ? "11px" : "12px",
            colors: ["#fff"],
            fontWeight: 600,
          },
          formatter: (val: number) => val.toFixed(0),
        },
        tooltip: {
          theme: darkMode ? "dark" : "light",
          y: {
            formatter: (val: number) => val.toFixed(0),
          },
        },
        legend: { show: false },
        grid: {
          show: true,
          borderColor: darkMode ? "#374151" : "#E5E7EB",
          strokeDashArray: 2,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: true } },
          padding: {
            top: 10,
            right: isMobile ? 10 : 20,
            bottom: 10,
            left: isMobile ? 10 : 20,
          },
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 },
        },
      };
    },
    [option, optionType, darkMode, chartHeight]
  );

  const fetchData = useCallback(async () => {
    if (!data?.name || !date || isFetching.current) return;

    const currentParams = { option, optionType, name: data.name, date };

    // Kiểm tra xem có cần fetch lại dữ liệu không
    if (
      lastFetchParams.current &&
      JSON.stringify(lastFetchParams.current) === JSON.stringify(currentParams)
    ) {
      return;
    }

    setIsLoading(true);
    isFetching.current = true;
    lastFetchParams.current = currentParams;

    const [year, month, day] = date.split("/");
    const params: any = {
      year: parseInt(year),
      month: parseInt(month),
      username: data.name,
      option,
      option_type: optionType,
    };
    if (day) params.day = parseInt(day);

    try {
      const result = await getBookingStatusBySales(params);
      const categories = Object.keys(result.data);
      const values = Object.values(result.data) as number[];
      setRawData({ categories, values });
    } catch (error) {
      console.error("Error fetching booking status:", error);
      // Reset lastFetchParams nếu có lỗi để có thể thử lại
      lastFetchParams.current = null;
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [data?.name, date, option, optionType]);

  // Cập nhật chart data khi rawData thay đổi
  useEffect(() => {
    if (rawData.categories.length && rawData.values.length) {
      setChartData({
        series: [{ name: "data", data: [...rawData.values] }],
        options: getResponsiveChartOptions(
          options,
          rawData.categories,
          rawData.values
        ),
      });
    }
  }, [rawData, options, getResponsiveChartOptions]);

  // Reset state khi modal đóng
  useEffect(() => {
    if (!visible) {
      setOptionType("provider");
      setOption("booked");
      setChartData({ series: [], options: {} });
      setRawData({ categories: [], values: [] });
      setIsLoading(false);
      isFetching.current = false;
      lastFetchParams.current = null;
    }
  }, [visible]);

  // Khởi tạo và fetch data khi modal mở
  useEffect(() => {
    if (visible && data?.name) {
      // Cập nhật option dựa trên data.seriesName
      if (data.seriesName === "deployed" || data.seriesName === "booked") {
        setOption(data.seriesName);
      }
      // Fetch data sau khi đã cập nhật option
      setTimeout(() => fetchData(), 0);
    }
  }, [visible, data?.name, data?.seriesName, date]);

  // Fetch data khi option hoặc optionType thay đổi
  useEffect(() => {
    if (visible && data?.name && !isLoading) {
      fetchData();
    }
  }, [option, optionType]);

  // Cập nhật option khi data.seriesName thay đổi
  useEffect(() => {
    if (data?.seriesName === "deployed" || data?.seriesName === "booked") {
      setOption(data.seriesName);
    }
  }, [data?.seriesName]);

  return (
    <div className="flex justify-center px-2 sm:px-4">
      <Modal
        isOpen={visible}
        onClose={onClose}
        className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl p-3 sm:p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-3 sm:gap-4 py-2 sm:py-4">
          <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white capitalize leading-tight">
            {option === "booked"
              ? `Chi tiết thông tin book của ${data?.name}`
              : `Chi tiết thông tin triển khai của ${data?.name}`}
          </h2>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 md:p-5 rounded-lg border dark:border-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Select
                options={[
                  { label: "Nhà mạng", value: "provider" },
                  { label: "Định dạng số", value: "type_number" },
                ]}
                value={optionType}
                onChange={(value) => setOptionType(value)}
                className="px-2 sm:px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 w-full"
              />
              <Select
                options={[
                  { label: "Đã book", value: "booked" },
                  { label: "Đã triển khai", value: "deployed" },
                ]}
                value={option}
                onChange={(value) => setOption(value as "booked" | "deployed")}
                className="px-2 sm:px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 w-full"
              />
            </div>

            <div className="mb-3 sm:mb-4 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: option === "booked" ? "#3B82F6" : "#FF9800",
                }}></div>
              <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                {seriesName}
              </span>
              {rawData.values.length > 0 && (
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  ({rawData.values.reduce((sum, val) => sum + val, 0)} tổng)
                </span>
              )}
            </div>

            <div
              ref={chartContainerRef}
              className="w-full overflow-hidden rounded-md bg-white dark:bg-gray-800 p-2 sm:p-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : chartData.series.length > 0 && rawData.values.length > 0 ? (
                <ReactApexChart
                  key={`${option}-${optionType}-${rawData.categories.length}-${rawData.values.length}`}
                  options={chartData.options}
                  series={chartData.series}
                  type="bar"
                  height={chartHeight}
                  width="100%"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">Không có dữ liệu</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModalDetailReport;
