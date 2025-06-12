import React, { useState, useEffect } from "react";
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
import SwitchablePicker from "../../components/common/SwitchablePicker";

type PickerType = "time" | "date" | "datetime" | "month" | "year";

const columns: { key: keyof SessionData; label: string }[] = [
  { key: "username", label: "Tên tài khoản" },
  { key: "duration", label: "Thời gian hoạt động" },
];

type SessionRow = SessionData & { id: string | number };

const SessionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Initialize searchDate with current yyyy-mm or URL param
  const currentDate = new Date();
  const defaultDate = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
  const [historySession, setHistorySession] = useState<SessionRow[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("search") || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [searchDate, setSearchDate] = useState<string>(
    searchParams.get("date") || defaultDate
  );

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
  const [pickerType, setPickerType] = useState<PickerType>("date");

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
        page: currentPage,
        page_size: size,
      };

      if (search && search.trim()) {
        params.search = search.trim();
      }

      if (date) {
        const parts = date.split("-");
        if (parts.length === 1) {
          // yyyy
          params.year = parts[0];
        } else if (parts.length === 2) {
          // yyyy-mm
          params.year = parts[0];
          params.month = parts[1];
        } else if (parts.length === 3) {
          // yyyy-mm-dd
          params.year = parts[0];
          params.month = parts[1];
          params.day = parts[2];
        }
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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPage(1);
      const trimmedSearch = searchTerm.trim();
      setSearchQuery(trimmedSearch);

      const newParams = new URLSearchParams();
      newParams.set("page", "1");
      newParams.set("page_size", String(pageSize));

      if (trimmedSearch) {
        newParams.set("search", trimmedSearch);
      }

      if (searchDate && searchDate !== "0000-00-00") {
        newParams.set("date", searchDate);
      }

      setSearchParams(newParams);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (!date) {
      setSearchDate("");
      return;
    }

    let isoDate = "";
    if (pickerType === "year") {
      isoDate = date.getFullYear().toString();
    } else if (pickerType === "month") {
      isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    } else {
      isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    }

    setSearchDate(isoDate);
    setPage(1);

    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    newParams.set("page_size", String(pageSize));

    if (searchQuery) {
      newParams.set("search", searchQuery);
    }

    if (isoDate) {
      newParams.set("date", isoDate);
    }

    setSearchParams(newParams);
  };

  const handlePickerTypeChange = (type: PickerType) => {
    if (type === "time" || type === "datetime") return; // Chỉ cho phép date, month, year
    setPickerType(type);
    // Reset date when changing picker type
    setSearchDate("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("date");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    newParams.set("page_size", String(pageSize));
    if (searchQuery) newParams.set("search", searchQuery);
    if (searchDate) newParams.set("date", searchDate);
    setSearchParams(newParams);
  };

  const handleLimitChange = (newLimit: number) => {
    setPageSize(newLimit);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", "1");
    newParams.set("page_size", String(newLimit));
    if (searchQuery) newParams.set("search", searchQuery);
    if (searchDate) newParams.set("date", searchDate);
    setSearchParams(newParams);
  };

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || defaultDate;
    setSearchTerm(search);
    setSearchQuery(search);
    setSearchDate(date);
  }, [searchParams]);

  const onPaginationChange = (newOffset: number) => {
    const newPage = newOffset + 1;
    handlePageChange(newPage);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Lịch sử online" />
      <div className="space-y-6">
        {error && <div className="text-red-500">{error}</div>}
        <ComponentCard>
          <div className="flex justify-between items-center gap-4 mb-4 py-4 ">
            <div>
              <Label>Tìm kiếm</Label>
              <Input
                placeholder="Tìm theo tên tài khoản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <div>
              <Label>Ngày hoạt động</Label>
              <SwitchablePicker
                value={searchDate ? new Date(searchDate) : null}
                onChange={handleDateChange}
                onTypeChange={handlePickerTypeChange}
              />
            </div>
          </div>
          <ReusableTable
            error={errorData}
            role={user.role}
            title="Lịch sử online"
            data={historySession}
            disabledReset={true}
            columns={columns}
            isLoading={loading}
          />
          <Pagination
            limit={pageSize}
            offset={page - 1}
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
