import { useState, useCallback, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ComponentCard from "../../common/ComponentCard";
import { getDashBoard } from "../../../services/report";
import debounce from "lodash/debounce";

interface TotalAvailable {
  provider: string;
  quantity: number;
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

  // Hàm lấy year từ value
  const getYear = (value: string): string => {
    return value.split("/")[0] || currentDate.getFullYear().toString();
  };

  // Hàm lấy month từ value
  const getMonth = (value: string): string => {
    return (
      value.split("/")[1] || String(currentDate.getMonth() + 1).padStart(2, "0")
    );
  };

  // Hàm lấy day từ value
  const getDay = (value: string): string => {
    return value.split("/")[2] || "";
  };

  // Hàm call API với debounce
  const fetchData = useCallback(
    debounce(async (year: string, month: string, day: string) => {
      try {
        setLoading(true);
        const params: any = {
          year: parseInt(year),
          month: parseInt(month),
        };

        // Chỉ thêm day vào params nếu có giá trị
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

  // Call API lần đầu khi component mount
  useEffect(() => {
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    fetchData(currentYear, currentMonth, "");
  }, [fetchData]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Chỉ cho phép nhập số

    // Format: YYYYMMDD
    if (value.length > 0) {
      // Nếu đã nhập đủ 4 số năm
      if (value.length > 4) {
        // Thêm dấu / sau năm
        value = value.slice(0, 4) + "/" + value.slice(4);
      }
      // Nếu đã nhập đủ 2 số tháng
      if (value.length > 7) {
        // Thêm dấu / sau tháng
        value = value.slice(0, 7) + "/" + value.slice(7);
      }
      // Giới hạn độ dài tối đa là 10 ký tự (YYYY/MM/DD)
      value = value.slice(0, 10);
    }

    setDate(value);

    // Lấy year, month, day và call API
    const year = getYear(value);
    const month = getMonth(value);
    const day = getDay(value);
    fetchData(year, month, day);
  };

  // Dữ liệu cho biểu đồ cột
  const chartData =
    selectedData === "total_available"
      ? data.total_available
          .map((item) => ({
            name: item.provider,
            value: item.quantity,
          }))
          .sort((a, b) => b.value - a.value)
      : data.booked_by_sales
          .map((item) => ({
            name: item.user_name,
            value: item.quantity,
          }))
          .sort((a, b) => b.value - a.value);

  // Tìm giá trị lớn nhất
  const maxValue = Math.max(...chartData.map((item) => item.value));
  // Làm tròn lên số chẵn gần nhất
  const yAxisMax = Math.ceil(maxValue / 10) * 10;

  return (
    <ComponentCard>
      <div className="p-4">
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
              className={`px-4 py-2 rounded 
                bg-blue-500 text-white
              `}>
              Booked: {data.booked}
            </button>
            <button
              className={`px-4 py-2 rounded bg-green-500 text-white
              `}>
              Deployed: {data.deployed}
            </button>
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

        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              barSize={30}
              barGap={20}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, yAxisMax]} />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow">
                        <p className="font-bold text-black dark:text-white">
                          {data.name}
                        </p>
                        <p className="text-black dark:text-white">
                          {selectedData === "total_available"
                            ? "Tổng số có sẵn"
                            : "Sale đã book"}
                          : {data.value}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar
                dataKey="value"
                fill={
                  selectedData === "total_available" ? "#8884d8" : "#82ca9d"
                }
                name={
                  selectedData === "total_available"
                    ? "Tổng số có sẵn"
                    : "Sale đã book"
                }
                className="text-black dark:text-white"
                label={{
                  position: "right",
                  fill:
                    selectedData === "total_available" ? "#8884d8" : "#82ca9d",
                  fontSize: 12,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ComponentCard>
  );
};

export default ProviderReport;
