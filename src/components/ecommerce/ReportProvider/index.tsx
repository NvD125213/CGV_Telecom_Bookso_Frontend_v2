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
    totalAvailable: ["#4CAF50", "#2196F3"], // Màu xanh lá cho số lượng có sẵn, màu xanh dương cho số lượng đã book
    bookedBySales: ["#FF9800"], // Màu cam cho sale đã book
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
      // Sắp xếp dữ liệu theo tổng (quantity + quantity_booked) giảm dần
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

      // Tính toán lại yAxisMax với thêm khoảng trống
      const maxTotal = Math.max(
        ...sortedData.map(
          (item) => (item.quantity || 0) + (item.quantity_booked || 0)
        )
      );
      const yAxisMax = (() => {
        const base = 20; // Chọn bội số gần nhất như 20, 50, 100, v.v.
        return Math.ceil(maxTotal / base) * base;
      })();

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
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            },
          },
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: "85%", // Tăng barHeight vì đã giảm spacing
              dataLabels: {
                position: "center",
              },
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
          },
          yaxis: {
            labels: {
              style: {
                fontSize: "12px",
                fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              },
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
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
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
            formatter: function (val) {
              return val === 1 ? "" : val > 0 ? val.toFixed(0) : "";
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
              top: 10,
              right: 10,
              bottom: 10,
              left: 10,
            },
          },
        },
      };
    } else {
      // Xử lý cho booked_by_sales
      const sortedData = [...chartData].sort(
        (a, b) => (b.value || 0) - (a.value || 0)
      );

      const maxValue = Math.max(...sortedData.map((item) => item.value || 0));
      const xAxisMax = (() => {
        const numDigits = maxValue.toString().length;
        const base = Math.pow(10, numDigits - 1);
        // Tăng thêm khoảng trống
        return Math.ceil(maxValue / base) * base;
      })();

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
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
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
            max: xAxisMax, // Sử dụng giá trị max mới
          },
          yaxis: {
            title: {
              text: undefined,
            },
            labels: {
              style: {
                fontSize: "13px",
                fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
              },
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
              top: 10,
              right: 10,
              bottom: 10,
              left: 10,
            },
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
              return val === 1 ? "" : val > 0 ? val.toFixed(0) : "";
            },
            style: {
              colors: ["#fff"],
              fontSize: "14px",
              fontWeight: "bold",
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
          // Thêm spacing giữa các cột
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
          // Tăng khoảng cách giữa các cột
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
