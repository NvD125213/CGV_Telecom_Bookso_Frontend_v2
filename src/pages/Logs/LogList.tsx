import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useCallback, useEffect, useRef, useState } from "react";
import { logPackageService } from "../../services/log";
import ReusableTable from "../../components/common/ReusableTable";
import { useQuerySync } from "../../hooks/useQueryAsync";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Pagination from "../../components/pagination/pagination";
import { MdErrorOutline } from "react-icons/md";
import { debounce } from "lodash";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

interface Logs {
  id: number;
  name_plan: string;
  name_sale: string;
  customer_name: string;
  contract_code: string;
  tax_code: string;
  total_cid: number;
  total_minutes: number;
  phone_numbers: string[];
  total_users: number;
  price_per_user: number;
  price_per_minute: number;
  price_phone_numbers: string;
  total_price: number;
  is_subscription_items: boolean;
  is_subscription: boolean;
  is_order: boolean;
  created_at?: string;
}

interface LogQuery {
  page: number;
  size: number;
  order_by?: string;
  order_dir?: string;
  customer_name?: string;
  contract_code?: string;
  tax_code?: string;
  name_sale?: string;
  q?: string;
  name_plan?: string;
  phone?: string;
  is_subscription?: boolean;
  is_subscription_items?: boolean;
  is_order?: boolean;
  type?: string; // chỉ dùng FE
  created_from?: string; // ISO 8601
  created_to?: string; // ISO 8601
}

