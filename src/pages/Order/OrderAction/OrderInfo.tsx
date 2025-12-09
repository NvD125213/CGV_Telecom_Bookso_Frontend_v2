import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";
import { OutboundDidForm } from "./OutbounCID";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

export interface OrderForm {
  customer_name: string;
  tax_code: string;
  contract_code: string;
  quantity: number;
  total_users: number;
  total_minute: number;
  price_minute_over: number;
  outbound_did_by_route: Record<any, any>;
  total_price: number;
  status?: number;
  description?: string;
  slide_users: string[];
  meta: Record<any, any>;
}

const defaultForm: OrderForm = {
  customer_name: "",
  tax_code: "",
  contract_code: "",
  quantity: 1,
  total_users: 0,
  total_minute: 0,
  price_minute_over: 0,
  total_price: 0,
  outbound_did_by_route: {},
  slide_users: [],
  meta: {},
};

interface OrderInfoProps {
  form: OrderForm;
  formErrors: Record<string, string>;
  currencyFields: any;
  handleChange: <K extends keyof OrderForm>(
    field: K,
    value: OrderForm[K]
  ) => void;
  handleCurrencyChange: <K extends keyof OrderForm>(
    field: K,
    value: OrderForm[K] | string | number | React.ChangeEvent<HTMLInputElement>
  ) => void;
  handleSubmit: () => void;
  loading: boolean;
  isDetail: boolean;
  isEdit: boolean;
  isCreate: boolean;
  minPricePerMinute?: number;
}

