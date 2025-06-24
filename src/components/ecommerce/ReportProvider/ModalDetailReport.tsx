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
  const [chartHeight, setChartHeight] = useState(350);
  const [rawData, setRawData] = useState<{
    categories: string[];
    values: number[];
  }>({ categories: [], values: [] });
  const [isLoading, setIsLoading] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Thêm useRef để theo dõi việc fetch data
  const isFetching = useRef(false);

  const darkMode = document.documentElement.classList.contains("dark");

  // Tính toán series name dựa trên option và optionType hiện tại
  const seriesName = useMemo(() => {
    if (option === "booked") {
      return optionType === "provider"
        ? "Số booked/nhà mạng"
        : "Số booked/định dạng số";
    } else {
      return optionType === "provider"
        ? "Số triển khai/nhà mạng"
        : "Số triển khai/định dạng số";
    }
  }, [option, optionType]);

  // Hook để detect screen size và adjust chart height
  useEffect(() => {
    const updateChartDimensions = () => {
      const screenWidth = window.innerWidth;

      // Responsive height based on screen size
      if (screenWidth < 640) {
        // mobile
        setChartHeight(300);
      } else if (screenWidth < 768) {
        // tablet portrait
        setChartHeight(320);
      } else if (screenWidth < 1024) {
        // tablet landscape
        setChartHeight(350);
      } else {
        // desktop
        setChartHeight(400);
      }
    };

    updateChartDimensions();
    window.addEventListener("resize", updateChartDimensions);

    return () => window.removeEventListener("resize", updateChartDimensions);
  }, []);

  // Get responsive chart options - Không bao gồm series name trong chart
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
          toolbar: {
            show: !isMobile, // Hide toolbar on mobile
          },
          fontFamily: "inherit",
          // Enable responsive
          responsive: [
            {
              breakpoint: 640,
              options: {
                chart: {
                  height: 300,
                },
                plotOptions: {
                  bar: {
                    horizontal: true,
                    barHeight: "60%",
                    distributed: false,
                  },
                },
                dataLabels: {
                  style: {
                    fontSize: "8px",
                  },
                },
              },
            },
            {
              breakpoint: 768,
              options: {
                chart: {
                  height: 320,
                },
                plotOptions: {
                  bar: {
                    horizontal: true,
                    barHeight: "65%",
                    distributed: false,
                  },
                },

                dataLabels: {
                  style: {
                    fontSize: "11px",
                  },
                },
              },
            },
          ],
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
          categories: categories,
          title: {
            text: "",
          },
          labels: {
            style: {
              fontSize: isMobile ? "6px" : isTablet ? "11px" : "12px",
              colors: darkMode ? "#E5E7EB" : "#374151",
            },
            // Rotate labels on mobile if they're too long
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
          formatter: function (val: any) {
            return val.toFixed(0);
          },
        },
        tooltip: {
          theme: darkMode ? "dark" : "light",
          style: {
            fontSize: isMobile ? "10px" : "12px",
          },
          y: {
            formatter: function (val: any) {
              return val.toFixed(0);
            },
          },
        },
        legend: {
          show: false, // Tắt legend của chart
        },
        grid: {
          show: true,
          borderColor: darkMode ? "#374151" : "#E5E7EB",
          strokeDashArray: 2,
          xaxis: {
            lines: {
              show: true,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
          padding: {
            top: 10,
            right: isMobile ? 10 : 20,
            bottom: 10,
            left: isMobile ? 10 : 20,
          },
        },
        // Add animations
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      };
    },
    [option, optionType, darkMode, chartHeight]
  );

  // Fetch chart data
  const fetchData = useCallback(async () => {
    if (!data?.name || !date) return;

    setIsLoading(true); // Bắt đầu loading

    const [year, month, day] = date.split("/");
    const params: any = {
      year: parseInt(year),
      month: parseInt(month),
      username: data.name,
      option: option,
      option_type: optionType,
    };

    if (day) {
      params.day = parseInt(day);
    }

    try {
      if (isFetching.current) return;
      isFetching.current = true;

      const result = await getBookingStatusBySales(params);

      // Extracting the keys and values from the result data
      const categories = Object.keys(result.data);
      const values = Object.values(result.data) as number[]; // Fixed: Cast to number array

      setRawData({ categories, values });
    } catch (error) {
      console.error("Error fetching booking status:", error);
    } finally {
      setIsLoading(false); // Kết thúc loading
      isFetching.current = false; // Reset fetching flag
    }
  }, [data?.name, date, optionType, option]);

  useEffect(() => {
    if (rawData.categories.length > 0 && rawData.values.length > 0) {
      const newSeries = [
        {
          name: "data", // Tên đơn giản, không hiển thị
          data: [...rawData.values], // đảm bảo tạo mảng mới
        },
      ];
      const newOptions = getResponsiveChartOptions(
        options,
        [...rawData.categories],
        [...rawData.values]
      );

      setChartData({
        series: newSeries,
        options: newOptions,
      });
    }
  }, [rawData, options, getResponsiveChartOptions]);

  // Fetch table data
  const fetchTableData = useCallback(async () => {
    if (!data?.name || !date) return;
    try {
      const [year, month, day] = date.split("/");
      const params: any = {
        year: parseInt(year),
        month: parseInt(month),
        username: data.name,
        option: option,
        option_type: optionType,
      };

      if (day) {
        params.day = parseInt(day);
      }

      const result = await getBookingStatusBySales(params);
      const tableData = Object.entries(result.data).map(([key, value]) => {
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

      // If you need to use tableData, store it in state or return it
      return tableData;
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
      setRawData({ categories: [], values: [] });
      setIsLoading(false);
      isFetching.current = false; // Reset fetching flag
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
    <div className="flex justify-center px-2 sm:px-4">
      <Modal
        isOpen={visible}
        onClose={onClose}
        className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl p-3 sm:p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-3 sm:gap-4 py-2 sm:py-4">
          {/* Modal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white capitalize leading-tight">
              {option === "booked"
                ? `Chi tiết thông tin book của ${data?.name}`
                : `Chi tiết thông tin triển khai của ${data?.name}`}
            </h2>
          </div>

          {/* Chart Box */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 md:p-5 rounded-lg border dark:border-gray-600">
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div>
                <Select
                  options={[
                    { label: "Nhà mạng", value: "provider" },
                    { label: "Định dạng số", value: "type_number" },
                  ]}
                  defaultValue="provider"
                  onChange={(value) => setOptionType(value)}
                  className="px-2 sm:px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 w-full"
                />
              </div>
              <div>
                <Select
                  options={[
                    { label: "Đã book", value: "booked" },
                    { label: "Đã triển khai", value: "deployed" },
                  ]}
                  value={option}
                  onChange={(value) =>
                    setOption(value as "booked" | "deployed")
                  }
                  className="px-2 sm:px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 w-full"
                />
              </div>
            </div>

            {/* Series Name Display - Hiển thị riêng bên ngoài chart */}
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

            {/* Chart Container */}
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
                  key={`${option}-${optionType}-${Date.now()}`} // Key unique để force re-render
                  options={chartData.options}
                  series={chartData.series}
                  type="bar"
                  height={chartHeight}
                  width="100%"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p className="text-sm">Không có dữ liệu</p>
                  </div>
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