const LogList = () => {
  const [logs, setLogs] = useState<Logs[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorData, setErrorData] = useState("");
  const user = useSelector((state: RootState) => state.auth.user);

  const [query, setQuery] = useQuerySync<LogQuery>({
    page: 1,
    size: 10,
  });

  const [search, setSearch] = useState({
    q: "",
    customer_name: "",
    contract_code: "",
    tax_code: "",
    name_sale: "",
    name_plan: "",
    phone: "",
  });

  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  // 1. fetchLogs: KHÔNG debounce
  const fetchLogs = useCallback(async (filters: LogQuery) => {
    try {
      setLoading(true);
      const { type, ...filter } = filters;

      if (type === "subscription") filter.is_subscription = true;
      else if (type === "subscription_item")
        filter.is_subscription_items = true;
      else if (type === "order") filter.is_order = true;

      const res = await logPackageService.get(filter);
      const data: Logs[] = res.data?.items || [];

      setTotal(res.data?.meta.total || 1);
      setPages(res.data?.meta.pages || 1);
      setLogs(
        data.map((item) => ({
          ...item,
          type: item.is_subscription
            ? "Gói chính"
            : item.is_subscription_items
            ? "Gói phụ"
            : item.is_order
            ? "Order"
            : "Không xác định",
          price_phone_numbers: JSON.stringify(item.price_phone_numbers),
        }))
      );
    } catch (error: any) {
      console.error("Lỗi khi lấy log:", error);
      setErrorData(
        error.response?.data?.message || "Không thể tải dữ liệu log"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect: debounce chỉ khi search thay đổi
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const debounced = debounce(() => {
      setQuery((prev) => ({
        ...prev,
        ...search,
        page: 1,
      }));
    }, 500);
    debounced();
    return () => debounced.cancel();
  }, [search]);

  // Effect: fetch API mỗi khi query thay đổi (KHÔNG debounce)
  useEffect(() => {
    fetchLogs(query);
  }, [query, fetchLogs]);

  const handleChangeType = (value: string) => {
    // Không bị debounce vì không đi qua search
    setQuery({ ...query, type: value, page: 1 });
  };

  const handleInputChange = (key: keyof LogQuery, value: string) => {
    setQuery({ ...query, [key]: value, page: 1 });
  };

  const logTypeOptions = [
    { label: "Tất cả", value: "" },
    { label: "Gói chính", value: "subscription" },
    { label: "Gói phụ", value: "subscription_item" },
    { label: "Order", value: "order" },
  ];

  // ==== Các cột mặc định ====
  const baseColumns: { key: keyof Logs | "type"; label: string }[] = [
    { key: "name_plan", label: "Tên gói" },
    { key: "name_sale", label: "Sale" },
    { key: "customer_name", label: "Khách hàng" },
    { key: "contract_code", label: "Mã hợp đồng" },
    { key: "tax_code", label: "Mã số thuế" },
    { key: "total_cid", label: "Tổng CID" },
    { key: "total_minutes", label: "Tổng phút" },
    { key: "total_users", label: "Tổng người dùng" },
    { key: "total_price", label: "Tổng tiền" },
    { key: "type", label: "Loại" },
  ];

  // Mở modal và gọi dữ liệu
  const [selectedLog, setSelectedLog] = useState<Logs | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (log: Logs) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLog(null);
    setIsModalOpen(false);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Danh sách log" />
      <ComponentCard>
        <div className="mb-4 grid gap-4 grid-cols-2">
          <div>
            <Label>Tìm kiếm</Label>
            <Input
              placeholder="Tìm theo tên KH, hợp đồng, MST, sale, tên gói,..."
              value={search.q || ""}
              onChange={(e) => setSearch({ ...search, q: e.target.value })}
            />
          </div>
          <div>
            <Label>Chọn gói</Label>
            <Input
              placeholder="Tìm theo tên gói, gói phụ hoặc order"
              value={search.name_plan || ""}
              onChange={(e) =>
                setSearch({ ...search, name_plan: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Bộ lọc theo ngày */}
          <div>
            <Label>Từ ngày</Label>
            <Input
              type="datetime-local"
              value={query.created_from || ""}
              onChange={(e) =>
                handleInputChange(
                  "created_from",
                  new Date(e.target.value).toISOString()
                )
              }
            />
          </div>
          <div>
            <Label>Đến ngày</Label>
            <Input
              type="datetime-local"
              value={query.created_to || ""}
              onChange={(e) =>
                handleInputChange(
                  "created_to",
                  new Date(e.target.value).toISOString()
                )
              }
            />
          </div>
        </div>
        {/* Bộ lọc tìm kiếm */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Tên khách hàng</Label>
            <Input
              placeholder="Tìm kiếm theo tên khách hàng"
              value={search.customer_name}
              onChange={(e) =>
                setSearch({ ...search, customer_name: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Mã hợp đồng</Label>
            <Input
              placeholder="Tìm kiếm theo mã hợp đồng"
              value={search.contract_code || ""}
              onChange={(e) =>
                setSearch({ ...search, contract_code: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Mã số thuế</Label>
            <Input
              placeholder="Tìm kiếm theo mã số thuế"
              value={search.tax_code || ""}
              onChange={(e) =>
                setSearch({ ...search, tax_code: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Nhân viên bán</Label>
            <Input
              placeholder="Tìm kiếm theo nhân viên bán"
              value={query.name_sale || ""}
              onChange={(e) => handleInputChange("name_sale", e.target.value)}
            />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <Input
              placeholder="Tìm kiếm theo số điện thoại"
              value={search.phone}
              onChange={(e) => setSearch({ ...search, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Loại logs</Label>
            <Select
              options={logTypeOptions}
              value={query.type || ""}
              onChange={handleChangeType}
              className="w-64"
            />
          </div>

          <div>
            <Label>Thứ tự</Label>
            <Select
              options={[
                { label: "Tăng dần", value: "asc" },
                { label: "Giảm dần", value: "desc" },
              ]}
              value={query.order_dir}
              onChange={(value) => handleInputChange("order_dir", value)}
              className="w-64"
            />
          </div>
          <div>
            <Label>Sắp xếp theo</Label>
            <Select
              options={[
                { label: "Tên gói", value: "name_plan" },
                { label: "Mã hợp đồng", value: "contract_code" },
                { label: "Mã số thuế", value: "tax_code" },
                { label: "Tổng giá", value: "total_price" },
                { label: "Ngày tạo", value: "created_at" },
                { label: "Ngày cập nhật", value: "updated_at" },
              ]}
              value={query.order_by}
              onChange={(value) => handleInputChange("order_by", value)}
              className="w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : errorData ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MdErrorOutline size={48} className="mb-3" />
            <p className="text-lg font-medium">{errorData}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium">Không có dữ liệu</p>
            <p className="text-sm text-gray-400">
              Hãy thử thay đổi bộ lọc hoặc tìm kiếm khác.
            </p>
          </div>
        ) : (
          <ReusableTable
            showId={false}
            error={errorData}
            role={user.role}
            disabledReset={true}
            title="Danh sách log gói cước"
            data={logs}
            columns={baseColumns}
            disabled={true}
            onDetail={(record) => openModal(record)}
            isLoading={loading}
          />
        )}
        <div className="mt-6">
          <Pagination
            limit={query.size}
            offset={query.page - 1}
            totalPages={pages || 1}
            onPageChange={(limit, offset) => {
              setQuery({
                ...query,
                size: limit,
                page: offset + 1,
              });
            }}
            onLimitChange={(limit) => {
              setQuery({
                ...query,
                size: limit,
                page: 1,
              });
            }}
          />
        </div>
      </ComponentCard>

      <Dialog open={isModalOpen} onClose={closeModal} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: "#f5f7fa", pb: 1.5 }}>
          <div className="flex justify-between items-center">
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#1f2937" }}>
              Chi tiết log gói:{" "}
              <Typography
                component="span"
                sx={{ color: "#2563eb", fontWeight: "bold" }}>
                {selectedLog?.name_plan}
              </Typography>
            </Typography>
            <IconButton onClick={closeModal} sx={{ color: "#6b7280" }}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            backgroundColor: "#fafafa",
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#d1d5db",
              borderRadius: "4px",
            },
          }}>
          {selectedLog ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ==== BẢNG PRICE_PHONE_NUMBERS ==== */}
              <div>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    borderLeft: "4px solid #2563eb",
                    pl: 1.5,
                    color: "#111827",
                  }}>
                  Chi tiết giá theo đầu số
                </Typography>

                {selectedLog.price_phone_numbers ? (
                  <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{
                      borderRadius: 2,
                      overflow: "hidden",
                      maxHeight: 350,
                      overflowY: "auto",
                      "&::-webkit-scrollbar": { width: "6px" },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#cbd5e1",
                        borderRadius: "4px",
                      },
                    }}>
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ backgroundColor: "#2563eb" }}>
                        <TableRow>
                          <TableCell
                            sx={{ color: "black", fontWeight: "bold" }}>
                            Đầu số
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ color: "black", fontWeight: "bold" }}>
                            Phí cài đặt
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ color: "black", fontWeight: "bold" }}>
                            Phí duy trì
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(
                          JSON.parse(selectedLog.price_phone_numbers)
                        ).map(([provider, fees]: [string, any], index) => (
                          <TableRow
                            key={provider}
                            sx={{
                              backgroundColor:
                                index % 2 === 0 ? "#f9fafb" : "white",
                            }}>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {provider}
                            </TableCell>
                            <TableCell align="right">
                              {fees?.installation_fee
                                ? `${fees.installation_fee.toLocaleString(
                                    "vi-VN"
                                  )} đ`
                                : "-"}
                            </TableCell>
                            <TableCell align="right">
                              {fees?.maintenance_fee
                                ? `${fees.maintenance_fee.toLocaleString(
                                    "vi-VN"
                                  )} đ`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    Không có dữ liệu đầu số
                  </Typography>
                )}
              </div>

              {/* ==== BẢNG DANH SÁCH SỐ ĐIỆN THOẠI ==== */}
              <div>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    borderLeft: "4px solid #059669",
                    pl: 1.5,
                    color: "#111827",
                  }}>
                  Danh sách số điện thoại
                </Typography>

                {selectedLog.phone_numbers &&
                selectedLog.phone_numbers.length > 0 ? (
                  <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{
                      borderRadius: 2,
                      overflow: "hidden",
                      maxHeight: 350,
                      overflowY: "auto",
                      "&::-webkit-scrollbar": { width: "6px" },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#cbd5e1",
                        borderRadius: "4px",
                      },
                    }}>
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ backgroundColor: "#059669" }}>
                        <TableRow>
                          <TableCell
                            sx={{ color: "black", fontWeight: "bold" }}>
                            STT
                          </TableCell>
                          <TableCell
                            sx={{ color: "black", fontWeight: "bold" }}>
                            Số điện thoại
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedLog.phone_numbers.map((phone, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              backgroundColor:
                                index % 2 === 0 ? "#f9fafb" : "white",
                            }}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{phone}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    Không có số điện thoại nào
                  </Typography>
                )}
              </div>
            </div>
          ) : (
            <Typography color="text.secondary">
              Không có dữ liệu chi tiết để hiển thị.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LogList;
