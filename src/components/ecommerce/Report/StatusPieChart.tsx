import { useEffect, useRef, useState, useCallback } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getDashBoard } from "../../../services/report";
import { IReportDetail } from "../../../types";
import ComponentCard from "../../common/ComponentCard";
import ModalPagination from "../../common/ModalPagination";
import Select from "../../form/Select";
import Input from "../../form/input/InputField";

// CustomLegend component
const CustomLegend = (props: {
  payload?: any[];
  onLegendClick: (entry: any) => void;
}) => {
  const { payload, onLegendClick } = props;

  if (!payload) return null;

  return (
    <ul className="flex gap-4 justify-center mt-4">
      {payload.map((entry, index) => (
        <li
          key={`legend-item-${index}`}
          onClick={() => onLegendClick(entry)} // Gọi onLegendClick với entry từ payload
          style={{ cursor: "pointer", color: entry.color }}
          className="flex items-center gap-1">
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: entry.color,
              borderRadius: 4,
            }}
          />
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];

const getColumns = (status: string) => {
  const baseColumns: { key: keyof IReportDetail; label: string }[] = [
    { key: "user_name", label: "Người book" },
    { key: "phone_number", label: "Số đã book" },
    { key: "provider_name", label: "Nhà cung cấp" },
    { key: "type_name", label: "Định dạng số" },
    { key: "installation_fee", label: "Phí cài đặt" },
    { key: "maintenance_fee", label: "Phí bảo trì" },
    { key: "vanity_number_fee", label: "Phí số đẹp" },
    { key: "booked_until", label: "Hạn đặt" },
    { key: "booked_at", label: "Thời gian đặt" },
  ];

  if (status === "released") {
    return [
      ...baseColumns,
      { key: "released_at", label: "Thời gian triển khai" },
      { key: "user_name_release", label: "Người triển khai" },
      { key: "contract_code", label: "Mã hợp đồng" },
    ];
  }

  return baseColumns;
};

const NumberStatusPieChart = () => {
  const [data, setData] = useState([
    { name: "Đã Book", value: 0, detail: "booked" },
    { name: "Đã Triển Khai", value: 0, detail: "released" },
  ]);
  const [selectedEntry, setSelectedEntry] = useState<{
    name: string;
    detail: string;
  } | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const prevSelectedEntry = useRef<typeof selectedEntry>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Sử dụng useRef để theo dõi các thay đổi và tránh gọi API không cần thiết
  const lastFetchParamsRef = useRef<any>(null);
  const isInitialMountRef = useRef(true);
  const hasFetchedRef = useRef(false);

  // Tạo object chứa tất cả các tham số để so sánh
  const getCurrentParams = useCallback(
    () => ({
      year,
      month,
      day: day ? parseInt(day) : undefined,
    }),
    [year, month, day]
  );

  // Kiểm tra xem có cần fetch data hay không
  const shouldFetchData = useCallback(() => {
    const currentParams = getCurrentParams();

    // Nếu là lần đầu mount, cần fetch
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return true;
    }

    // So sánh với lần fetch cuối cùng
    if (lastFetchParamsRef.current === null) {
      return true;
    }

    // So sánh từng tham số
    const lastParams = lastFetchParamsRef.current;
    return (
      currentParams.year !== lastParams.year ||
      currentParams.month !== lastParams.month ||
      currentParams.day !== lastParams.day
    );
  }, [getCurrentParams]);

  const fetchData = useCallback(async () => {
    if (!shouldFetchData()) return;

    try {
      const currentParams = getCurrentParams();

      const response = await getDashBoard({
        year: currentParams.year,
        month: currentParams.month,
        day: currentParams.day,
      });

      setData([
        {
          name: "Đã Book",
          value: response?.data?.booked || 0,
          detail: "booked",
        },
        {
          name: "Đã Triển Khai",
          value: response?.data?.deployed || 0,
          detail: "released",
        },
      ]);

      // Cập nhật tham số cuối cùng đã fetch
      lastFetchParamsRef.current = currentParams;
      hasFetchedRef.current = true;
    } catch (error: any) {
      console.log("Lỗi khi lấy dữ liệu:", error.response?.data?.detail);
    }
  }, [shouldFetchData, getCurrentParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClick = (entry: any) => {
    // For Pie chart clicks, entry is the full data object
    // For Legend clicks, entry is { value, color, ... }, so we need to find the matching data object
    const selectedData = data.find(
      (item) => item.name === entry.name || item.name === entry.value
    );
    if (selectedData) {
      setSelectedEntry(selectedData);
      setIsModalOpen(true);
      prevSelectedEntry.current = selectedData;
    }
  };

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Logic để tạo minimum segment size cho pie chart
  const getDisplayData = () => {
    if (totalValue === 0) return data;

    const minSegmentPercentage = 5; // Tối thiểu 5% để dễ nhìn và click
    const minValue = (totalValue * minSegmentPercentage) / 100;

    // Tạo data hiển thị với minimum size
    const displayData = data.map((item) => ({
      ...item,
      displayValue: item.value === 0 ? 0 : Math.max(item.value, minValue),
      originalValue: item.value, // Lưu giá trị gốc để hiển thị trong tooltip
    }));

    return displayData;
  };

  const displayData = getDisplayData();

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getRadius = () => {
    if (windowWidth < 760) {
      return {
        innerRadius: 40,
        outerRadius: 80,
      };
    }
    return {
      innerRadius: 60,
      outerRadius: 120,
    };
  };

  const { innerRadius, outerRadius } = getRadius();

  return (
    <ComponentCard className="h-[500px]">
      <div className="flex flex-col items-center py-3">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 dark:text-white">
          Thống kê số theo trạng thái
        </h3>

        {/* Mobile Filter Toggle Button */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="
            md:hidden w-full mb-4 px-4 py-3 
            bg-white dark:bg-gray-800 
            text-gray-800 dark:text-white 
            font-semibold text-base 
            transition-all duration-200 
            flex items-center justify-between 
            shadow-md dark:shadow-lg 
            hover:shadow-lg dark:hover:shadow-xl 
            transform hover:scale-[1.02] active:scale-[0.98] 
          ">
          {" "}
          <span>Bộ lọc thời gian</span>
          <svg
            className={`w-6 h-6 transition-all duration-300 ease-in-out transform ${
              isFiltersOpen ? "rotate-180 scale-110" : "rotate-0 scale-100"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Filter Controls */}
        <div
          className={`w-full mb-4 ${
            // Mobile: show/hide based on isFiltersOpen
            // Desktop: always show
            isFiltersOpen ? "block" : "hidden"
          } md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <Select
                options={Array.from({ length: 10 }, (_, index) => ({
                  value: (new Date().getFullYear() - index).toString(),
                  label: (new Date().getFullYear() - index).toString(),
                }))}
                value={year.toString()}
                onChange={(value) => setYear(parseInt(value))}
                className="w-full rounded-none"
              />
            </div>
            <div className="col-span-1">
              <Select
                options={Array.from({ length: 12 }, (_, index) => ({
                  value: (index + 1).toString(),
                  label: `Tháng ${index + 1}`,
                }))}
                value={month.toString()}
                onChange={(value) => setMonth(parseInt(value))}
                className="w-full rounded-none"
              />
            </div>
            {/* Input ngày */}
            <div className="col-span-1">
              <Input
                type="number"
                className="w-full rounded-none"
                placeholder="Ngày"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                min="1"
                max="31"
              />
            </div>
          </div>
        </div>

        {totalValue === 0 ? (
          <div className="text-center text-gray-500 text-base sm:text-lg dark:text-white">
            Chưa có dữ liệu
          </div>
        ) : (
          <div className="w-full z-0 max-w-[500px] min-h-[320px] h-[320px] md:h-[350px]">
            <ResponsiveContainer width={"100%"} height={"100%"}>
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="45%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  dataKey="displayValue"
                  label={({ name, originalValue, value }) => {
                    const actualValue = originalValue || value;
                    return actualValue > 0 ? actualValue : "";
                  }}>
                  {displayData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() => handleClick(entry)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow-lg dark:bg-gray-800 dark:border-gray-600">
                          <p className="text-gray-800 dark:text-white font-medium">
                            {data.name}
                          </p>
                          <p className="text-blue-600 dark:text-blue-400">
                            Số lượng:{" "}
                            <strong>{data.originalValue || data.value}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  content={(props) => (
                    <CustomLegend {...props} onLegendClick={handleClick} />
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <ModalPagination
        onSuccess={async () => {
          // Force refetch data after success
          lastFetchParamsRef.current = null;
          await fetchData();
        }}
        isOpen={isModalOpen}
        title={`Chi tiết về danh sách số ${selectedEntry?.name || ""}`}
        columns={getColumns(selectedEntry?.detail || "")}
        option={selectedEntry?.detail || ""}
        year={year}
        month={month}
        {...(day ? { day: parseInt(day) } : {})}
        onClose={() => setIsModalOpen(false)}
        currentPage={0}
        pageSize={5}
        {...(selectedEntry?.detail !== "released"
          ? { selectedIds, setSelectedIds }
          : {})}
      />
    </ComponentCard>
  );
};

export default NumberStatusPieChart;
