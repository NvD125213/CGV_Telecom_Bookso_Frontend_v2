import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import ComponentCard from "../../common/ComponentCard";
import { getDashBoard, getDetailReportByRole } from "../../../services/report";
import ModalPagination from "../../common/ModalPagination";
import { IReportDetail } from "../../../types";
import { formatDate } from "../../../helper/formatDateToISOString";

const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];
const INITIAL_LIMIT = 5;

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
  ];

  if (status === "booked") {
    return [...baseColumns, { key: "booked_at", label: "Thời gian đặt" }];
  } else if (status === "released") {
    return [
      ...baseColumns,
      { key: "released_at", label: "Thời gian triển khai" },
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
  const [reportData, setReportData] = useState<any>(null);
  const [pagination, setPagination] = useState({
    limit: INITIAL_LIMIT,
    offset: 0,
    totalPages: 1,
  });
  // Dùng useRef để lưu giá trị selectedEntry trước đó
  const prevSelectedEntry = useRef<typeof selectedEntry>(null);
  // Fetch dashboard data
  useEffect(() => {
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
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };

    fetchData();
  }, [year, month, day]);

  // Fetch report data khi selectedEntry thay đổi
  useEffect(() => {
    if (selectedEntry && isModalOpen) {
      const fetchReport = async () => {
        try {
          const response = await getDetailReportByRole({
            option: selectedEntry.detail,
            limit: pagination.limit,
            offset: pagination.offset,
            year,
            month,
            day: day ? parseInt(day) : undefined,
          });

          const formattedData = response.data.data.map(
            (phone: IReportDetail) => ({
              ...phone,
              booked_until: phone.booked_until
                ? formatDate(phone.booked_until)
                : "0",
              booked_at: phone.booked_at ? formatDate(phone.booked_at) : "0",
              released_at: phone.released_at
                ? formatDate(phone.released_at)
                : "0",
            })
          );

          setReportData(formattedData);
          setPagination((prev) => ({
            ...prev,
            totalPages: response.data.total_pages,
          }));
        } catch (error) {
          console.error("Lỗi khi fetch report:", error);
        }
      };

      fetchReport();
    }
  }, [
    selectedEntry,
    isModalOpen,
    pagination.limit,
    pagination.offset,
    year,
    month,
    day,
  ]);

  const handleClick = (entry: any) => {
    const isSameEntry =
      prevSelectedEntry.current?.detail === entry.detail &&
      prevSelectedEntry.current?.name === entry.name;

    setSelectedEntry(entry);
    setPagination((prev) => ({
      ...prev,
      offset: isSameEntry ? prev.offset : 0, // Giữ offset nếu entry không thay đổi, ngược lại reset về 0
    }));
    setIsModalOpen(true);
    // Cập nhật giá trị trước đó
    prevSelectedEntry.current = entry;
  };

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ComponentCard>
      <div className="flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4">
          Thống kê số theo trạng thái
        </h3>
        <div className="flex gap-4 mb-4">
          <select
            className="p-2 border rounded dark:bg-black dark:text-white "
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}>
            {Array.from({ length: 10 }, (_, index) => (
              <option key={index} value={new Date().getFullYear() - index}>
                {new Date().getFullYear() - index}
              </option>
            ))}
          </select>

          <select
            className="p-2 border rounded dark:bg-black dark:text-white "
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index} value={index + 1}>
                Tháng {index + 1}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="p-2 border rounded w-20 dark:bg-black dark:text-white "
            placeholder="Ngày"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            min="1"
            max="31"
          />
        </div>

        {totalValue === 0 ? (
          <div className="text-center text-gray-500 text-lg">
            Chưa có dữ liệu
          </div>
        ) : (
          <PieChart width={400} height={320}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
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
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </div>

      <ModalPagination
        isOpen={isModalOpen}
        title={`Chi tiết về danh sách số ${selectedEntry?.name || ""}`}
        data={reportData || []}
        columns={getColumns(selectedEntry?.detail || "")}
        totalPages={pagination.totalPages}
        limit={pagination.limit}
        offset={pagination.offset}
        year={year}
        month={month}
        day={day ? parseInt(day) : undefined}
        fetchData={(params) => {
          setPagination((prev) => ({
            ...prev,
            limit: params.limit,
            offset: params.offset,
          }));
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </ComponentCard>
  );
};

export default NumberStatusPieChart;