export const OrderInfo = ({
  form = defaultForm,
  formErrors,
  currencyFields,
  handleChange,
  handleCurrencyChange,
  handleSubmit,
  loading,
  isDetail,
  isEdit,
  isCreate,
  minPricePerMinute = 0,
}: OrderInfoProps) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth?.user);

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value || 0) + "₫";
  };

  // Calculate minute price - use user input or fallback to config price
  const effectivePricePerMinute =
    form.price_minute_over > 0 ? form.price_minute_over : minPricePerMinute;
  const minutePrice = (form.total_minute || 0) * effectivePricePerMinute;

  return (
    <>
      {/* SECTION 1: Thông tin khách hàng */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2">
          <h3 className="text-lg font-bold text-gray-800">
            Thông tin khách hàng
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Name */}
          <div>
            <Label>Tên khách hàng</Label>
            <Input
              value={form.customer_name}
              disabledWhite={isDetail}
              onChange={(e) => handleChange("customer_name", e.target.value)}
              placeholder="Nhập tên khách hàng"
            />
            {formErrors.customer_name && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.customer_name}
              </p>
            )}
          </div>

          {/* Tax Code */}
          <div>
            <Label>Mã số thuế</Label>
            <Input
              value={form.tax_code}
              onChange={(e) => handleChange("tax_code", e.target.value)}
              placeholder="Nhập mã số thuế"
              disabledWhite={isDetail}
            />
            {formErrors.tax_code && (
              <p className="text-red-500 text-sm mt-1">{formErrors.tax_code}</p>
            )}
          </div>

          {/* Contract Code */}
          <div>
            <Label>Mã hợp đồng</Label>
            <Input
              value={form.contract_code}
              onChange={(e) => handleChange("contract_code", e.target.value)}
              placeholder="Nhập mã hợp đồng"
              disabledWhite={isDetail}
            />
            {formErrors.contract_code && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.contract_code}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Thông tin order */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2">
          <h3 className="text-lg font-bold text-gray-800">Thông tin Order</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total Minutes & Price per Minute */}
          <div>
            <Label>Số phút gọi</Label>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              {/* Left: Số phút */}
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={currencyFields.total_minute}
                  placeholder="Số phút"
                  disabledWhite={isDetail}
                  onChange={(e) => handleCurrencyChange("total_minute", e)}
                  className="border-0 focus:ring-0 rounded-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  phút
                </span>
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Right: Giá/phút */}
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={currencyFields.price_minute_over}
                  placeholder="Giá/phút"
                  disabledWhite={isDetail}
                  onChange={(e) => handleCurrencyChange("price_minute_over", e)}
                  className="border-0 focus:ring-0 rounded-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  đ/phút
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <p className="text-gray-500 text-xs">
                💡 Tổng tiền phút gọi:{" "}
                <span className="font-medium text-green-600">
                  {formatCurrency(minutePrice)}
                </span>
              </p>
              {minPricePerMinute > 0 && (
                <p className="text-gray-500 text-xs">
                  📌 Giá tối thiểu/phút:{" "}
                  <span className="font-medium text-blue-600">
                    {formatCurrency(minPricePerMinute)}
                  </span>
                </p>
              )}
            </div>
            {(formErrors.total_minute || formErrors.price_minute_over) && (
              <p className="text-red-500 text-sm mt-2">
                {formErrors.total_minute || formErrors.price_minute_over}
              </p>
            )}
          </div>

          {/* Total Users */}
          <div>
            <Label>Số user</Label>
            <Input
              type="text"
              value={currencyFields.total_users}
              placeholder="Nhập số user"
              onChange={(e) => handleCurrencyChange("total_users", e)}
              disabledWhite={isDetail}
            />
            {formErrors.total_users && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.total_users}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <OutboundDidForm
              value={form.outbound_did_by_route}
              onChange={(updated) =>
                handleChange("outbound_did_by_route", updated)
              }
              isEdit={isEdit}
              isDetail={isDetail}
              meta={form.meta}
              onMetaChange={(updated) => handleChange("meta", updated)}
            />
            {formErrors.outbound_did_by_route && (
              <p className="text-red-500 text-sm mt-2">
                {formErrors.outbound_did_by_route}
              </p>
            )}
          </div>
          <div>
            <Label className="flex gap-2 items-center">
              Giá đặt đơn
              <span className="text-green-600 text-sm font-medium">
                (Tự động tính toán)
              </span>
            </Label>
            <Input
              type="text"
              value={currencyFields.total_price}
              placeholder="Giá sẽ được tính tự động"
              disabled={true}
              disabledWhite={true}
            />
            <p className="text-gray-500 text-xs mt-1">
              💡 Giá được tính tự động dựa trên số phút, số user và số đầu số
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: Trạng thái (Admin only) */}
      {user?.role === 1 && isEdit && (
        <div className="mb-8">
          <div
            className={`
            ${
              form.status === 1
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                : ""
            }
            ${
              form.status === 3
                ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300"
                : ""
            }
            ${
              form.status === 2
                ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300"
                : ""
            }
            ${
              form.status === 0
                ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-300"
                : ""
            }
            border-2 p-6 shadow-lg
          `}>
            <div className="mb-4 ml-1">
              <Label
                className={`
                ${form.status === 1 ? "text-green-900" : ""}
                ${form.status === 3 ? "text-blue-900" : ""}
                ${form.status === 2 ? "text-yellow-900" : ""}
                ${form.status === 0 ? "text-red-900" : ""}
                text-xl font-bold flex items-center gap-2
              `}>
                Trạng thái Order
              </Label>
              <p
                className={`
                ${form.status === 1 ? "text-green-600" : ""}
                ${form.status === 2 ? "text-yellow-600" : ""}
                ${form.status === 3 ? "text-blue-600" : ""}
                ${form.status === 0 ? "text-red-600" : ""}
                text-sm mt-1
              `}>
                {form.status === 1
                  ? "Order đã được triển khai thành công"
                  : form.status === 2
                  ? "Order đang chờ xác nhận"
                  : form.status === 3
                  ? "Order đang chờ triển khai"
                  : "Order đã bị từ chối"}
              </p>
            </div>

            {form.status === 1 ? (
              <div className="p-4 bg-green-50 border-2 border-green-300">
                <p className="text-green-700 font-semibold text-lg flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Triển khai
                </p>
              </div>
            ) : (
              <Select
                value={String(form.status)}
                disabledWhite={isDetail}
                options={[
                  { label: "Chờ xác nhận", value: "2" },
                  { label: "Chờ triển khai", value: "3" },
                  { label: "Từ chối", value: "0" },
                ]}
                onChange={(value) => handleChange("status", Number(value))}
              />
            )}
          </div>
        </div>
      )}
      {/* Actions */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/order")}
            className="px-6 py-2"
            disabled={loading}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 inline"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Trở lại
          </Button>

          {!isDetail && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-50 px-6 py-2">
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 inline"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {isCreate ? "Tạo Order" : isEdit ? "Cập nhật" : "Lưu"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
