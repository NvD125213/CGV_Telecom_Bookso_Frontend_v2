import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ApexCharts from "react-apexcharts";
import { useTheme } from "../../../context/ThemeContext";
import { getDashBoard } from "../../../services/report";
import ComponentCard from "../../common/ComponentCard";
import ModalDetailReport from "./ModalDetailReport";
import { RootState } from "../../../store";

interface TotalAvailable {
  provider: string;
  quantity: number;
  quantity_booked: number;
}

interface BookedBySales {
  user_name: string;
  quantity: number;
  booked: number;
  deployed: number;
}

interface DashboardData {
  booked: number;
  deployed: number;
  total_available: TotalAvailable[];
  booked_by_sales: BookedBySales[];
}

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

interface BookingStatusData {
  username: string;
  status: string;
  count: number;
}

const ProviderReport = () => {
  const [selectedData, setSelectedData] = useState<
    "total_available" | "booked_by_sales"
  >("total_available");
  const [bookingStatusData, setBookingStatusData] = useState<
    BookingStatusData[]
  >([]);
  const [showBookingStatus, setShowBookingStatus] = useState(false);
  const [selectedSales, setSelectedSales] = useState<string>("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const currentDate = new Date();
  const [date, setDate] = useState<string>(
    `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
    )}`
  );
  const { theme } = useTheme();
  const [data, setData] = useState<DashboardData>({
    booked: 0,
    deployed: 0,
    total_available: [],
    booked_by_sales: [],
  });
  const [loading, setLoading] = useState(false);
  const [chartRenderKey, setChartRenderKey] = useState(0);
  const [chartColors] = useState({
    totalAvailable: ["#4CAF50", "#2196F3"],
    bookedBySales: ["#FF9800"],
  });
  const { refreshTrigger } = useSelector((state: RootState) => state.report);

  const getYear = (value: string): string => {
    return value.split("/")[0] || currentDate.getFullYear().toString();
  };

  const getMonth = (value: string): string => {
    return (
      value.split("/")[1] || String(currentDate.getMonth() + 1).padStart(2, "0")
    );
  };

  const getDay = (value: string): string => {
    return value.split("/")[2] || "";
  };

  const fetchDataImmediate = useCallback(
    async (year: string, month: string, day: string) => {
      try {
        setLoading(true);
        const params: any = {
          year: parseInt(year),
          month: parseInt(month),
        };
        if (day && day.length > 0) {
          params.day = parseInt(day);
        }
        const response = await getDashBoard(params);
        setData({ ...response.data });
        setChartRenderKey((prev) => prev + 1);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchData = useCallback(
    debounce((year: string, month: string, day: string) => {
      fetchDataImmediate(year, month, day);
    }, 500),
    [fetchDataImmediate]
  );

  const refreshChartData = useCallback(async () => {
    const year = getYear(date);
    const month = getMonth(date);
    const day = getDay(date);
    await fetchDataImmediate(year, month, day);
  }, [date, fetchDataImmediate]);

  useEffect(() => {
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    fetchData(currentYear, currentMonth, "");
  }, [fetchData]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshChartData();
    }
  }, [refreshTrigger, refreshChartData]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 0) {
      if (value.length > 4) {
        value = value.slice(0, 4) + "/" + value.slice(4);
      }
      if (value.length > 7) {
        value = value.slice(0, 7) + "/" + value.slice(7);
      }
      value = value.slice(0, 10);
    }

    setDate(value);
    const year = getYear(value);
    const month = getMonth(value);
    const day = getDay(value);
    fetchData(year, month, day);
  };

  const chartData: ChartDataItem[] =
    selectedData === "total_available"
      ? data.total_available
          .map((item) => ({
            name: item.provider,
            quantity: item.quantity,
            quantity_booked: item.quantity_booked,
            total: (item.quantity || 0) + (item.quantity_booked || 0),
          }))
          .sort((a, b) => (b.total || 0) - (a.total || 0))
      : data.booked_by_sales
          .map((item) => {
            return {
              name: item.user_name,
              booked: item.booked,
              deployed: item.deployed,
              total: (item.booked || 0) + (item.deployed || 0),
            };
          })
          .sort((a, b) => (b.total || 0) - (a.total || 0));

  const handleChartClick = (event: any, chartContext: any, config: any) => {
    const index = config?.dataPointIndex;
    const seriesIndex = config?.seriesIndex;
    if (index === undefined || index < 0) return;

    const clickedItem = chartData[index];
    const seriesName = seriesIndex === 0 ? "booked" : "deployed";

    const options = {
      chart: {
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
      colors: seriesIndex === 0 ? ["#3B82F6"] : ["#FF9800"],
      xaxis: {
        categories: [clickedItem.name],
        title: {
          text:
            seriesIndex === 0 ? "Số lượng đã book" : "Số lượng đã triển khai",
          style: { fontSize: "14px", fontWeight: 600 },
        },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: "12px", colors: ["#fff"] },
      },
      tooltip: {
        theme: theme === "dark" ? "dark" : "light",
        y: {
          formatter: function (val: any) {
            return val.toFixed(0);
          },
        },
      },
    };

    setModalData({
      ...clickedItem,
      seriesName,
    });
    setModalOptions(options);
    setShowModal(true);
  };

  const getChartOptions = useCallback(() => {
    if (selectedData === "total_available") {
      const sortedData = [...chartData].sort((a, b) => {
        const totalA = (a.quantity || 0) + (a.quantity_booked || 0);
        const totalB = (b.quantity || 0) + (b.quantity_booked || 0);
        return totalB - totalA;
      });

      const categories = sortedData.map((item) => item.name);
      const series = [
        {
          name: "Số lượng có sẵn",
          data: sortedData.map((item) => item.quantity || 0),
        },
        {
          name: "Số lượng đã book",
          data: sortedData.map((item) => item.quantity_booked || 0),
        },
      ];

      const maxTotal = Math.max(
        ...sortedData.map(
          (item) => (item.quantity || 0) + (item.quantity_booked || 0)
        )
      );
      const numDigits = maxTotal.toString().length;
      const base = Math.pow(10, numDigits - 1);
      const yAxisMax = Math.ceil(maxTotal / base) * base;
      const threshold = maxTotal / 100;

      return {
        series,
        options: {
          chart: {
            type: "bar" as const,
            height: 800,
            stacked: true,
            toolbar: {
              show: false,
            },
            fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
            animations: {
              enabled: false,
            },
            padding: {
              left: 100,
              right: 20,
              top: 20,
              bottom: 20,
            },
          },
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: "80%",
              dataLabels: {
                position: "center",
              },
              columnWidth: "90%",
              rangeBarOverlap: false,
              rangeBarGroupRows: false,
              borderRadius: 0,
              startingShape: "flat",
              endingShape: "flat",
            },
          },
          stroke: {
            width: 1,
            colors: ["#fff"],
          },
          title: {
            text: "Thống kê số lượng theo nhà cung cấp",
            align: "left" as const,
            style: {
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              color: theme == "light" ? "#333" : "#fff",
            },
            margin: 20,
          },
          xaxis: {
            categories,
            labels: {
              formatter: function (val: any) {
                return val.toFixed(0);
              },
            },
            max: yAxisMax,
            tickAmount: 5,
            axisBorder: {
              show: true,
            },
            axisTicks: {
              show: false,
            },
            position: "bottom",
            crosshairs: {
              show: false,
            },
            tooltip: {
              enabled: false,
            },
            min: 0,
          },
          yaxis: {
            labels: {
              style: {
                fontSize: "12px",
                fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              },
              offsetX: 0,
              maxWidth: 200,
              trim: false,
              formatter: function (val: number, opts?: any) {
                const value =
                  opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                return value.length > 20
                  ? value.substring(0, 20) + "..."
                  : value;
              },
            },
            axisBorder: {
              show: true,
            },
            axisTicks: {
              show: false,
            },
          },
          tooltip: {
            shared: true,
            intersect: false,
            y: {
              formatter: function (val: any) {
                return val.toFixed(0);
              },
            },
            custom: function ({
              series,
              seriesIndex,
              dataPointIndex,
              w,
            }: {
              series: any;
              seriesIndex: number;
              dataPointIndex: number;
              w: any;
            }) {
              const data = sortedData[dataPointIndex];
              const total = (data.quantity || 0) + (data.quantity_booked || 0);
              return `<div class="p-2">
                  <div class="dark:text-white"><b>${data.name}</b></div>
                  <div class="dark:text-white">Số lượng có sẵn: ${data.quantity}</div>
                  <div class="dark:text-white">Số lượng đã book: ${data.quantity_booked}</div>
                  <div class="dark:text-white"><b>Tổng: ${total}</b></div>
                </div>`;
            },
          },
          fill: {
            opacity: 1,
          },
          legend: {
            position: "top" as const,
            horizontalAlign: "left" as const,
            offsetX: 40,
          },
          colors: chartColors.totalAvailable,
          dataLabels: {
            enabled: true,
            formatter: function (
              val: number,
              {
                seriesIndex: _seriesIndex,
                dataPointIndex,
                w,
              }: {
                seriesIndex: any;
                dataPointIndex: number;
                w: any;
              }
            ) {
              const total = w.globals.seriesTotals[dataPointIndex];
              if (total < threshold) {
                return "";
              }
              return val === 1 ? "" : val > 0 ? val.toFixed(0) : "";
            },
            style: {
              colors: ["#fff"],
              fontSize: "14px",
              fontWeight: "bold",
            },
            textAnchor: "middle" as const,
            offsetX: 0,
            offsetY: 0,
            background: {
              enabled: false,
            },
            dropShadow: {
              enabled: false,
            },
            custom: function ({
              seriesIndex,
              dataPointIndex,
              w,
            }: {
              seriesIndex: any;
              dataPointIndex: any;
              w: any;
            }) {
              const value = w.globals.series[seriesIndex][dataPointIndex];
              const total = w.globals.seriesTotals[dataPointIndex];
              if (total < threshold) {
                return "";
              }
              const percentage = (value / total) * 100;
              let fontSize = "14px";
              if (percentage < 10) {
                fontSize = "10px";
              } else if (percentage < 20) {
                fontSize = "12px";
              }
              return `<div style="font-size: ${fontSize}">${value}</div>`;
            },
          },
          grid: {
            xaxis: {
              lines: {
                show: false,
              },
            },
            yaxis: {
              lines: {
                show: false,
              },
            },
            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 100,
            },
            borderColor: "#f1f1f1",
            strokeDashArray: 0,
          },
        },
      };
    } else {
      const sortedData = [...chartData].sort(
        (a, b) => (b.total || 0) - (a.total || 0)
      );

      const maxValue = Math.max(
        ...sortedData.map((item) => (item.booked || 0) + (item.deployed || 0))
      );
      const numDigits = maxValue.toString().length;
      const base = Math.pow(10, numDigits - 1);
      const xAxisMax = Math.ceil(maxValue / base) * base;
      const threshold = maxValue / 100;

      return {
        series: [
          {
            name: "Đã book",
            data: sortedData.map((item) => item.booked || 0),
          },
          {
            name: "Đã triển khai",
            data: sortedData.map((item) => item.deployed || 0),
          },
        ],
        options: {
          chart: {
            type: "bar" as const,
            height: 800,
            stacked: true,
            toolbar: {
              show: false,
            },
            fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
            animations: {
              enabled: false,
            },
            padding: {
              left: 100,
              right: 20,
              top: 20,
              bottom: 20,
            },
            events: {
              click: handleChartClick,
            },
          },
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: "30%",
              distributed: false,
              dataLabels: {
                position: "center",
              },
              columnWidth: "95%",
              rangeBarOverlap: false,
              rangeBarGroupRows: false,
              borderRadius: 0,
              startingShape: "flat",
              endingShape: "flat",
            },
          },
          colors: ["#3B82F6", "#FF9800"],
          xaxis: {
            categories: sortedData.map((item) => item.name),
            labels: {
              formatter: function (val: any) {
                return val.toFixed(0);
              },
              style: {
                fontSize: "13px",
                fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              },
            },
            max: xAxisMax,
            axisBorder: {
              show: true,
            },
            axisTicks: {
              show: false,
            },
            position: "bottom",
            crosshairs: {
              show: false,
            },
            tooltip: {
              enabled: false,
            },
            min: 0,
          },
          yaxis: {
            labels: {
              style: {
                fontSize: "12px",
                fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              },
              offsetX: 0,
              maxWidth: 200,
              trim: false,
              formatter: function (val: number, opts?: any) {
                const value =
                  opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                return value.length > 20
                  ? value.substring(0, 20) + "..."
                  : value;
              },
            },
            axisBorder: {
              show: true,
            },
            axisTicks: {
              show: false,
            },
          },
          grid: {
            xaxis: {
              lines: {
                show: false,
              },
            },
            yaxis: {
              lines: {
                show: false,
              },
            },
            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 100,
            },
            borderColor: "#f1f1f1",
            strokeDashArray: 0,
          },
          tooltip: {
            y: {
              formatter: function (val: any) {
                return val.toFixed(0);
              },
            },
            custom: function ({
              series,
              seriesIndex,
              dataPointIndex,
              w,
            }: {
              series: any;
              seriesIndex: any;
              dataPointIndex: any;
              w: any;
            }) {
              const data = sortedData[dataPointIndex];
              return `<div class="p-2">
                          <div class="dark:text-white"><b>${data.name}</b></div>
                          <div class="dark:text-white">Đã book: ${
                            data.booked
                          }</div>
                          <div class="dark:text-white">Đã triển khai: ${
                            data.deployed
                          }</div>
                          <div class="dark:text-white"><b>Tổng: ${
                            (data.booked || 0) + (data.deployed || 0)
                          }</b></div>
                        </div>`;
            },
          },
          title: {
            text: "Thống kê số lượng theo sale",
            align: "left" as const,
            style: {
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              color: theme == "light" ? "#333" : "#fff",
            },
          },
          padding: {
            left: 20,
            right: 20,
          },
          states: {
            normal: {
              filter: {
                type: "none",
              },
            },
            hover: {
              filter: {
                type: "darken",
                value: 0.9,
              },
            },
          },
          legend: {
            position: "top" as const,
            horizontalAlign: "left" as const,
            offsetX: 40,
          },
        },
      };
    }
  }, [chartData, selectedData, theme]);

  const chartOptions = useMemo(() => getChartOptions(), [getChartOptions]);

  const chartKey = `${selectedData}-${JSON.stringify(data)}-${chartRenderKey}`;

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<ChartDataItem | null>(null);
  const [modalOptions, setModalOptions] = useState<any>(null);

  return (
    <ComponentCard>
      <div className="p-3">
        <div
          className={`flex ${
            selectedData == "booked_by_sales"
              ? "justify-between items-center"
              : "justify-end"
          } mb-4`}>
          {selectedData == "booked_by_sales" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={date}
                  onChange={handleDateChange}
                  placeholder="YYYY/MM/DD"
                  className="px-3 py-2 border rounded w-32 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  maxLength={10}
                />
                {loading && <span className="text-gray-500">Loading...</span>}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded ${
                selectedData === "total_available"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-black"
              }`}
              onClick={() => setSelectedData("total_available")}>
              Tổng số có sẵn
            </button>
            <button
              className={`px-4 py-2 rounded ${
                selectedData === "booked_by_sales"
                  ? "bg-green-500 text-white"
                  : "bg-white text-black"
              }`}
              onClick={() => setSelectedData("booked_by_sales")}>
              Sale đã book
            </button>
          </div>
        </div>

        <div className="h-[500px] w-full">
          {chartRenderKey > 0 && (
            <ApexCharts
              key={chartKey}
              options={chartOptions.options}
              series={chartOptions.series}
              type="bar"
              height="100%"
              width="100%"
            />
          )}
        </div>

        {showBookingStatus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Chi tiết trạng thái booking của {selectedSales}
                </h3>
                <button
                  onClick={() => setShowBookingStatus(false)}
                  className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              {loadingStatus ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {bookingStatusData.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{item.status}</span>
                      <span className="text-blue-600 font-semibold">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ModalDetailReport
        visible={showModal}
        onClose={() => setShowModal(false)}
        data={modalData}
        options={modalOptions}
        date={date}
        onSuccess={refreshChartData}
      />
    </ComponentCard>
  );
};

export default ProviderReport;
