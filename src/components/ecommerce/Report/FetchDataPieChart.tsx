import { useState, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { getDetailReportByRole } from "../../../services/report";
import { IReportDetail, IReportRole } from "../../../types";
import ModalPagination from "../../common/ModalPagination";

interface IReportData {
  data: IReportDetail[];
  total_pages: number;
}

const COLUMNS: { key: keyof IReportDetail; label: string }[] = [
  { key: "user_name", label: "Người book" },
  { key: "phone_number", label: "Số đã book" },
  { key: "provider_name", label: "Nhà cung cấp" },
  { key: "type_name", label: "Định dạng số" },
  { key: "installation_fee", label: "Phí cài đặt" },
  { key: "maintenance_fee", label: "Phí bảo trì" },
  { key: "vanity_number_fee", label: "Phí số đẹp" },
  { key: "booked_until", label: "Hạn đặt" },
];

const PIE_DATA = [
  {
    name: "Đã Book",
    value: 120,
    detail: "Chi tiết về số đã book",
    status_value: "booked",
  },
  {
    name: "Đã Triển Khai",
    value: 50,
    detail: "Chi tiết về số đã triển khai",
    status_value: "booked_expiration",
  },
];

const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];
const INITIAL_LIMIT = 5;

const NumberStatusPieChart = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportData, setReportData] = useState<IReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    limit: INITIAL_LIMIT,
    offset: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<{
    status: string;
    year?: number;
    month?: number;
    day?: number;
  }>({ status: "" });

  const fetchReport = useCallback(
    async (
      status: string,
      limit: number,
      offset: number,
      year?: number,
      month?: number,
      day?: number
    ) => {
      setIsLoading(true); // Bật loading trước khi fetch
      try {
        const params: IReportRole = {
          option: status,
          limit,
          offset,
          year,
          month,
          day,
        };
        const response = await getDetailReportByRole(params);
        setReportData(response.data);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.total_pages,
        }));
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setIsLoading(false); // Tắt loading sau khi hoàn thành
      }
    },
    []
  );

  const handlePagination = useCallback(
    (updates: Partial<typeof pagination>) => {
      setPagination((prev) => {
        const newPagination = { ...prev, ...updates };
        fetchReport(
          filters.status,
          newPagination.limit,
          newPagination.offset,
          filters.year,
          filters.month,
          filters.day
        );
        return newPagination;
      });
    },
    [fetchReport, filters]
  );

  const handlePieClick = useCallback(
    (entry: (typeof PIE_DATA)[0]) => {
      setFilters((prev) => ({ ...prev, status: entry.status_value }));
      fetchReport(
        entry.status_value,
        pagination.limit,
        pagination.offset,
        filters.year,
        filters.month,
        filters.day
      );
      setIsModalOpen(true);
    },
    [fetchReport, pagination, filters]
  );

  const pieCells = useMemo(
    () =>
      PIE_DATA.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={COLORS[index % COLORS.length]}
          className="cursor-pointer transition-transform hover:scale-101"
          onClick={() => handlePieClick(entry)}
        />
      )),
    [handlePieClick]
  );

  return (
    <div className="flex flex-col items-center h-screen">
      <h3 className="text-xl font-semibold mb-4">
        Thống kê số theo trạng thái
      </h3>

      {/* Hiển thị loading cho PieChart nếu cần */}
      {isLoading && !isModalOpen ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <PieChart width={400} height={400}>
          <Pie
            data={PIE_DATA}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label>
            {pieCells}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      )}

      <ModalPagination
        isOpen={isModalOpen}
        title="Chi tiết báo cáo"
        data={reportData?.data || []}
        columns={COLUMNS}
        totalPages={pagination.totalPages}
        limit={pagination.limit}
        offset={pagination.offset}
        year={filters.year}
        month={filters.month}
        day={filters.day}
        fetchData={(params) => {
          setFilters((prev) => ({ ...prev, ...params }));
          fetchReport(
            filters.status,
            params.limit,
            params.offset,
            params.year,
            params.month,
            params.day
          );
        }}
        onPageChange={(limit: any, offset: any) =>
          handlePagination({ limit, offset })
        }
        onLimitChange={(limit: any) => handlePagination({ limit, offset: 0 })}
        setYear={(year: any) => setFilters((prev) => ({ ...prev, year }))}
        setMonth={(month: any) => setFilters((prev) => ({ ...prev, month }))}
        setNumber={(day: any) => setFilters((prev) => ({ ...prev, day }))}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default NumberStatusPieChart;
