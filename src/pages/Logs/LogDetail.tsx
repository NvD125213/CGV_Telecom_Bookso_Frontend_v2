import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import LogDetailModal from "./LogDetailModal";
import ComboQuotaChart from "../Order/ChartOrder";
import { Modal } from "../../components/ui/modal";

// Component hiển thị slide users dạng chỉ xem
const SlideUsersView = ({ items }: { items: string[] }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-gray-400 italic text-sm py-2">Không có mã trượt</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
      {items.map((item, index) => (
        <div
          key={index}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium shadow-sm">
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
};

interface LogItem {
  id: number;
  name_plan: string;
  name_sale: string;
  customer_name: string;
  contract_code: string;
  tax_code: string;
  total_cid: number;
  total_minutes: number | string;
  phone_numbers: string[];
  total_users: number;
  price_per_user: number;
  price_per_minute: number;
  price_phone_numbers: string | Record<string, any>;
  total_price: number | string;
  is_subscription: boolean;
  is_subscription_items: boolean;
  is_order: boolean;
  id_group: number;
  is_payment: boolean;
  quota_used: number;
  slide_users: string[];
  released_at: string | null;
  created_at: string;
  children?: LogItem[];
  type?: string;
}

const LogDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const item: LogItem = location.state;
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Redirect if no data
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-gray-500 dark:text-gray-400">
          Không tìm thấy dữ liệu log
        </p>
        <button
          onClick={() => navigate("/logs")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Format functions
  const formatCurrency = (value: number | string | undefined) => {
    if (value == null) return "0 ₫";
    if (typeof value === "string") return value;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatNumber = (value: number | string | undefined) => {
    if (value == null) return "0";
    if (typeof value === "string") return value;
    return value.toLocaleString("vi-VN");
  };

  return (
    <>
      <PageBreadcrumb pageTitle={"Chi tiết lịch sử đơn đặt"} />

      <ComponentCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Tên khách hàng</Label>
            <Input
              value={item.customer_name}
              disabledWhite={true}
              placeholder="Chưa có tên khách hàng"
            />
          </div>

          <div>
            <Label>Mã hợp đồng</Label>
            <Input
              type="text"
              value={item.contract_code}
              disabledWhite={true}
              placeholder="Chưa có mã hợp đồng"
            />
          </div>
          <div>
            <Label>Mã số thuế</Label>
            <Input
              type="text"
              value={item.tax_code}
              disabledWhite={true}
              placeholder="Chưa có mã số thuế"
            />
          </div>

          {item.type === "Order" && (
            <div>
              <Label>Giá phút gọi/phút</Label>
              <Input
                type="text"
                value={item.price_per_minute}
                disabledWhite={true}
                placeholder="Chưa có giá phút gọi/phút"
              />
            </div>
          )}
          {(item.type === "Gói chính" || item.type === "Gói phụ") && (
            <div>
              <Label>Loại gói</Label>
              <Input
                type="text"
                value={item.name_plan}
                disabledWhite={true}
                placeholder="Chưa có loại gói"
              />
            </div>
          )}
          <div>
            <Label>Tên sale</Label>
            <Input
              type="text"
              value={item.name_sale}
              disabledWhite={true}
              placeholder="Chưa có tên sale"
            />
          </div>
          <div>
            <Label>Tổng CID</Label>
            <Input
              type="text"
              value={formatNumber(item.total_cid)}
              disabledWhite={true}
              placeholder="Chưa có tổng CID"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Tổng phút gọi
            </Label>

            <div className="relative">
              <Input
                type="text"
                value={formatNumber(Number(item.total_minutes))}
                disabledWhite
                className="pr-28 rounded-lg"
                placeholder="Chưa có tổng phút gọi"
              />

              <div
                className="absolute border border-gray-300 inset-y-0 right-0 flex items-center px-3 rounded-lg rounded-l-none 
                    bg-white/70 backdrop-blur-sm border-l border-gray-200 text-sm font-medium 
                    text-blue-700">
                {formatCurrency(item.price_per_minute)} / phút
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              Tổng người dùng
            </Label>

            <div className="relative">
              <Input
                type="text"
                value={formatNumber(Number(item.total_users))}
                disabledWhite
                className="pr-28 rounded-lg"
                placeholder="Chưa có tổng người dùng"
              />

              <div
                className="absolute border border-gray-300 inset-y-0 right-0 flex items-center px-3 rounded-lg rounded-l-none 
                    bg-white/70 backdrop-blur-sm border-l border-gray-200 text-sm font-medium 
                    text-blue-700">
                {formatCurrency(item.price_per_user)} / người
              </div>
            </div>
          </div>
        </div>

        {/* --- Phone Numbers & Price Details Section --- */}
        <div className="mt-8">
          <div className="flex items-center justify-end mb-4 pb-2">
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-2 rounded-lg"
              onClick={() => setIsPhoneModalOpen(true)}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Xem chi tiết
            </Button>
          </div>
        </div>

        {/* Modal for Phone Numbers & Price Details */}
        <Modal
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          className="max-w-[900px] m-4">
          <div className="relative w-full p-6 bg-white rounded-2xl dark:bg-gray-900 max-h-[85vh] overflow-y-auto">
            <div className="mb-6">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
                Chi tiết số điện thoại & Bảng giá
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gói: {item.name_plan}
              </p>
            </div>
            <LogDetailModal
              log={{
                id: item.id,
                name_plan: item.name_plan,
                phone_numbers: item.phone_numbers || [],
                price_phone_numbers:
                  typeof item.price_phone_numbers === "string"
                    ? item.price_phone_numbers
                    : JSON.stringify(item.price_phone_numbers || {}),
              }}
            />
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => setIsPhoneModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
        {/* --- Slide Users Section --- */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
            <svg
              className="w-5 h-5 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Danh sách mã trượt ({item.slide_users?.length || 0})
            </h3>
          </div>
          <SlideUsersView items={item.slide_users || []} />
        </div>
        {item.slide_users?.length > 0 && (
          <div className="mb-8">
            <ComboQuotaChart slide_user={item?.slide_users} />
          </div>
        )}

        {/* --- Submit --- */}
        <div className="flex justify-end gap-3 mt-8 ">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => navigate("/logs")}>
            Trở lại
          </Button>
        </div>
      </ComponentCard>
    </>
  );
};

export default LogDetail;
