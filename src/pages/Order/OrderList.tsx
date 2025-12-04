import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { orderServices } from "../../services/order";
import { configService } from "../../services/config";
import { getPriceForRange } from "./PriceConfig";
import { useQuerySync } from "../../hooks/useQueryAsync";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/pagination/pagination";
import { formatCurrency } from "../../helper/formatCurrency";
import { IoIosAdd } from "react-icons/io";
import ActionMenu from "./ActionMenu";
import { CheckCircleOutline } from "@mui/icons-material";
import { IoCloseCircleOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import ModalRenew from "./ModalRenew";

interface OrderData {
  id: number;
  customer_name: string;
  tax_code: string;
  contract_code: string;
  username: string;
  slide_users: Record<any, any>;
  root_plan_id: number | null;
  auto_renew: boolean;
  expired: Date;
  status: number;
  total_minutes: number;
  total_user: number;
  total_price?: number;
  items?: any[];
}

// Component để hiển thị status với màu sắc
const StatusBadge = ({ status }: { status: number }) => {
  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 1:
        return {
          text: "active",
          classname:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 w-[80px]",
        };
      case 2:
        return {
          text: "pending",
          classname:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400 w-[80px]",
        };
      case 3:
        return {
          text: "deploying",
          classname:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400 w-[80px]",
        };
      case 0:
        return {
          text: "expired",
          classname:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500 w-[80px]",
        };
      default:
        return {
          text: "Không xác định",
          classname:
            "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-500 w-[80px]",
        };
    }
  };

  const statusDisplay = getStatusDisplay(status);
  return <span className={statusDisplay.classname}>{statusDisplay.text}</span>;
};

