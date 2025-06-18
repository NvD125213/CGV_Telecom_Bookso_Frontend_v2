import { useEffect, useRef, useState } from "react";
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

  const fetchData = async () => {
    try {
      const response = await getDashBoard({
        year,
        month,
        day: day ? parseInt(day) : undefined,
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
    } catch (error: any) {
      console.log("Lỗi khi lấy dữ liệu:", error.response?.data?.detail);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month, day]);

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

  // Tính toán radius dựa trên kích thước màn hình
  const getRadius = () => {
    if (windowWidth < 760) {
      return {
        innerRadius: 40, // Giảm từ 60 xuống 40
        outerRadius: 80, // Giảm từ 120 xuống 80
      };
    }
    return {
      innerRadius: 60,
      outerRadius: 120,
    };
  };

  const { innerRadius, outerRadius } = getRadius();

  return (
    <ComponentCard>
      <div className="flex flex-col items-center py-3">
        <h3 className="text-xl font-semibold mb-4 dark:text-white">
          Thống kê số theo trạng thái
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4 w-full">
          {/* Row 1 - 2 Select */}
          <div className="col-span-2 md:col-span-1">
            <Select
              options={Array.from({ length: 10 }, (_, index) => ({
                value: (new Date().getFullYear() - index).toString(),
                label: (new Date().getFullYear() - index).toString(),
              }))}
              value={year.toString()}
              onChange={(value) => setYear(parseInt(value))}
              className="w-full"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Select
              options={Array.from({ length: 12 }, (_, index) => ({
                value: (index + 1).toString(),
                label: `Tháng ${index + 1}`,
              }))}
              value={month.toString()}
              onChange={(value) => setMonth(parseInt(value))}
              className="w-full"
            />
          </div>

          {/* Row 2 - Input full width */}
          <div className="col-span-2">
            <Input
              type="number"
              className="w-full"
              placeholder="Ngày"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              min="1"
              max="31"
            />
          </div>
        </div>

        {totalValue === 0 ? (
          <div className="text-center text-gray-500 text-lg dark:text-white">
            Chưa có dữ liệu
          </div>
        ) : (
          <div className="w-full z-0 max-w-[500px] min-h-[320px] h-[320px] md:h-[350px] lg:h-[400px]">
            <ResponsiveContainer width={"100%"} height={"100%"}>
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  dataKey="value"
                  label>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() => handleClick(entry)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{
                    pointerEvents: "auto",
                    maxWidth: "90vw",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
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
