import React, { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { getDetailCombo } from "../../services/subcription";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";

interface CidItem {
  cid: string;
  description: string;
  mb: number;
  name: string;
  ot: number;
  vn: number;
  vt: number;
}

interface ComboQuotaChartProps {
  slide_user: string[];
}

interface CidsTableProps {
  data: CidItem[] | null | undefined;
  isLoading: boolean;
}

const CidsTable: React.FC<CidsTableProps> = ({ data, isLoading }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const noData = !data || data.length === 0;

  // ---------------------------------------------
  // SEARCH
  // ---------------------------------------------
  const filteredData = useMemo(() => {
    if (noData) return [];

    const lower = search.toLowerCase();

    return data.filter(
      (item) =>
        item.cid.toLowerCase().includes(lower) ||
        item.name.toLowerCase().includes(lower)
    );
  }, [data, search, noData]);

  // ---------------------------------------------
  // PAGINATION
  // ---------------------------------------------
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-md font-semibold">Danh sách CID</h4>

        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm CID hoặc tên..."
          className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* --------------------- LOADING --------------------- */}
      {isLoading && (
        <div className="py-10 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Đang tải dữ liệu...
          </p>
        </div>
      )}

      {/* --------------------- EMPTY --------------------- */}
      {!isLoading && noData && (
        <div className="py-10 text-center text-gray-500">
          Không có dữ liệu CID
        </div>
      )}

      {/* --------------------- TABLE --------------------- */}
      {!isLoading && !noData && (
        <>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                <th className="px-4 py-2">CID</th>
                <th className="px-4 py-2">Tên</th>
                <th className="px-4 py-2 text-center">VT</th>
                <th className="px-4 py-2 text-center">MB</th>
                <th className="px-4 py-2 text-center">VN</th>
                <th className="px-4 py-2 text-center">OT</th>
                <th className="px-4 py-2">Mô tả</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={item.cid}
                  className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{item.cid}</td>
                  <td className="px-4 py-2">{item.name}</td>

                  <td className="px-4 py-2 text-center">{item.vt}</td>
                  <td className="px-4 py-2 text-center">{item.mb}</td>
                  <td className="px-4 py-2 text-center">{item.vn}</td>
                  <td className="px-4 py-2 text-center">{item.ot}</td>

                  <td className="px-4 py-2">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50">
              Trước
            </button>

            <span className="text-sm">
              Trang {page}/{totalPages || 1}
            </span>

            <button
              onClick={handleNext}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50">
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const ComboQuotaChart: React.FC<ComboQuotaChartProps> = ({
  slide_user,
}) => {
  // Tạo chart options
  const getQuotaChartOptions = (): ApexOptions => {
    const dates = quotaData.map((item: any) => {
      const date = new Date(item.datemon);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    return {
      chart: {
        type: "line",
        height: 350,
        toolbar: {
          show: true,
        },
        fontFamily: "'Roboto', 'Arial', sans-serif",
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      colors: ["#465FFF"],
      xaxis: {
        categories: dates,
        title: {
          text: "Thời gian",
          style: {
            fontSize: "14px",
          },
        },
      },
      yaxis: {
        title: {
          text: "Gọi ra",
          style: {
            fontSize: "14px",
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val}`,
        },
      },
    };
  };

  // ===== MONTH & YEAR STATE =====
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentDate.getFullYear().toString());

  // ===== OPTIONS FOR SELECT =====
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Tháng ${i + 1}`,
  }));

  const years = Array.from(
    { length: currentDate.getFullYear() - 2020 + 1 },
    (_, i) => {
      const year = 2020 + i;
      return {
        value: year.toString(),
        label: year.toString(),
      };
    }
  );

  // ===== DETAIL & CHART DATA =====
  const [comboDetail, setComboDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  useEffect(() => {
    const fetchComboDetail = async () => {
      if (!slide_user || slide_user.length === 0) {
        setComboDetail(null);
        return;
      }

      setIsLoadingDetail(true);

      try {
        // Format month to always be 2 digits (e.g., "01", "02", ..., "12")
        const formattedMonth = selectedMonth.padStart(2, "0");
        const monthYear = `${selectedYear}-${formattedMonth}`;
        
        const result = await getDetailCombo(
          JSON.stringify(slide_user),
          monthYear
        );

        if (result?.message === "OK") {
          setComboDetail(result.data);
        } else {
          setComboDetail(null);
        }
      } catch (error) {
        setComboDetail(null);
        console.log(error);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchComboDetail();
  }, [slide_user, selectedMonth, selectedYear]);

  const quotaData = comboDetail?.quota_data || [];
  const cidData = comboDetail?.cids_data || [];
  const totalCallOut = comboDetail?.total_call_out || 0;

  // Tạo chart series
  const getQuotaChartSeries = () => {
    return [
      {
        name: "Call Out",
        data: quotaData.map((item: any) => item.call_out),
      },
    ];
  };

  // Hiển thị loading khi đang tải
  if (isLoadingDetail) {
    return (
      <div className="relative min-h-[500px]">
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Đang tải dữ liệu biểu đồ...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Nếu không có dữ liệu sau khi load xong
  if (!quotaData || quotaData.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Month & Year Selectors */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Chọn năm</Label>
                <Select
                  placeholder="Chọn năm"
                  options={years}
                  value={selectedYear}
                  onChange={(value) => setSelectedYear(value)}
                />
              </div>
              <div>
                <Label>Chọn tháng</Label>
                <Select
                  placeholder="Chọn tháng"
                  options={months}
                  value={selectedMonth}
                  onChange={(value) => setSelectedMonth(value)}
                />
              </div>
            </div>

      <div className="flex justify-between items-center mb-3">
        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">
          Biểu đồ sử dụng (call_out)
        </h4>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400">
              Tổng:
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {totalCallOut.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <Chart
          options={getQuotaChartOptions()}
          series={getQuotaChartSeries()}
          type="line"
          height={350}
        />
      </div>

      <div className="mt-2">
        <CidsTable data={cidData} isLoading={isLoadingDetail} />
      </div>
    </div>
  );
};

export default ComboQuotaChart;
