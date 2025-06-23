import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ApexCharts from "react-apexcharts";
import { useTheme } from "../../../context/ThemeContext";
import { getDashBoard } from "../../../services/report";
import ComponentCard from "../../common/ComponentCard";
import ModalDetailReport from "./ModalDetailReport";
import { RootState } from "../../../store";
import SwitchablePicker from "../../common/SwitchablePicker";

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
          style: { fontSize: "16px", fontWeight: 600 },
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

      const minBarLength = 30;
      const trueQuantityData = sortedData.map((item) => item.quantity || 0);
      const trueBookedData = sortedData.map(
        (item) => item.quantity_booked || 0
      );

      const renderQuantityData = trueQuantityData.map((val) =>
        val === 0 ? 0 : val + minBarLength
      );

      const renderBookedData = trueBookedData.map((val) =>
        val === 0 ? 0 : val + minBarLength
      );
      const categories = sortedData.map((item) => item.name);
      const series = [
        {
          name: "Số lượng có sẵn",
          data: renderQuantityData,
        },
        {
          name: "Số lượng đã book",
          data: renderBookedData,
        },
      ];

      const maxTotal = Math.max(
        ...sortedData.map(
          (item) => (item.quantity || 0) + (item.quantity_booked || 0)
        )
      );
      const numDigits = maxTotal.toString().length;
      const base = Math.pow(10, numDigits - 1);
      const yAxisMax = Math.ceil(maxTotal / base) * base + minBarLength * 2;

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
              enabled: true,
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
              barHeight: "60%",
              dataLabels: {
                position: "center",
              },
              columnWidth: "100%",
              rangeBarOverlap: false,
              rangeBarGroupRows: false,
              borderRadius: 0,
              startingShape: "flat",
              endingShape: "flat",
            },
          },
          title: {
            text: "Thống kê số lượng theo nhà cung cấp",
            align: "left" as const,
            style: {
              fontSize: "18px",
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
              enabled: true,
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
              maxWidth: 450,
              trim: false,
              formatter: function (val: number, opts?: any) {
                const value =
                  opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                return value.length > 35
                  ? value.substring(0, 35) + "..."
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
          <div class="dark:text-white">Số lượng có sẵn: <b>${data.quantity}</b></div>
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
            fontSize: "16px",
          },
          colors: chartColors.totalAvailable,
          dataLabels: {
            enabled: true,
            formatter: function (
              val: any,
              { seriesIndex, dataPointIndex }: any
            ) {
              const displayVal =
                seriesIndex === 0
                  ? trueQuantityData[dataPointIndex]
                  : trueBookedData[dataPointIndex];

              return displayVal > 0 ? displayVal.toFixed(0) : "";
            },
            style: {
              colors: ["#fff"],
              fontSize: "14px",
              fontWeight: "bold",
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
              left: 120,
            },
            borderColor: "#f1f1f1",
            strokeDashArray: 0,
          },

          responsive: [
            {
              // Desktop large (>= 1440px)
              breakpoint: 9999,
              options: {
                chart: {
                  height: 800,
                },
                plotOptions: {
                  bar: {
                    barHeight: 35,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 500,
                    style: {
                      fontSize: "12px",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 40
                        ? value.substring(0, 40) + "..."
                        : value;
                    },
                  },
                },
                grid: {
                  padding: {
                    left: 200,
                  },
                },
                title: {
                  style: {
                    fontSize: "18px",
                  },
                },
                dataLabels: {
                  style: {
                    fontSize: "14px",
                  },
                },
              },
            },
            {
              // Desktop medium (1024px - 1439px)
              breakpoint: 1440,
              options: {
                chart: {
                  height: 700,
                },
                plotOptions: {
                  bar: {
                    barHeight: 30,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 400,
                    style: {
                      fontSize: "11px",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 30
                        ? value.substring(0, 30) + "..."
                        : value;
                    },
                  },
                },
                grid: {
                  padding: {
                    left: 160,
                  },
                },
                title: {
                  style: {
                    fontSize: "16px",
                  },
                },
                dataLabels: {
                  style: {
                    fontSize: "13px",
                  },
                },
              },
            },
            {
              // Tablet (768px - 1023px)
              breakpoint: 1024,
              options: {
                chart: {
                  height: 600,
                },
                plotOptions: {
                  bar: {
                    barHeight: 25,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 180,
                    style: {
                      fontSize: "10px",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 18
                        ? value.substring(0, 18) + "..."
                        : value;
                    },
                  },
                },
                legend: {
                  offsetX: 0,
                  fontSize: "11px",
                },
                grid: {
                  padding: {
                    left: 120,
                  },
                },
                title: {
                  style: {
                    fontSize: "15px",
                  },
                },
                dataLabels: {
                  style: {
                    fontSize: "11px",
                  },
                },
                xaxis: {
                  tickAmount: 4,
                },
              },
            },
            {
              // Mobile large (576px - 767px)
              breakpoint: 768,
              options: {
                chart: {
                  height: 500,
                },
                plotOptions: {
                  bar: {
                    barHeight: 20,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 120,
                    style: {
                      fontSize: "12px",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 15
                        ? value.substring(0, 15) + "..."
                        : value;
                    },
                  },
                },
                title: {
                  style: {
                    fontSize: "16px",
                  },
                },
                dataLabels: {
                  enabled: true,
                  style: {
                    fontSize: "12px",
                  },
                },
                legend: {
                  position: "bottom",
                  fontSize: "12px",
                  offsetX: 0,
                  horizontalAlign: "center" as const,
                },
                grid: {
                  padding: {
                    left: 90,
                  },
                },
                xaxis: {
                  tickAmount: 3,
                },
              },
            },
            {
              // Mobile small (< 576px)
              breakpoint: 576,
              options: {
                chart: {
                  height: 450,
                },
                plotOptions: {
                  bar: {
                    barHeight: 18,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 100,
                    style: {
                      fontSize: "10px",
                      fontWeight: "bold",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 12
                        ? value.substring(0, 12) + "..."
                        : value;
                    },
                  },
                },
                title: {
                  style: {
                    fontSize: "18px",
                  },
                  margin: 15,
                },
                dataLabels: {
                  enabled: true,
                },
                legend: {
                  position: "bottom",
                  fontSize: "12px",
                  offsetX: 0,
                  horizontalAlign: "center" as const,
                },
                grid: {
                  padding: {
                    left: 70,
                  },
                },
                xaxis: {
                  tickAmount: 2,
                  labels: {
                    style: {
                      fontSize: "10px",
                    },
                  },
                },
              },
            },
          ],
        },
      };
    } else {
      const sortedData = [...chartData].sort(
        (a, b) => (b.total || 0) - (a.total || 0)
      );

      const minBarLength = 30;
      const trueBookedData = sortedData.map((item) => item.booked || 0);
      const trueDeployedData = sortedData.map((item) => item.deployed || 0);

      const renderBookedData = trueBookedData.map((val) =>
        val === 0 ? 0 : val + minBarLength
      );
      const renderDeployedData = trueDeployedData.map((val) =>
        val === 0 ? 0 : val + minBarLength
      );

      const maxValue = Math.max(
        ...sortedData.map((item) => (item.booked || 0) + (item.deployed || 0))
      );
      const numDigits = maxValue.toString().length;
      const base = Math.pow(10, numDigits - 1);
      const xAxisMax = Math.ceil(maxValue / base) * base + minBarLength * 2;
      const itemCount = chartData.length;
      const minHeightPerBar = 50;
      const minHeight = 300;
      const maxHeight = 1200;
      const computedHeight = Math.max(
        minHeight,
        Math.min(itemCount * minHeightPerBar, maxHeight)
      );
      return {
        series: [
          {
            name: "Đã book",
            data: renderBookedData,
          },
          {
            name: "Đã triển khai",
            data: renderDeployedData,
          },
        ],
        options: {
          chart: {
            type: "bar" as const,
            height: computedHeight,
            stacked: true,
            toolbar: {
              show: false,
            },
            fontSize: "20px",
            fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
            animations: {
              enabled: true,
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
              barHeight: 30,
              dataLabels: {
                position: "center",
              },
              columnWidth: "100%",
              rangeBarOverlap: false,
              rangeBarGroupRows: false,
              borderRadius: 0,
              startingShape: "flat",
              endingShape: "flat",
            },
          },
          colors: ["#3B82F6", "#FF9800"],
          dataLabels: {
            enabled: true,
            formatter: function (
              val: any,
              { seriesIndex, dataPointIndex }: any
            ) {
              const displayVal =
                seriesIndex === 0
                  ? trueBookedData[dataPointIndex]
                  : trueDeployedData[dataPointIndex];

              return displayVal > 0 ? displayVal.toFixed(0) : "";
            },
            style: {
              colors: ["#fff"],
              fontSize: "14px",
              fontWeight: "bold",
            },
          },
          xaxis: {
            categories: sortedData.map((item) => item.name),
            labels: {
              formatter: function (val: any) {
                return val.toFixed(0);
              },
            },
            max: xAxisMax,
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
              enabled: true,
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
              maxWidth: 450,
              trim: false,
              formatter: function (val: number, opts?: any) {
                const value =
                  opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                return value.length > 35
                  ? value.substring(0, 35) + "..."
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
              left: 80,
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
              fontSize: "18px",
              fontWeight: "bold",
              fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              color: theme == "light" ? "#333" : "#fff",
            },
            margin: 20,
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
            fontSize: "16px",
          },
          responsive: [
            {
              // Desktop large (>= 1440px)
              breakpoint: 9999,
              options: {
                chart: {
                  height: computedHeight,
                },
                plotOptions: {
                  bar: {
                    barHeight: 35,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 500,
                    style: {
                      fontSize: "12px",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 40
                        ? value.substring(0, 40) + "..."
                        : value;
                    },
                  },
                },
                grid: {
                  padding: {
                    left: 160,
                  },
                },
                title: {
                  style: {
                    fontSize: "18px",
                  },
                },
                dataLabels: {
                  style: {
                    fontSize: "14px",
                  },
                },
              },
            },
            {
              // Desktop medium (1024px - 1439px)
              breakpoint: 1440,
              options: {
                chart: {
                  height: Math.max(
                    minHeight,
                    Math.min(itemCount * 45, maxHeight)
                  ),
                },
                plotOptions: {
                  bar: {
                    barHeight: 30,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 400,
                    style: {
                      fontSize: "11px",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 30
                        ? value.substring(0, 30) + "..."
                        : value;
                    },
                  },
                },
                grid: {
                  padding: {
                    left: 120,
                  },
                },
                title: {
                  style: {
                    fontSize: "16px",
                  },
                },
                dataLabels: {
                  style: {
                    fontSize: "18px",
                  },
                },
              },
            },
            {
              // Tablet (768px - 1023px)
              breakpoint: 1024,
              options: {
                chart: {
                  height: Math.max(
                    minHeight,
                    Math.min(itemCount * 40, maxHeight)
                  ),
                },
                plotOptions: {
                  bar: {
                    barHeight: 25,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 180,
                    style: {
                      fontSize: "10px",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 18
                        ? value.substring(0, 18) + "..."
                        : value;
                    },
                  },
                },
                legend: {
                  offsetX: 0,
                  fontSize: "14px",
                },
                grid: {
                  padding: {
                    left: 120,
                  },
                },
                title: {
                  style: {
                    fontSize: "15px",
                  },
                },
                dataLabels: {
                  style: {
                    fontSize: "11px",
                  },
                },
                xaxis: {
                  tickAmount: 4,
                },
              },
            },
            {
              // Mobile large (576px - 767px)
              breakpoint: 768,
              options: {
                chart: {
                  height: Math.max(
                    minHeight,
                    Math.min(itemCount * 35, maxHeight)
                  ),
                },
                plotOptions: {
                  bar: {
                    barHeight: 20,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 120,
                    style: {
                      fontSize: "12px",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 15
                        ? value.substring(0, 15) + "..."
                        : value;
                    },
                  },
                },
                title: {
                  style: {
                    fontSize: "16px",
                  },
                },
                dataLabels: {
                  enabled: true,
                  style: {
                    fontSize: "12px",
                  },
                },
                legend: {
                  position: "bottom",
                  fontSize: "12px",
                  offsetX: 0,
                  horizontalAlign: "center" as const,
                },
                grid: {
                  padding: {
                    left: 90,
                  },
                },
                xaxis: {
                  tickAmount: 3,
                },
              },
            },
            {
              // Mobile small (< 576px)
              breakpoint: 576,
              options: {
                chart: {
                  height: Math.max(
                    minHeight,
                    Math.min(itemCount * 30, maxHeight)
                  ),
                },
                plotOptions: {
                  bar: {
                    barHeight: 18,
                  },
                },
                yaxis: {
                  labels: {
                    maxWidth: 100,
                    style: {
                      fontSize: "10px",
                      fontWeight: "bold",
                    },
                    formatter: function (val: number, opts?: any) {
                      const value =
                        opts?.w?.globals?.labels[opts?.dataPointIndex] || "";
                      return value.length > 12
                        ? value.substring(0, 12) + "..."
                        : value;
                    },
                  },
                },
                title: {
                  style: {
                    fontSize: "18px",
                  },
                  margin: 15,
                },
                dataLabels: {
                  enabled: true,
                  style: {
                    fontSize: "11px",
                  },
                },
                legend: {
                  position: "bottom",
                  fontSize: "12px",
                  offsetX: 0,
                  horizontalAlign: "center" as const,
                },
                grid: {
                  padding: {
                    left: 70,
                  },
                },
                xaxis: {
                  tickAmount: 2,
                  labels: {
                    style: {
                      fontSize: "10px",
                    },
                  },
                },
              },
            },
          ],
        },
        height: computedHeight,
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
          className={`flex flex-col gap-3 mb-4 sm:flex-row ${
            selectedData == "booked_by_sales"
              ? "sm:justify-between sm:items-center"
              : "sm:justify-end"
          }`}>
          {/* Button Group */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 md:gap-3">
            <button
              className={
                "px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 border whitespace-nowrap " +
                (selectedData === "total_available"
                  ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 dark:shadow-blue-500/20"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 " +
                    "dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500")
              }
              onClick={() => setSelectedData("total_available")}>
              Tổng số có sẵn
            </button>

            <button
              className={
                "px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 border whitespace-nowrap " +
                (selectedData === "booked_by_sales"
                  ? "bg-green-500 hover:bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/25 dark:shadow-green-500/20"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 " +
                    "dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500")
              }
              onClick={() => setSelectedData("booked_by_sales")}>
              Sale đã book
            </button>
          </div>

          {/* Date Input Section - Only show when booked_by_sales is selected */}
          {selectedData == "booked_by_sales" && (
            <div className="flex items-center gap-3 sm:gap-4 sm:ml-4 sm:mt-0 mt-2 order-first sm:order-none w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={date}
                  onChange={handleDateChange}
                  placeholder="YYYY/MM/DD"
                  className="px-3 py-2 border rounded-lg w-full sm:w-32 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  maxLength={10}
                />
                {loading && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Loading...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <ApexCharts
          key={chartKey}
          options={chartOptions.options}
          series={chartOptions.series}
          type="bar"
          height={chartOptions.height} // ✅ Dùng số
          width="100%"
        />

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
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
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
