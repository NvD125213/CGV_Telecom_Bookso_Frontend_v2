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

type ReportStatusOption = "booked" | "deployed" | "Book combo";

const REPORT_STATUS_OPTIONS: { label: string; value: ReportStatusOption }[] = [
  { label: "Đã book", value: "booked" },
  { label: "Đã đặt gói", value: "Book combo" },
  { label: "Đã triển khai", value: "deployed" },
];

const isReportStatusOption = (value: string): value is ReportStatusOption =>
  value === "booked" || value === "deployed" || value === "Book combo";

const getStatusColor = (status: ReportStatusOption): string => {
  switch (status) {
    case "booked":
      return "#3B82F6";
    case "Book combo":
      return "#22C55E";
    case "deployed":
      return "#FF9800";
  }
};

const resolveInitialOption = (seriesName?: string): ReportStatusOption => {
  if (seriesName && isReportStatusOption(seriesName)) {
    return seriesName;
  }
  return "booked";
};

const getStatusTitle = (status: ReportStatusOption, name: string) => {
  switch (status) {
    case "booked":
      return `Chi tiết thông tin book của ${name}`;
    case "Book combo":
      return `Chi tiết thông tin đặt gói của ${name}`;
    case "deployed":
      return `Chi tiết thông tin triển khai của ${name}`;
  }
};

const buildFetchKey = (
  option: ReportStatusOption,
  optionType: string,
  name: string,
  date: string,
) => JSON.stringify({ option, optionType, name, date });

const ModalDetailReport = ({
  visible,
  onClose,
  data,
  options,
  date,
}: ModalDetailReportProps) => {
  const [option, setOption] = useState<ReportStatusOption>(() =>
    resolveInitialOption(data?.seriesName),
  );
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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastFetchKeyRef = useRef<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const darkMode = document.documentElement.classList.contains("dark");

  const seriesName = useMemo(() => {
    const labelPrefix =
      option === "booked"
        ? "Số booked"
        : option === "Book combo"
          ? "Số đã đặt gói"
          : "Số triển khai";
    const labelSuffix =
      optionType === "provider" ? "/nhà mạng" : "/định dạng số";
    return `${labelPrefix}${labelSuffix}`;
  }, [option, optionType]);

  const statusColor = getStatusColor(option);

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
    (baseOptions: any, categories: string[]) => {
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
        colors: [getStatusColor(option)],
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
    [option, darkMode, chartHeight],
  );

  // Đồng bộ option khi mở modal từ biểu đồ cha
  useEffect(() => {
    if (!visible) return;
    if (data?.seriesName && isReportStatusOption(data.seriesName)) {
      setOption(data.seriesName);
    }
  }, [visible, data?.seriesName]);

  // Một effect duy nhất gọi API — tránh vòng lặp fetch
  useEffect(() => {
    if (!visible || !data?.name || !date) {
      return;
    }

    const fetchKey = buildFetchKey(option, optionType, data.name, date);

    if (lastFetchKeyRef.current === fetchKey) {
      return;
    }

    const generation = ++fetchGenerationRef.current;
    lastFetchKeyRef.current = fetchKey;

    setIsLoading(true);
    setChartData({ series: [], options: {} });
    setRawData({ categories: [], values: [] });

    const [year, month, day] = date.split("/");
    const params: Record<string, number | string> = {
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      username: data.name,
      option,
      option_type: optionType,
    };
    if (day) params.day = parseInt(day, 10);

    (async () => {
      try {
        const result = await getBookingStatusBySales(params);
        if (generation !== fetchGenerationRef.current) return;

        const payload = result?.data ?? {};
        const categories = Object.keys(payload);
        const values = Object.values(payload) as number[];

        setRawData({ categories, values });
      } catch (error) {
        if (generation !== fetchGenerationRef.current) return;
        console.error("Error fetching booking status:", error);
        setRawData({ categories: [], values: [] });
      } finally {
        if (generation === fetchGenerationRef.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      fetchGenerationRef.current += 1;
    };
  }, [visible, data?.name, date, option, optionType]);

  useEffect(() => {
    if (rawData.categories.length > 0 && rawData.values.length > 0) {
      setChartData({
        series: [{ name: seriesName, data: [...rawData.values] }],
        options: getResponsiveChartOptions(options, rawData.categories),
      });
    } else {
      setChartData({ series: [], options: {} });
    }
  }, [rawData, options, getResponsiveChartOptions, seriesName]);

  useEffect(() => {
    if (!visible) {
      setOptionType("provider");
      setOption("booked");
      setChartData({ series: [], options: {} });
      setRawData({ categories: [], values: [] });
      setIsLoading(false);
      lastFetchKeyRef.current = null;
      fetchGenerationRef.current += 1;
    }
  }, [visible]);

  return (
    <div className="flex justify-center px-2 sm:px-4">
      <Modal
        isOpen={visible}
        onClose={onClose}
        className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl p-3 sm:p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-3 sm:gap-4 py-2 sm:py-4">
          <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white capitalize leading-tight">
            {getStatusTitle(option, data?.name ?? "")}
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
                options={REPORT_STATUS_OPTIONS}
                value={option}
                onChange={(value) => {
                  if (isReportStatusOption(value)) {
                    setOption(value);
                  }
                }}
                className="px-2 sm:px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 w-full"
              />
            </div>

            <div className="mb-3 sm:mb-4 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: statusColor }}></div>
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
