import { useState, useEffect } from "react";
import { getTimeOnline } from "../../services/sessionLogin";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { SessionData } from "../../services/sessionLogin";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ReusableTable from "../../components/common/ReusableTable";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Pagination from "../../components/pagination/pagination";
import { useSearchParams } from "react-router-dom";

const columns: { key: keyof SessionData; label: string }[] = [
  { key: "username", label: "Tên tài khoản" },
  { key: "duration", label: "Thời gian hoạt động" },
];

type SessionRow = SessionData & { id: string | number };

const SessionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [historySession, setHistorySession] = useState<SessionRow[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("search") || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [searchDate, setSearchDate] = useState<string>(
    searchParams.get("date") || ""
  );
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const [pageSize, setPageSize] = useState<number>(() => {
    const size = searchParams.get("page_size");
    return size && !isNaN(Number(size)) ? Number(size) : 10;
  });
  const [page, setPage] = useState<number>(() => {
    const pageNum = searchParams.get("page");
    return pageNum && !isNaN(Number(pageNum)) ? Number(pageNum) : 1;
  });
  const [totalPages, setTotalPages] = useState<number>(0);
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorData, setErrorData] = useState("");
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    let shouldUpdate = false;

    if (newParams.get("page") !== String(page)) {
      newParams.set("page", String(page));
      shouldUpdate = true;
    }

    if (newParams.get("page_size") !== String(pageSize)) {
      newParams.set("page_size", String(pageSize));
      shouldUpdate = true;
    }

    if (searchQuery && newParams.get("search") !== searchQuery) {
      newParams.set("search", searchQuery);
      shouldUpdate = true;
    } else if (!searchQuery && newParams.has("search")) {
      newParams.delete("search");
      shouldUpdate = true;
    }

    if (searchDate && newParams.get("date") !== searchDate) {
      newParams.set("date", searchDate);
      shouldUpdate = true;
    } else if (!searchDate && newParams.has("date")) {
      newParams.delete("date");
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, page, pageSize, searchQuery, searchDate, setSearchParams]);

  // Gọi API dựa vào searchQuery và dateQuery
  useEffect(() => {
    fetchData(searchQuery, page, pageSize, searchDate);
  }, [page, pageSize, searchQuery, searchDate]);

  const fetchData = async (
    search: string = "",
    currentPage: number,
    size: number,
    date: string = ""
  ) => {
    setError(null);
    setLoading(true);
    try {
      const params: any = {
        search,
        page: currentPage,
        page_size: size,
      };

      if (date) {
        const [year, month, day] = date.split("-");
        if (year && year !== "0") params.year = year;
        if (month && month !== "0") params.month = month;
        if (day && day !== "0") params.day = day;
      }

      const res = await getTimeOnline(params);
      const transformedData: SessionRow[] = res.data.data.map(
        (item, index) => ({
          ...item,
          id: item.username || index,
        })
      );
      setHistorySession(transformedData);
      setTotalPages(res.data.total_pages || 0);
      setErrorData(transformedData.length === 0 ? "Không có dữ liệu" : "");
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleDateInput = (value: string, type: "day" | "month" | "year") => {
    const sanitizedValue = value.replace(/\D/g, "");

    let formattedValue = sanitizedValue;
    if (type === "day") {
      const dayValue = parseInt(sanitizedValue, 10);
      formattedValue =
        dayValue > 0 && dayValue <= 31 ? dayValue.toString() : "";
      setDay(formattedValue);
    } else if (type === "month") {
      const monthValue = parseInt(sanitizedValue, 10);
      formattedValue =
        monthValue > 0 && monthValue <= 12 ? monthValue.toString() : "";
      setMonth(formattedValue);
    } else if (type === "year") {
      formattedValue = sanitizedValue.slice(0, 4);
      setYear(formattedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPage(1);
      setSearchQuery(searchTerm);

      // Tạo ngày tháng cho API nếu có thông tin
      let newDate = "";
      if (year) {
        const fullYear =
          year.length === 2
            ? parseInt(year) < 50
              ? `20${year}`
              : `19${year}`
            : year;
        const paddedMonth = month ? month.padStart(2, "0") : "00";
        const paddedDay = day ? day.padStart(2, "0") : "00";
        newDate = `${fullYear}-${paddedMonth}-${paddedDay}`;
      }

      setSearchDate(newDate);

      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", "1");
      newParams.set("page_size", String(pageSize));
      if (searchTerm) {
        newParams.set("search", searchTerm);
      } else {
        newParams.delete("search");
      }
      if (newDate) {
        newParams.set("date", newDate);
      } else {
        newParams.delete("date");
      }
      setSearchParams(newParams);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    newParams.set("page_size", String(pageSize));
    if (searchTerm) newParams.set("search", searchTerm);
    setSearchParams(newParams);
  };

  const handleLimitChange = (newLimit: number) => {
    setPageSize(newLimit);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", "1");
    newParams.set("page_size", String(newLimit));
    if (searchTerm) newParams.set("search", searchTerm);
    setSearchParams(newParams);
  };

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";
    setSearchTerm(search);
    setSearchQuery(search);
    setSearchDate(date);
  }, [searchParams]);

  // Cập nhật các ô input khi searchDate thay đổi từ URL
  useEffect(() => {
    if (searchDate) {
      const [y, m, d] = searchDate.split("-");
      setDay(d);
      setMonth(m);
      // Hiển thị năm đầy đủ 4 chữ số
      setYear(y);
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [searchDate]);

  const onPaginationChange = (newOffset: number) => {
    const newPage = newOffset + 1; // Convert offset to page number
    handlePageChange(newPage);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Lịch sử online" />
      <div className="space-y-6">
        {error && <div className="text-red-500">{error}</div>}
        <ComponentCard>
          <div className="flex justify-start gap-4 mb-4">
            <div>
              <Label>Tìm kiếm</Label>
              <Input
                placeholder="Tìm theo tên tài khoản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div>
              <div className="flex gap-2">
                <div>
                  <Label>Ngày</Label>
                  <Input
                    type="text"
                    placeholder="Ngày"
                    value={day}
                    onChange={(e) => handleDateInput(e.target.value, "day")}
                    onKeyDown={handleKeyDown}
                    className="w-12"
                  />
                </div>
                <div>
                  <Label>Tháng</Label>
                  <Input
                    type="text"
                    placeholder="Tháng"
                    value={month}
                    onChange={(e) => handleDateInput(e.target.value, "month")}
                    onKeyDown={handleKeyDown}
                    className="w-12"
                  />
                </div>
                <div>
                  <Label>Năm</Label>
                  <Input
                    type="text"
                    placeholder="Năm"
                    value={year}
                    onChange={(e) => handleDateInput(e.target.value, "year")}
                    onKeyDown={handleKeyDown}
                    className="w-16"
                  />
                </div>
              </div>
            </div>
          </div>
          <ReusableTable
            error={errorData}
            role={user.role}
            title="Lịch sử online"
            data={historySession}
            columns={columns}
            isLoading={loading}
          />
          <Pagination
            limit={pageSize}
            offset={page - 1} // Convert 1-based page to 0-based offset
            totalPages={totalPages}
            onPageChange={(_limit, newOffset) => onPaginationChange(newOffset)}
            onLimitChange={handleLimitChange}
          />
        </ComponentCard>
      </div>
    </>
  );
};

export default SessionPage;