// Component table tùy chỉnh để hiển thị status với màu sắc
const CustomOrderTable = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onDetail,
  onConfirm,
  onRenew,
  role,
  hideId,
}: {
  data: any[];
  isLoading: boolean;
  onEdit?: (item: any) => void;
  onDetail?: (item: any) => void;
  onDelete?: (item: any) => void;
  onConfirm?: (item: any) => void;
  onRenew?: (item: any) => void;
  role?: number;
  hideId?: boolean;
}) => {
  const columns = [
    { key: "customer_name", label: "Tên khách hàng" },
    {
      key: "is_payment",
      label: "Thanh toán",
    },
    { key: "total_users", label: "Tổng user" },
    { key: "total_minute", label: "Phút gọi" },
    { key: "user_name", label: "Sale" },
    { key: "total_price", label: "Tổng giá" },
    { key: "status", label: "Trạng thái" },
  ];

  const hasActionColumn = onEdit || onDelete;
  const totalColumnCount = columns.length + 1 + (hasActionColumn ? 1 : 0); // +1 for ID column, +1 for actions
  const isManyColumns = totalColumnCount > 8;
  const formatNumber = (num: number) =>
    num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <div className="max-h-[800px] overflow-y-auto dark:bg-black min-w-[900px]">
            <Table className="dark:text-white">
              {/* Table Header */}
              <TableHeader>
                <TableRow>
                  {hideId == false && (
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-base font-semibold text-gray-500 dark:text-gray-300 text-start">
                      ID
                    </TableCell>
                  )}

                  {columns.map((col, idx) => (
                    <TableCell
                      key={`${col.key}-${idx}`}
                      isHeader
                      className={`px-5 ${
                        isManyColumns ? "text-[13px]" : "text-sm"
                      } dark:text-gray-300 py-3 text-base font-semibold text-gray-500 ${
                        col.key === "customer_name"
                          ? "!text-start"
                          : "!text-center"
                      } `}>
                      {col.label}
                    </TableCell>
                  ))}
                  {hasActionColumn && (
                    <TableCell
                      isHeader
                      className={`px-5 ${
                        isManyColumns ? "text-[13px]" : "text-sm"
                      } dark:text-gray-300 py-3 text-base font-semibold text-gray-500 text-start`}>
                      Hành động
                    </TableCell>
                  )}
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {hideId == false && (
                        <TableCell className="px-5 py-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </TableCell>
                      )}

                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={`px-5 py-3 text-sm text-gray-500 dark:text-gray-300 ${
                            col.key === "customer_name"
                              ? "!text-start"
                              : "!text-center"
                          } ${isManyColumns ? "text-[13px]" : "text-sm"}`}>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                      {hasActionColumn && (
                        <TableCell
                          className={`flex gap-2 px-5 py-3 ${
                            isManyColumns ? "text-[13px]" : "text-sm"
                          }`}>
                          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={totalColumnCount}
                      className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <svg
                          className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-lg font-medium mb-2">
                          Không có dữ liệu
                        </p>
                        <p className="text-sm">
                          Không tìm thấy order nào phù hợp với bộ lọc hiện tại
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      {hideId == false && (
                        <TableCell
                          className={`px-5 dark:text-gray-300 py-3 ${
                            isManyColumns ? "text-[13px]" : "text-sm"
                          }`}>
                          {item.id}
                        </TableCell>
                      )}
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={`px-5 py-3 text-sm text-gray-500 dark:text-gray-300 ${
                            col.key === "customer_name"
                              ? "!text-start"
                              : "!text-center"
                          } ${isManyColumns ? "text-[13px]" : "text-sm"} `}>
                          {col.key === "status" ? (
                            <StatusBadge status={item.status} />
                          ) : col.key === "total_price" ? (
                            formatCurrency(item[col.key])
                          ) : col.key === "is_payment" ? (
                            item.is_payment ? (
                              <CheckCircleOutline className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <IoCloseCircleOutline className="w-5 h-5 text-red-500 mx-auto" />
                            )
                          ) : col.key === "total_minute" ? (
                            formatNumber(item.total_minute)
                          ) : (
                            item[col.key] || "-"
                          )}
                        </TableCell>
                      ))}

                      {hasActionColumn && (
                        <TableCell
                          className={`px-5 py-3 min-w-[120px] ${
                            isManyColumns ? "text-[13px]" : "text-sm"
                          } sticky right-0 bg-white dark:bg-black z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]`}>
                          <ActionMenu
                            item={item}
                            role={role}
                            status={item.status}
                            onEdit={onEdit}
                            onDetail={onDetail}
                            onDelete={onDelete}
                            onConfirm={onConfirm}
                            onRenew={onRenew}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface OrderQuery {
  page: number;
  size: number;
  order_by: string;
  order_dir: string;
  user_name?: string;
  status?: string;
  created_from?: string;
  created_to?: string;
}

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  const [expiredFrom, setExpiredFrom] = useState<string>("");
  const [expiredTo, setExpiredTo] = useState<string>("");

  const [query, setQuery] = useQuerySync<OrderQuery>({
    page: 1,
    size: 10,
    order_by: "created_at",
    order_dir: "desc",
  });

  const [pagination, setPagination] = useState({
    page: query.page,
    size: query.size,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== query.user_name) {
        setQuery({ ...query, user_name: searchInput, page: 1 });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, query, setQuery]);

  // Tạo một query string ổn định để so sánh
  const queryKey = useMemo(() => {
    return `${query.page}_${query.size}_${query.order_by}_${query.order_dir}_${
      query.user_name || ""
    }_${query.status || ""}_${query.created_from || ""}_${
      query.created_to || ""
    }`;
  }, [
    query.page,
    query.size,
    query.order_by,
    query.order_dir,
    query.user_name,
    query.status,
    query.created_from,
    query.created_to,
  ]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await orderServices.get(query);
      setOrders(result.data?.items || []);
      setPagination(result.data?.meta);
    } catch (err: any) {
      console.error("Fetch orders failed:", err.response?.data);
      setError(err.response?.data?.detail || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const prevQueryKeyRef = useRef<string>("");

  useEffect(() => {
    // Chỉ fetch khi query key thay đổi
    if (prevQueryKeyRef.current === queryKey) {
      return;
    }

    fetchOrders();
    prevQueryKeyRef.current = queryKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // Xử lý dữ liệu để hiển thị đúng format
  const processedData =
    orders?.map((item: OrderData) => {
      // Tính total_price

      return {
        ...item,
        customer_name: item.customer_name,
        tax_code: item.tax_code,
        contract_code: item.contract_code,
        total_price: item.total_price,
        total_user: item.total_user,
        status: item.status,
        total_minutes: item.total_minutes,
      };
    }) || [];

  // Hàm xác nhận thanh toán
  const handleConfirmPayment = async (item: any) => {
    if (item.is_payment == true) {
      Swal.fire({
        icon: "info",
        title: "Đã thanh toán",
        text: "Order này đã được thanh toán trước đó !",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Xác nhận thanh toán",
      text: `Bạn có chắc chắn muốn xác nhận thanh toán order cho khách hàng ${item.customer_name} không?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await orderServices.update(item.id, { is_payment: true });

      if (res?.status === 200) {
        Swal.fire("Đã xác nhận!", "Thanh toán thành công.", "success");
        fetchOrders();
      } else {
        Swal.fire("Lỗi", "Không thể xác nhận thanh toán.", "error");
      }
    } catch (error: any) {
      Swal.fire("Lỗi", error?.response?.data?.detail || "Xảy ra lỗi", "error");
    }
  };

  // Xử lý xóa dữ liệu
  const handleDelete = async (data: any) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc chắn muốn xóa order của khách hàng "${data.customer_name}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const res = await orderServices.delete(data.id); // gọi API xóa
        if (res.status === 200) {
          Swal.fire(
            "Đã xóa!",
            `Order cho khách hàng "${data.customer_name}" đã được xóa !`,
            "success"
          );
          fetchOrders();
        } else {
          Swal.fire("Lỗi", "Không thể xóa gói này.", "error");
        }
      } catch (error: any) {
        Swal.fire(
          "Lỗi",
          error?.response?.data?.detail || "Xảy ra lỗi",
          "error"
        );
      }
    }
  };

  // Xử lý modal renew
  const [openModalRenew, setOpenModalRenew] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  const handleRenewWithOldInfo = async (data: any) => {
    const dataSubmit = {
      customer_name: data.customer_name,
      tax_code: data.tax_code,
      contract_code: data.contract_code,
      total_price: data.total_price,
      quantity: 1,
      total_users: data.total_users,
      total_minute: data.total_minute,
      outbound_did_by_route: data.outbound_did_by_route,
    };
    const result = await Swal.fire({
      title: "Xác nhận",
      text: "Bạn có chắc chắn muốn xác nhận gia hạn order này với các thông tin cũ không không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      const res = await orderServices.reNewOrder(data.id, dataSubmit);
      if (res.status === 200) {
        Swal.fire("Đã gia hạn!", "Gia hạn thành công.", "success");
        fetchOrders();
      } else {
        Swal.fire("Lỗi", "Không thể gia hạn gói này.", "error");
      }
    }
  };

  const handleRenewWithNewInfo = async (newData: {
    users: number;
    minutes: number;
    price: number;
    outboundDidByRoute: Record<string, number>;
    meta: Record<string, string>;
  }) => {
    if (!currentItem) return;

    const dataSubmit = {
      customer_name: currentItem.customer_name,
      tax_code: currentItem.tax_code,
      contract_code: currentItem.contract_code,
      total_price: newData.price,
      quantity: 1,
      total_users: newData.users,
      total_minute: newData.minutes,
      outbound_did_by_route: newData.outboundDidByRoute,
      meta: newData.meta,
    };

    const result = await Swal.fire({
      title: "Xác nhận",
      text: "Bạn có chắc chắn muốn xác nhận gia hạn order này với các thông tin mới không không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      width: "500px",
    });

    if (result.isConfirmed) {
      try {
        const res = await orderServices.reNewOrder(currentItem.id, dataSubmit);
        if (res.status === 200) {
          Swal.fire(
            "Đã gia hạn!",
            "Gia hạn với thông tin mới thành công.",
            "success"
          );
          setOpenModalRenew(false);
          fetchOrders();
        } else {
          Swal.fire("Lỗi", "Không thể gia hạn order này.", "error");
        }
      } catch (error: any) {
        Swal.fire(
          "Lỗi",
          error?.response?.data?.detail || "Xảy ra lỗi khi gia hạn",
          "error"
        );
      }
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Danh sách order số" />
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate("/order/create")}
          className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
          <IoIosAdd size={24} />
          Thêm
        </button>
      </div>
      <ComponentCard>
        <div className="max-w-7xl mx-auto">
          {/* --- Bộ lọc query --- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 p-4">
            <div className="w-full">
              <Label>Tìm kiếm</Label>
              <Input
                type="text"
                placeholder="Tìm theo tên sale..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md"
              />
            </div>
            {/* Trạng thái */}
            <div className="w-full">
              <Label>Trạng thái</Label>
              <Select
                options={[
                  { label: "Tất cả", value: "" },
                  { label: "Hoạt động", value: "1" },
                  { label: "Pending", value: "2" },
                  { label: "Hết hạn", value: "0" },
                ]}
                onChange={(value) => setQuery({ ...query, status: value })}
                placeholder="Trạng thái"
              />
            </div>
            <div className="w-full">
              <Label>Thứ tự</Label>
              <Select
                options={[
                  { label: "Tăng dần", value: "asc" },
                  { label: "Giảm dần", value: "desc" },
                ]}
                onChange={(value) => setQuery({ ...query, order_dir: value })}
                placeholder="Thứ tự"
              />
            </div>

            <div className="w-full">
              <Label>Sắp xếp theo</Label>
              <Select
                options={[
                  { label: "Ngày tạo", value: "created_at" },
                  { label: "Ngày cập nhật", value: "updated_at" },
                  { label: "Tên khách hàng", value: "customer_name" },
                  { label: "Mã số thuế", value: "tax_code" },
                  { label: "Mã hợp đồng", value: "contract_code" },
                  { label: "Trạng thái", value: "status" },
                  { label: "Ngày hết hạn", value: "expired" },
                ]}
                value={query.order_by}
                onChange={(value) => setQuery({ ...query, order_by: value })}
                placeholder="Chọn cách sắp xếp"
              />
            </div>
          </div>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          <>
            <CustomOrderTable
              data={processedData}
              isLoading={loading}
              role={user.role}
              hideId={true}
              onEdit={(item) => {
                navigate(`/order/edit/${item.id}`, { state: { data: item } });
              }}
              onDetail={(item) => navigate(`/order/detail/${item.id}`)}
              onDelete={(item) => handleDelete(item)}
              onConfirm={(item) => handleConfirmPayment(item)}
              onRenew={(item) => {
                setCurrentItem(item);
                setOpenModalRenew(true);
              }}
            />
            <div className="mt-6">
              <Pagination
                limit={query.size}
                offset={query.page - 1}
                totalPages={pagination.pages || 1}
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
            </div>{" "}
          </>
        </div>
      </ComponentCard>
      <ModalRenew
        open={openModalRenew}
        onClose={() => setOpenModalRenew(false)}
        currentData={{
          users: currentItem?.total_users || 0,
          minutes: currentItem?.total_minute || 0,
          price: currentItem?.total_price || 0,
          outboundDidByRoute: currentItem?.outbound_did_by_route || {},
        }}
        onRenewWithOldInfo={() => handleRenewWithOldInfo(currentItem)}
        onRenewWithNewInfo={handleRenewWithNewInfo}
      />
    </>
  );
};

export default OrderList;
