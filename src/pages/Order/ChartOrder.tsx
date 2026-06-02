import React, { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { getDetailCombo } from "../../services/subcription";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { useIsMobile } from "../../hooks/useScreenSize";

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
  compact?: boolean;
}

const formatQuotaAxisValue = (val: number) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val);
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  }
  return n.toLocaleString("vi-VN");
};

const CidsTable: React.FC<CidsTableProps> = ({
  data,
  isLoading,
  compact = false,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = compact ? 10 : 20;

  const noData = !data || data.length === 0;

  const filteredData = useMemo(() => {
    if (noData) return [];

    const lower = search.toLowerCase();

    return data.filter(
      (item) =>
        item.cid.toLowerCase().includes(lower) ||
        item.name.toLowerCase().includes(lower),
    );
  }, [data, search, noData]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const cellPad = compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm";
  const headPad = compact
    ? "px-2 py-1.5 text-xs font-semibold"
    : "px-3 py-2 text-sm font-semibold";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 sm:p-4">
      <div
        className={`mb-3 gap-2 ${
          compact
            ? "flex flex-col"
            : "flex flex-col sm:flex-row sm:items-center sm:justify-between"
        }`}>
        <h4 className="text-sm font-semibold sm:text-base">Danh sách CID</h4>

        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm CID hoặc tên..."
          className={`w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
            compact ? "text-sm" : ""
          } ${compact ? "" : "sm:max-w-xs"}`}
        />
      </div>

      {isLoading && (
        <div className="py-8 text-center sm:py-10">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Đang tải dữ liệu...
          </p>
        </div>
      )}

      {!isLoading && noData && (
        <div className="py-8 text-center text-sm text-gray-500 sm:py-10">
          Không có dữ liệu CID
        </div>
      )}

      {!isLoading && !noData && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[36rem] w-full">
              <thead>
                <tr className="bg-gray-100 text-left dark:bg-gray-700">
                  <th className={`${headPad} whitespace-nowrap`}>CID</th>
                  <th className={`${headPad} whitespace-nowrap`}>Tên</th>
                  <th className={`${headPad} text-center`}>VT</th>
                  <th className={`${headPad} text-center`}>MB</th>
                  <th className={`${headPad} text-center`}>VN</th>
                  <th className={`${headPad} text-center`}>OT</th>
                  <th className={headPad}>Mô tả</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((item) => (
                  <tr
                    key={item.cid}
                    className="border-b border-gray-200 dark:border-gray-700">
                    <td className={`${cellPad} font-medium`}>{item.cid}</td>
                    <td className={cellPad}>{item.name}</td>
                    <td className={`${cellPad} text-center`}>{item.vt}</td>
                    <td className={`${cellPad} text-center`}>{item.mb}</td>
                    <td className={`${cellPad} text-center`}>{item.vn}</td>
                    <td className={`${cellPad} text-center`}>{item.ot}</td>
                    <td className={`${cellPad} max-w-[8rem] truncate sm:max-w-none`}>
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className={`mt-4 gap-2 ${
              compact
                ? "flex flex-col"
                : "flex items-center justify-between"
            }`}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={page === 1}
              className={`rounded border px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600 ${
                compact ? "w-full" : ""
              }`}>
              Trước
            </button>

            <span className="text-center text-sm">
              Trang {page}/{totalPages}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={page === totalPages}
              className={`rounded border px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600 ${
                compact ? "w-full" : ""
              }`}>
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
  const isMobile = useIsMobile(768);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (currentDate.getMonth() + 1).toString(),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    currentDate.getFullYear().toString(),
  );

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
    },
  );

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
        const formattedMonth = selectedMonth.padStart(2, "0");
        const monthYear = `${selectedYear}-${formattedMonth}`;

        const result = await getDetailCombo(
          JSON.stringify(slide_user),
          monthYear,
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

  const quotaData = useMemo(
    () => comboDetail?.quota_data ?? [],
    [comboDetail?.quota_data],
  );
  const cidData = useMemo(
    () => comboDetail?.cids_data ?? [],
    [comboDetail?.cids_data],
  );
  const totalCallOut = comboDetail?.total_call_out || 0;
  const chartHeight = isMobile ? 220 : 350;

  const quotaChartOptions = useMemo((): ApexOptions => {
    const dates = quotaData.map((item: { datemon: string }) => {
      const date = new Date(item.datemon);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const axisFontSize = isMobile ? "10px" : "12px";

    return {
      chart: {
        type: "line",
        toolbar: {
          show: !isMobile,
          tools: {
            download: !isMobile,
            selection: false,
            zoom: !isMobile,
            zoomin: !isMobile,
            zoomout: !isMobile,
            pan: false,
            reset: !isMobile,
          },
        },
        fontFamily: "'Roboto', 'Arial', sans-serif",
      },
      stroke: {
        curve: "smooth",
        width: isMobile ? 1.5 : 2,
      },
      colors: ["#465FFF"],
      grid: {
        padding: {
          left: isMobile ? 4 : 12,
          right: isMobile ? 8 : 16,
        },
      },
      xaxis: {
        categories: dates,
        tickAmount: isMobile
          ? Math.min(6, Math.max(dates.length - 1, 1))
          : undefined,
        title: {
          text: isMobile ? "" : "Thời gian",
          style: { fontSize: axisFontSize },
        },
        labels: {
          rotate: isMobile && dates.length > 4 ? -45 : 0,
          hideOverlappingLabels: true,
          style: { fontSize: axisFontSize },
        },
      },
      yaxis: {
        tickAmount: isMobile ? 4 : 6,
        forceNiceScale: true,
        min: 0,
        title: {
          text: isMobile ? "" : "Gọi ra",
          style: { fontSize: axisFontSize },
        },
        labels: {
          formatter: (val) =>
            isMobile ? formatQuotaAxisValue(val) : val.toLocaleString("vi-VN"),
          style: { fontSize: axisFontSize },
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
          formatter: (val: number) => val.toLocaleString("vi-VN"),
        },
      },
    };
  }, [quotaData, isMobile]);

  const quotaChartSeries = useMemo(
    () => [
      {
        name: "Call Out",
        data: quotaData.map((item: { call_out: number }) => item.call_out),
      },
    ],
    [quotaData],
  );

  const monthYearSelectors = (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <div className="min-w-0">
        <Label>Chọn năm</Label>
        <Select
          placeholder="Chọn năm"
          options={years}
          value={selectedYear}
          onChange={(value) => setSelectedYear(value)}
        />
      </div>
      <div className="min-w-0">
        <Label>Chọn tháng</Label>
        <Select
          placeholder="Chọn tháng"
          options={months}
          value={selectedMonth}
          onChange={(value) => setSelectedMonth(value)}
        />
      </div>
    </div>
  );

  if (isLoadingDetail) {
    return (
      <div className="relative min-w-0">
        {monthYearSelectors}
        <div
          className={`relative ${isMobile ? "min-h-[240px]" : "min-h-[500px]"}`}>
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
            <div className="flex flex-col items-center gap-3 px-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-800 dark:border-t-indigo-400 sm:h-12 sm:w-12" />
              <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                Đang tải dữ liệu biểu đồ...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quotaData || quotaData.length === 0) {
    return (
      <div className="min-w-0">
        {monthYearSelectors}
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Không có dữ liệu biểu đồ cho tháng/năm đã chọn
        </p>
        {cidData?.length > 0 && (
          <div className="mt-2">
            <CidsTable
              data={cidData}
              isLoading={isLoadingDetail}
              compact={isMobile}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      {monthYearSelectors}

      <div
        className={`mb-3 gap-2 ${
          isMobile
            ? "flex flex-col"
            : "flex items-center justify-between"
        }`}>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 sm:text-base">
          Biểu đồ sử dụng (call_out)
        </h4>
        <div className="text-sm">
          <span className="font-semibold text-gray-600 dark:text-gray-400">
            Tổng:{" "}
          </span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {totalCallOut.toLocaleString("vi-VN")}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800 sm:p-4">
        <Chart
          key={isMobile ? "combo-chart-mobile" : "combo-chart-desktop"}
          options={quotaChartOptions}
          series={quotaChartSeries}
          type="line"
          height={chartHeight}
          width="100%"
        />
      </div>

      <div className="mt-2 min-w-0">
        <CidsTable
          data={cidData}
          isLoading={isLoadingDetail}
          compact={isMobile}
        />
      </div>
    </div>
  );
};

export default ComboQuotaChart;
