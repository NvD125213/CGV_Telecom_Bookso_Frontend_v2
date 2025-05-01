import { useState, useCallback, useEffect } from "react";
import ApexCharts from "react-apexcharts";
import ComponentCard from "../../common/ComponentCard";
import { getDashBoard } from "../../../services/report";
import debounce from "lodash/debounce";

interface TotalAvailable {
  provider: string;
  quantity: number;
  quantity_booked: number;
}

interface BookedBySales {
  user_name: string;
  quantity: number;
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
}

const ProviderReport = () => {
  const [selectedData, setSelectedData] = useState<
    "total_available" | "booked_by_sales"
  >("total_available");
  const currentDate = new Date();
  const [date, setDate] = useState<string>(
    `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
    )}`
  );
  const [data, setData] = useState<DashboardData>({
    booked: 0,
    deployed: 0,
    total_available: [],
    booked_by_sales: [],
  });
  const [loading, setLoading] = useState(false);
  const [chartColors] = useState({
    totalAvailable: ["#4CAF50", "#2196F3"],
    bookedBySales: ["#FF9800"],
  });

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

  const fetchData = useCallback(
    debounce(async (year: string, month: string, day: string) => {
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
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    fetchData(currentYear, currentMonth, "");
  }, [fetchData]);

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
          .map((item) => ({
            name: item.user_name,
            value: item.quantity,
          }))
          .sort((a, b) => (b.value || 0) - (a.value || 0));

  const getChartOptions = () => {
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
      const threshold = maxTotal / 100; // Ngưỡng để ẩn label

      return {
        series,
        options: {
          chart: {
            type: "bar",
            height: 800,
            stacked: true,
            toolbar: {
              show: false,
            },
            fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
            spacing: {
              top: 5,
              right: 5,
              bottom: 5,
              left: 0,
            },
            animations: {
              enabled: false,
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
            align: "left",
            style: {
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              color: "#333",
            },
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
                <div><b>${data.name}</b></div>
                <div>Số lượng có sẵn: ${data.quantity}</div>
                <div>Số lượng đã book: ${data.quantity_booked}</div>
                <div><b>Tổng: ${total}</b></div>
              </div>`;
            },
          },
          fill: {
            opacity: 1,
          },
          legend: {
            position: "top",
            horizontalAlign: "left",
            offsetX: 40,
          },
          colors: chartColors.totalAvailable,
          dataLabels: {
            enabled: true,
            formatter: function (val, { seriesIndex, dataPointIndex, w }) {
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
            textAnchor: "middle",
            offsetX: 0,
            offsetY: 0,
            background: {
              enabled: false,
            },
            dropShadow: {
              enabled: false,
            },
            custom: function ({ seriesIndex, dataPointIndex, w }) {
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
              left: 0,
            },
            borderColor: "#f1f1f1",
            strokeDashArray: 0,
          },
        },
      };
    } else {
      const sortedData = [...chartData].sort(
        (a, b) => (b.value || 0) - (a.value || 0)
      );

      const maxValue = Math.max(...sortedData.map((item) => item.value || 0));
      const numDigits = maxValue.toString().length;
      const base = Math.pow(10, numDigits - 1);
      const xAxisMax = Math.ceil(maxValue / base) * base;
      const threshold = maxValue / 100; // Ngưỡng để ẩn label

      return {
        series: [
          {
            name: "Sale đã book",
            data: sortedData.map((item) => item.value || 0),
          },
        ],
        options: {
          chart: {
            type: "bar",
            height: 800,
            toolbar: {
              show: false,
            },
            fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
            spacing: {
              top: 5,
              right: 5,
              bottom: 5,
              left: 0,
            },
            animations: {
              enabled: false,
            },
          },
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: "30%",
              distributed: true,
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
          xaxis: {
            categories: sortedData.map((item) => item.name),
            labels: {
              formatter: function (val) {
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
              left: 0,
            },
            borderColor: "#f1f1f1",
            strokeDashArray: 0,
          },
          tooltip: {
            y: {
              formatter: function (val) {
                return val.toFixed(0);
              },
            },
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
              const data = sortedData[dataPointIndex];
              return `<div class="p-2">
                <div><b>${data.name}</b></div>
                <div>Số lượng đã book: ${data.value}</div>
              </div>`;
            },
          },
          colors: chartColors.bookedBySales,
          dataLabels: {
            enabled: true,
            formatter: function (val) {
              if (val < threshold) {
                return "";
              }
              return val === 1 ? "" : val > 0 ? val.toFixed(0) : "";
            },
            style: {
              colors: ["#fff"],
              fontSize: "14px",
              fontWeight: "bold",
            },
            textAnchor: "middle",
            offsetX: 0,
            offsetY: 0,
            background: {
              enabled: false,
            },
            dropShadow: {
              enabled: false,
            },
            custom: function ({ seriesIndex, dataPointIndex, w }) {
              const value = w.globals.series[seriesIndex][dataPointIndex];
              if (value < threshold) {
                return "";
              }
              const maxValue = Math.max(...w.globals.series[seriesIndex]);
              const percentage = (value / maxValue) * 100;
              let fontSize = "14px";
              if (percentage < 10) {
                fontSize = "10px";
              } else if (percentage < 20) {
                fontSize = "12px";
              }
              return `<div style="font-size: ${fontSize}">${value}</div>`;
            },
          },
          title: {
            text: "Thống kê số lượng theo sale",
            align: "left",
            style: {
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              color: "#333",
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
          chart: {
            toolbar: {
              show: false,
            },
            animations: {
              enabled: true,
            },
            spacing: {
              between: 15,
            },
          },
        },
      };
    }
  };

  return (
    <ComponentCard>
      <div className="p-3">
        <div className="flex justify-between items-center mb-4">
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
          <ApexCharts
            key={selectedData}
            options={getChartOptions().options}
            series={getChartOptions().series}
            type="bar"
            height="100%"
            width="100%"
          />
        </div>
      </div>
    </ComponentCard>
  );
};

export default ProviderReport;
