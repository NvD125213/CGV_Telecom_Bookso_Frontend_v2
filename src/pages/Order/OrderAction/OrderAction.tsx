import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ComponentCard from "../../../components/common/ComponentCard";
import Swal from "sweetalert2";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useApi } from "../../../hooks/useApi";
import { orderServices } from "../../../services/order";
import { useCurrencyFields } from "../../../hooks/useCurrencyField";
import { getPriceForRange } from "../PriceConfig";
import { configService } from "../../../services/config";
// import { OrderForm } from "../OrderAction";
import { OrderInfo } from "./OrderInfo";
import { OrderChart } from "./OrderChart";
import { OrderForm } from "./OrderInfo";

const defaultForm: OrderForm = {
  customer_name: "",
  tax_code: "",
  contract_code: "",
  quantity: 1,
  total_users: 0,
  total_minute: 0,
  total_price: 0,
  outbound_did_by_route: {},
  slide_users: [],
  meta: {},
};

export const OrderActionPage = () => {
  // ===== ROUTING & AUTH =====
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // ===== DETERMINE PAGE MODE =====
  const isHavingID = Boolean(id);
  const isEdit = location.pathname.includes(`/order/edit/${id}`);
  const isDetail = location.pathname.includes(`/order/detail/${id}`);
  const isCreate = location.pathname.includes("/order/create");

  // ===== FORM STATE =====
  const [form, setForm] = useState<OrderForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'chart'>('info');

  // ===== FETCH ORDER DETAIL =====
  const { data: dataOrderDetail } =
    useApi(async () => {
      if (!isHavingID || !id) return null;
      return await orderServices.getByID(Number(id));
    }, [id, isHavingID]);

  // ===== CURRENCY FIELDS =====
  const { currencyFields, handleCurrencyChange } = useCurrencyFields<OrderForm>(
    { quantity: "", total_minute: "", total_users: "", total_price: "" },
    handleChange
  );

  // ===== HANDLERS =====
  function handleChange<K extends keyof OrderForm>(
    field: K,
    value: OrderForm[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error cho field này khi user thay đổi
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  // ===== LOAD FORM DATA =====
  useEffect(() => {
    const stateData = location.state?.data;

    if (isHavingID && dataOrderDetail?.data) {
      const data = dataOrderDetail.data;
      setForm({
        ...defaultForm,
        ...data,
      });
      handleCurrencyChange("total_minute", data?.total_minute);
      handleCurrencyChange("total_users", data?.total_users);
      handleCurrencyChange("total_price", data?.total_price);
    } else if (isHavingID && stateData && !dataOrderDetail?.data) {
      setForm({
        ...defaultForm,
        ...stateData,
      });
      handleCurrencyChange("total_minute", stateData?.total_minute);
      handleCurrencyChange("total_users", stateData?.total_users);
      handleCurrencyChange("total_price", stateData?.total_price);
    } else if (!isHavingID) {
      setForm(defaultForm);
    }
  }, [isHavingID, dataOrderDetail, location.state]);

  // Lấy giá của config service
  const { data: dataConfigOrder} = useApi(() => configService.getConfigByKey("price_order"));

  // Extract price config từ API
  const priceConfig = dataConfigOrder?.data?.value || null;

  // ===== CALCULATE TOTAL PRICE & AUTO SET =====
  useEffect(() => {
    // Chỉ tính toán khi đã có config từ API
    if (!priceConfig) return;

    const total_cid = Object.values(form.outbound_did_by_route).reduce(
      (acc, val) => acc + (Number(val) || 0),
      0
    );

    const minutePrice = getPriceForRange(
      form.total_minute,
      priceConfig.call_minutes_package || []
    );
    const userPrice = getPriceForRange(
      form.total_users, 
      priceConfig.user_package || []
    );
    const cidPrice = getPriceForRange(
      total_cid, 
      priceConfig.prefix_package_phones || []
    );

    const calculatedTotal =
      (form.total_minute * minutePrice +
        form.total_users * userPrice +
        total_cid * cidPrice) *
      form.quantity;

    setTotalPrice(calculatedTotal);
  }, [
    form.quantity,
    form.total_minute,
    form.total_users,
    form.outbound_did_by_route,
    priceConfig,
  ]);


  // ===== AUTO SET TOTAL_PRICE FROM CALCULATED TOTAL =====
  useEffect(() => {
    // Tự động set total_price = totalPrice
    if (totalPrice > 0) {
      handleChange("total_price", totalPrice);
      handleCurrencyChange("total_price", totalPrice);
    }
  }, [totalPrice]);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!form.customer_name?.trim()) {
      errors.customer_name = "Tên khách hàng không được để trống";
    }

    if (!form.total_minute) {
      errors.total_minute = "Tổng số phút không được để trống";
    }

    if (!form.total_users) {
      errors.total_users = "Tổng số user không được để trống";
    }

    if (
      !form.outbound_did_by_route ||
      form.outbound_did_by_route.length === 0
    ) {
      errors.outbound_did_by_route = "Lựa chọn 1 nhà cung cấp để đặt số";
    }

    // Validate giá
    const finalPrice = form.total_price || totalPrice;
    if (finalPrice < totalPrice) {
      errors.total_price = `Giá không được thấp hơn ${new Intl.NumberFormat(
        "vi-VN"
      ).format(totalPrice)}₫`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ===== HANDLE SUBMIT =====
  async function handleSubmit() {
    try {
      setLoading(true);

      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const submitForm = {
        ...form,
        total_price: form.total_price || totalPrice,
      };

      if (isHavingID && isEdit) {
        // Trường hợp status = 1 (triển khai)
        if (form.status === 1) {
          const result = await Swal.fire({
            title: "Xác nhận",
            text: `Bạn có muốn triển khai order cho ${form.customer_name} không?`,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Triển khai",
            cancelButtonText: "Hủy",
          });

          if (!result.isConfirmed) {
            setLoading(false);
            return;
          }
        }

        // Trường hợp status = 0 (từ chối) - Redesigned
        if (form.status === 0) {
          const { value: reason } = await Swal.fire({
            title: '<div style="color: #dc2626;">Từ chối Order</div>',
            html: `
              <div style="text-align: left; padding: 0 10px;">
                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: 14px;">
                  Lý do từ chối <span style="color: #dc2626;">*</span>
                </label>
                
                <textarea 
                  id="reason" 
                  placeholder="Vui lòng nhập lý do từ chối order này..."
                  style="
                    width: 100%;
                    min-height: 120px;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    resize: vertical;
                    transition: border-color 0.2s;
                  "
                  maxlength="500"
                  oninput="
                    const counter = document.getElementById('char-counter');
                    const remaining = 500 - this.value.length;
                    counter.textContent = remaining + ' ký tự còn lại';
                    counter.style.color = remaining < 50 ? '#dc2626' : '#6b7280';
                    this.style.borderColor = this.value.length > 0 ? '#10b981' : '#e5e7eb';
                  "
                  onfocus="this.style.borderColor = '#3b82f6'; this.style.outline = 'none';"
                  onblur="this.style.borderColor = this.value.length > 0 ? '#10b981' : '#e5e7eb';"
                ></textarea>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                  <p id="char-counter" style="margin: 0; font-size: 12px; color: #6b7280;">500 ký tự còn lại</p>
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">Tối thiểu 10 ký tự</p>
                </div>
                
                <div style="background: #f3f4f6; padding: 10px; margin-top: 16px; border-radius: 6px;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    💡 <strong>Gợi ý:</strong> Nêu rõ lý do như thiếu thông tin, không đủ điều kiện, hoặc yêu cầu không hợp lệ.
                  </p>
                </div>
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="fa fa-ban"></i> Xác nhận từ chối',
            cancelButtonText: '<i class="fa fa-arrow-left"></i> Quay lại',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            width: '600px',
            padding: '2em',
            customClass: {
              container: 'swal-high-zindex',
              popup: 'swal-rejection-popup',
              confirmButton: 'swal-rejection-confirm',
              cancelButton: 'swal-rejection-cancel'
            },
            didOpen: () => {
              // Set z-index
              const swalContainer = document.querySelector('.swal-high-zindex') as HTMLElement;
              if (swalContainer) {
                swalContainer.style.zIndex = '1400';
              }
              
              // Custom styling
              const style = document.createElement('style');
              style.innerHTML = `
                .swal-rejection-popup {
                  border-radius: 12px !important;
                  box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
                }
                .swal-rejection-confirm {
                  border-radius: 8px !important;
                  padding: 10px 24px !important;
                  font-weight: 600 !important;
                  font-size: 14px !important;
                  transition: all 0.3s ease !important;
                }
                .swal-rejection-confirm:hover {
                  transform: translateY(-2px) !important;
                  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4) !important;
                }
                .swal-rejection-cancel {
                  border-radius: 8px !important;
                  padding: 10px 24px !important;
                  font-weight: 600 !important;
                  font-size: 14px !important;
                }
              `;
              document.head.appendChild(style);
              
              // Focus textarea
              const textarea = document.getElementById('reason') as HTMLTextAreaElement;
              if (textarea) {
                setTimeout(() => textarea.focus(), 100);
              }
            },
            preConfirm: () => {
              const textarea = document.getElementById("reason") as HTMLTextAreaElement;
              const value = textarea.value.trim();
              
              if (!value) {
                Swal.showValidationMessage(
                  '<i class="fa fa-exclamation-circle"></i> Vui lòng nhập lý do từ chối!'
                );
                return false;
              }
              
              if (value.length < 10) {
                Swal.showValidationMessage(
                  '<i class="fa fa-exclamation-circle"></i> Lý do phải có ít nhất 10 ký tự!'
                );
                return false;
              }
              
              return value;
            },
          });

          if (!reason) {
            setLoading(false);
            return;
          }

          submitForm.description = reason; // Gán lý do từ chối vào form
        }

        // Gọi API update
        const res = await orderServices.update(Number(id), submitForm as any);
        if (res.status === 200) {
          const message =
            form.status === 3
              ? "Triển khai order thành công!"
              : form.status === 0
              ? "Order đã bị từ chối!"
              : "Cập nhật order thành công!";
          Swal.fire("Thành công", message, "success");
          navigate("/order");
        }
      } else {
        const result = await orderServices.create(submitForm as any);
        if (result.status === 201) {
          Swal.fire("Thành công", "Tạo order thành công", "success");
          navigate("/order");
        }
      }
    } catch (error: any) {
      console.error("Order action failed:", error);
      const message =
        error?.response?.data?.detail || "Đã xảy ra lỗi không xác định";
      Swal.fire("Lỗi", message, "error");
    } finally {
      setLoading(false);
    }
  }


  return (
    <>
      <PageBreadcrumb
        pageTitle={isHavingID ? "Cập nhật thông tin order" : "Order mới"}
      />

      <ComponentCard>
        {/* Tab Navigation - Only show in detail mode with slide users */}
        {isDetail && form.slide_users?.length > 0 && (
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`
                  px-4 py-3 font-medium text-sm border-b-2 transition-colors
                  ${activeTab === 'info' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Thông tin Order
              </button>
              
              <button
                onClick={() => setActiveTab('chart')}
                className={`
                  px-4 py-3 font-medium text-sm border-b-2 transition-colors
                  ${activeTab === 'chart' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Mã trượt & Biểu đồ
                <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                  {form.slide_users?.length || 0}
                </span>
              </button>
            </nav>
          </div>
        )}

        {/* Tab Content: Order Info */}
        {activeTab === 'info' && (
          <OrderInfo
            form={form}
            formErrors={formErrors}
            currencyFields={currencyFields}
            handleChange={handleChange}
            handleCurrencyChange={handleCurrencyChange as any}
            handleSubmit={handleSubmit}
            loading={loading}
            isDetail={isDetail}
            isEdit={isEdit}
            isCreate={isCreate}
          />
        )}

        {/* Tab Content: Chart */}
        {activeTab === 'chart' && (
          <OrderChart
            form={form}
            handleChange={handleChange as any}
          />
        )}
      
      </ComponentCard>
    </>
  );
};
