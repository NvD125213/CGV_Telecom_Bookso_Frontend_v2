import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import LogDetailModal from "./LogDetailModal";
import ComboQuotaChart from "../Order/ChartOrder";
import { Modal } from "../../components/ui/modal";
import { useIsMobile } from "../../hooks/useScreenSize";

const SlideUsersView = ({ items }: { items: string[] }) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-2 text-sm italic text-gray-400">Không có mã trượt</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
      {items.map((slideItem, index) => (
        <div
          key={index}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-300">
          <span className="truncate">{slideItem}</span>
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

const ReadOnlyField = ({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string | number;
  placeholder?: string;
}) => (
  <div className="min-w-0">
    <Label>{label}</Label>
    <Input
      type="text"
      value={String(value ?? "")}
      disabledWhite
      placeholder={placeholder}
    />
  </div>
);

const ReadOnlyFieldWithMeta = ({
  label,
  value,
  meta,
  compact,
  placeholder,
}: {
  label: string;
  value: string;
  meta: string;
  compact: boolean;
  placeholder?: string;
}) => {
  if (compact) {
    return (
      <div className="min-w-0">
        <Label>{label}</Label>
        <Input
          type="text"
          value={value}
          disabledWhite
          placeholder={placeholder}
          className="rounded-lg"
        />
        <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-400">
          {meta}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="text"
          value={value}
          disabledWhite
          className="rounded-lg pr-28"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex max-w-[45%] items-center rounded-lg rounded-l-none border border-l border-gray-200 bg-white/70 px-2 text-xs font-medium text-blue-700 backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800/80 dark:text-blue-400 sm:max-w-none sm:px-3 sm:text-sm">
          <span className="truncate">{meta}</span>
        </div>
      </div>
    </div>
  );
};

const LogDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const item: LogItem = location.state;
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const isMobile = useIsMobile(768);

  const PageWrapper = ({
    children,
    className = "",
  }: {
    children: ReactNode;
    className?: string;
  }) =>
    isMobile ? (
      <div className={`px-1 pb-6 ${className}`}>{children}</div>
    ) : (
      <ComponentCard className={className}>{children}</ComponentCard>
    );

  if (!item) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Không tìm thấy dữ liệu log
        </p>
        <button
          type="button"
          onClick={() => navigate("/logs")}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600">
          Quay lại danh sách
        </button>
      </div>
    );
  }

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

  const detailContent = (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <ReadOnlyField
          label="Tên khách hàng"
          value={item.customer_name}
          placeholder="Chưa có tên khách hàng"
        />
        <ReadOnlyField
          label="Mã hợp đồng"
          value={item.contract_code}
          placeholder="Chưa có mã hợp đồng"
        />
        <ReadOnlyField
          label="Mã số thuế"
          value={item.tax_code}
          placeholder="Chưa có mã số thuế"
        />

        {item.type === "Order" && (
          <ReadOnlyField
            label="Giá phút gọi/phút"
            value={item.price_per_minute}
            placeholder="Chưa có giá phút gọi/phút"
          />
        )}

        {(item.type === "Gói chính" || item.type === "Gói phụ") && (
          <ReadOnlyField
            label="Loại gói"
            value={item.name_plan}
            placeholder="Chưa có loại gói"
          />
        )}

        <ReadOnlyField
          label="Tên sale"
          value={item.name_sale}
          placeholder="Chưa có tên sale"
        />
        <ReadOnlyField
          label="Tổng CID"
          value={formatNumber(item.total_cid)}
          placeholder="Chưa có tổng CID"
        />

        <ReadOnlyFieldWithMeta
          label="Tổng phút gọi"
          value={formatNumber(Number(item.total_minutes))}
          meta={`${formatCurrency(item.price_per_minute)} / phút`}
          compact={isMobile}
          placeholder="Chưa có tổng phút gọi"
        />

        <ReadOnlyFieldWithMeta
          label="Tổng người dùng"
          value={formatNumber(Number(item.total_users))}
          meta={`${formatCurrency(item.price_per_user)} / người`}
          compact={isMobile}
          placeholder="Chưa có tổng người dùng"
        />
      </div>

      <div className="mt-6 md:mt-8">
        <div
          className={`mb-4 flex pb-2 ${
            isMobile ? "flex-col gap-3" : "items-center justify-end"
          }`}>
          <Button
            variant="primary"
            size="sm"
            className={`flex items-center justify-center gap-2 rounded-lg ${
              isMobile ? "w-full" : ""
            }`}
            onClick={() => setIsPhoneModalOpen(true)}>
            <svg
              className="h-4 w-4"
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
            Xem chi tiết số & bảng giá
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        className={isMobile ? "m-2 max-w-full" : "m-4 max-w-[900px]"}>
        <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-2xl bg-white p-4 dark:bg-gray-900 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white sm:text-xl">
              Chi tiết số điện thoại & Bảng giá
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gói: {item.name_plan}
            </p>
          </div>
          <div className="min-w-0 overflow-x-auto">
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
          </div>
          <div className="mt-4 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700 sm:mt-6">
            <Button
              variant="outline"
              className={`rounded-lg ${isMobile ? "w-full" : ""}`}
              onClick={() => setIsPhoneModalOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      <div className="mt-6 md:mt-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b-2 border-orange-200 pb-2">
          <svg
            className="h-5 w-5 shrink-0 text-orange-500"
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
          <h3 className="text-base font-bold text-gray-800 dark:text-white sm:text-lg">
            Danh sách mã trượt ({item.slide_users?.length || 0})
          </h3>
        </div>
        <SlideUsersView items={item.slide_users || []} />
      </div>

      {item.slide_users?.length > 0 && (
        <div className="mb-6 mt-6 min-w-0 overflow-x-auto md:mb-8 md:mt-8">
          <ComboQuotaChart slide_user={item.slide_users} />
        </div>
      )}

      <div
        className={`mt-6 flex gap-3 md:mt-8 ${
          isMobile ? "flex-col-reverse" : "justify-end"
        }`}>
        <Button
          variant="outline"
          className="rounded-lg"
          onClick={() => navigate("/logs")}>
          Trở lại
        </Button>
      </div>
    </>
  );

  return (
    <>
      {!isMobile && (
        <PageBreadcrumb pageTitle="Chi tiết lịch sử đơn đặt" />
      )}

      <PageWrapper>
        {isMobile && (
          <h1 className="mb-3 px-1 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Chi tiết lịch sử đơn đặt
          </h1>
        )}
        {detailContent}
      </PageWrapper>
    </>
  );
};

export default LogDetail;
