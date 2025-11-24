// import { useEffect, useState } from "react";
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import Input from "../../components/form/input/InputField";
// import Select from "../../components/form/Select";
// import Label from "../../components/form/Label";
// import ComponentCard from "../../components/common/ComponentCard";
// import Button from "../../components/ui/button/Button";
// import Swal from "sweetalert2";
// import PageBreadcrumb from "../../components/common/PageBreadCrumb";
// import { IoIosAdd, IoIosRemove } from "react-icons/io";
// import { useApi } from "../../hooks/useApi";
// import { getProviders } from "../../services/provider";
// import { useSelector } from "react-redux";
// import { RootState } from "../../store";
// import { orderServices } from "../../services/order";
// import { useCurrencyFields } from "../../hooks/useCurrencyField";
// import { getPriceForRange } from "./PriceConfig";
// import { SlideForm } from "./SlideForm";
// import ComboQuotaChart from "./ChartOrder";
// import { configService } from "../../services/config";

// type RouteEntry = {
//   key: string;
//   value: string | number;
// };

// interface OutboundDidFormProps {
//   value: Record<string, number>;
//   meta: Record<string, string>;
//   isDetail?: boolean;
//   isEdit?: boolean;
//   onChange: (value: Record<string, number>) => void;
//   onMetaChange: (meta: Record<string, string>) => void;
// }

// const formatNumberWithCommas = (value: string) => {
//   // Xóa các ký tự không phải số
//   const numericValue = value.replace(/\D/g, "");
//   // Thêm dấu phẩy phân cách hàng nghìn
//   return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// };

// const parseNumberFromFormatted = (value: string) => {
//   return Number(value.replace(/,/g, ""));
// };

// export const OutboundDidForm = ({
//   value,
//   onChange,
//   isDetail,
//   isEdit,
// }: OutboundDidFormProps) => {
//   const { data: dataProviders, isLoading, error } = useApi(getProviders);

//   const [routes, setRoutes] = useState<RouteEntry[]>(
//     Object.keys(value).length > 0
//       ? Object.entries(value).map(([key, val]) => ({ key, value: val }))
//       : []
//   );

//   const routeOptions = isLoading
//     ? [{ label: "Đang tải...", value: "" }]
//     : error
//     ? [{ label: "Lỗi tải dữ liệu", value: "" }]
//     : dataProviders?.map((p: any) => ({
//         label: p.name,
//         value: p.name,
//       })) ?? [];

//   const updateParent = (list: RouteEntry[]) => {
//     const obj = Object.fromEntries(
//       list.map((r) => [r.key, parseNumberFromFormatted(r.value as any)])
//     );
//     onChange(obj);
//   };

//   // Outbound handlers
//   const handleAdd = () => {
//     const newRoutes = [...routes, { key: "", value: "" }];
//     setRoutes(newRoutes);
//   };

//   const handleRemove = (index: number) => {
//     const newRoutes = routes.filter((_, i) => i !== index);
//     setRoutes(newRoutes);
//     updateParent(newRoutes);
//   };

//   const handleChange = (index: number, field: "key" | "value", val: any) => {
//     const newRoutes = [...routes];

//     if (field === "value") {
//       // Chỉ cho phép nhập số, có phẩy
//       const formatted = formatNumberWithCommas(val);
//       newRoutes[index] = { ...newRoutes[index], value: formatted as any };
//     } else {
//       newRoutes[index] = { ...newRoutes[index], key: val };
//     }

//     setRoutes(newRoutes);
//     updateParent(newRoutes);
//   };

//   // Cập nhật thay đổi khi vào mode edit
//   useEffect(() => {
//     setRoutes(
//       Object.keys(value).length > 0
//         ? Object.entries(value).map(([key, val]) => ({
//             key,
//             value: formatNumberWithCommas(val.toString()),
//           }))
//         : []
//     );
//   }, [value]);

//   return (
//     <div>
//       <div className="grid grid-cols-1 gap-8">
//         {/* Outbound DID Section */}
//         <div>
//           {
//             (!isDetail || !isEdit) && (
//               <Label className="!mb-0">Cấu hình Outbound CID</Label>
//             )
//           }
//           <div className="flex flex-col gap-3 mt-3">
//             {routes.length === 0 ? (
//               // Empty state
//               <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                 </svg>
//                 <p className="text-gray-600 font-medium mb-1">Chưa thiết lập Outbound CID</p>
//                 <p className="text-gray-500 text-sm">
//                   {isDetail 
//                     ? "Order này chưa có cấu hình Outbound CID"
//                     : "Nhấn nút bên dưới để thêm tuyến Outbound đầu tiên"
//                   }
//                 </p>
//               </div>
//             ) : (
//               // Routes list
//               routes.map((route, index) => (
//                 <div key={index} className="flex items-center gap-2">
//                   <button
//                     type="button"
//                     onClick={() => handleRemove(index)}
//                     disabled={isDetail}
//                     className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0">
//                     <IoIosRemove size={20} />
//                   </button>

//                   <div className="flex-1 min-w-0">
//                     <Select
//                       options={routeOptions}
//                       value={route.key}
//                       disabledWhite={isDetail}
//                       onChange={(val) => handleChange(index, "key", val)}
//                     />
//                   </div>

//                   <div className="w-36 flex-shrink-0">
//                     <Input
//                       type="text"
//                       value={route.value}
//                       disabledWhite={isDetail}
//                       onChange={(e) =>
//                         handleChange(index, "value", e.target.value)
//                       }
//                       placeholder="0"
//                     />
//                   </div>
//                 </div>
//               ))
//             )}
//             {!isDetail && (
//               <button
//                 type="button"
//                 onClick={handleAdd}
//                 className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mt-2">
//                 <IoIosAdd size={20} />
//                 Thêm tuyến Outbound
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export interface OrderForm {
//   customer_name: string;
//   tax_code: string;
//   contract_code: string;
//   quantity: number;
//   total_users: number;
//   total_minute: number;
//   outbound_did_by_route: Record<any, any>;
//   total_price: number;
//   status?: number;
//   description?: string;
//   slide_users: string[];
//   meta: Record<any, any>;
// }

// const defaultForm: OrderForm = {
//   customer_name: "",
//   tax_code: "",
//   contract_code: "",
//   quantity: 1,
//   total_users: 0,
//   total_minute: 0,
//   total_price: 0,
//   outbound_did_by_route: {},
//   slide_users: [],
//   meta: {},
// };

// export const OrderActionPage = () => {
//   // ===== ROUTING & AUTH =====
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user = useSelector((state: RootState) => state.auth?.user);

//   // ===== DETERMINE PAGE MODE =====
//   const isHavingID = Boolean(id);
//   const isEdit = location.pathname.includes(`/order/edit/${id}`);
//   const isDetail = location.pathname.includes(`/order/detail/${id}`);
//   const isCreate = location.pathname.includes("/order/create");

//   // ===== FORM STATE =====
//   const [form, setForm] = useState<OrderForm>(defaultForm);
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);
//   const [totalPrice, setTotalPrice] = useState(0);
//   const [activeTab, setActiveTab] = useState<'info' | 'slides'>('info'); // Tab state
//   const [slidesLoaded, setSlidesLoaded] = useState(false); // Track if slides have been loaded
//   const [slidesLoading, setSlidesLoading] = useState(false); // Loading state for slides

//   // ===== FETCH ORDER DETAIL =====
//   const { data: dataOrderDetail } =
//     useApi(async () => {
//       if (!isHavingID || !id) return null;
//       return await orderServices.getByID(Number(id));
//     }, [id, isHavingID]);

//   // ===== CURRENCY FIELDS =====
//   const { currencyFields, handleCurrencyChange } = useCurrencyFields<OrderForm>(
//     { quantity: "", total_minute: "", total_users: "", total_price: "" },
//     handleChange
//   );

//   // ===== HANDLERS =====
//   function handleChange<K extends keyof OrderForm>(
//     field: K,
//     value: OrderForm[K]
//   ) {
//     setForm((prev) => ({ ...prev, [field]: value }));
//     // Clear error cho field này khi user thay đổi
//     if (formErrors[field]) {
//       setFormErrors((prev) => {
//         const newErrors = { ...prev };
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//   }

//   // ===== LOAD FORM DATA =====
//   useEffect(() => {
//     const stateData = location.state?.data;

//     if (isHavingID && dataOrderDetail?.data) {
//       const data = dataOrderDetail.data;
//       setForm({
//         ...defaultForm,
//         ...data,
//       });
//       handleCurrencyChange("total_minute", data?.total_minute);
//       handleCurrencyChange("total_users", data?.total_users);
//       handleCurrencyChange("total_price", data?.total_price);
//     } else if (isHavingID && stateData && !dataOrderDetail?.data) {
//       setForm({
//         ...defaultForm,
//         ...stateData,
//       });
//       handleCurrencyChange("total_minute", stateData?.total_minute);
//       handleCurrencyChange("total_users", stateData?.total_users);
//       handleCurrencyChange("total_price", stateData?.total_price);
//     } else if (!isHavingID) {
//       setForm(defaultForm);
//     }
//   }, [isHavingID, dataOrderDetail, location.state]);

//   // Lấy giá của config service
//   const { data: dataConfigOrder} = useApi(() => configService.getConfigByKey("price_order"));

//   // Extract price config từ API
//   const priceConfig = dataConfigOrder?.data?.value || null;

//   // ===== CALCULATE TOTAL PRICE & AUTO SET =====
//   useEffect(() => {
//     // Chỉ tính toán khi đã có config từ API
//     if (!priceConfig) return;

//     const total_cid = Object.values(form.outbound_did_by_route).reduce(
//       (acc, val) => acc + (Number(val) || 0),
//       0
//     );

//     const minutePrice = getPriceForRange(
//       form.total_minute,
//       priceConfig.call_minutes_package || []
//     );
//     const userPrice = getPriceForRange(
//       form.total_users, 
//       priceConfig.user_package || []
//     );
//     const cidPrice = getPriceForRange(
//       total_cid, 
//       priceConfig.prefix_package_phones || []
//     );

//     const calculatedTotal =
//       (form.total_minute * minutePrice +
//         form.total_users * userPrice +
//         total_cid * cidPrice) *
//       form.quantity;

//     setTotalPrice(calculatedTotal);
//   }, [
//     form.quantity,
//     form.total_minute,
//     form.total_users,
//     form.outbound_did_by_route,
//     priceConfig,
//   ]);


//   // ===== AUTO SET TOTAL_PRICE FROM CALCULATED TOTAL =====
//   useEffect(() => {
//     // Tự động set total_price = totalPrice
//     if (totalPrice > 0) {
//       handleChange("total_price", totalPrice);
//       handleCurrencyChange("total_price", totalPrice);
//     }
//   }, [totalPrice]);

//   // ===== LAZY LOAD SLIDES TAB =====
//   useEffect(() => {
//     // Chỉ load khi chuyển sang tab slides và chưa load lần nào
//     if (activeTab === 'slides' && !slidesLoaded) {
//       setSlidesLoading(true);
//       // Simulate loading delay (có thể thay bằng API call thực tế nếu cần)
//       setTimeout(() => {
//         setSlidesLoaded(true);
//         setSlidesLoading(false);
//       }, 500); // 500ms delay
//     }
//   }, [activeTab, slidesLoaded]);

//   function validateForm(): boolean {
//     const errors: Record<string, string> = {};

//     if (!form.customer_name?.trim()) {
//       errors.customer_name = "Tên khách hàng không được để trống";
//     }

//     if (!form.total_minute) {
//       errors.total_minute = "Tổng số phút không được để trống";
//     }

//     if (!form.total_users) {
//       errors.total_users = "Tổng số user không được để trống";
//     }

//     if (
//       !form.outbound_did_by_route ||
//       form.outbound_did_by_route.length === 0
//     ) {
//       errors.outbound_did_by_route = "Lựa chọn 1 nhà cung cấp để đặt số";
//     }

//     // Validate giá
//     const finalPrice = form.total_price || totalPrice;
//     if (finalPrice < totalPrice) {
//       errors.total_price = `Giá không được thấp hơn ${new Intl.NumberFormat(
//         "vi-VN"
//       ).format(totalPrice)}₫`;
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   }

//   // ===== HANDLE SUBMIT =====
//   async function handleSubmit() {
//     try {
//       setLoading(true);

//       if (!validateForm()) {
//         setLoading(false);
//         return;
//       }

//       const submitForm = {
//         ...form,
//         total_price: form.total_price || totalPrice,
//       };

//       if (isHavingID && isEdit) {
//         // Trường hợp status = 1 (triển khai)
//         if (form.status === 1) {
//           const result = await Swal.fire({
//             title: "Xác nhận",
//             text: `Bạn có muốn triển khai order cho ${form.customer_name} không?`,
//             icon: "info",
//             showCancelButton: true,
//             confirmButtonText: "Triển khai",
//             cancelButtonText: "Hủy",
//           });

//           if (!result.isConfirmed) {
//             setLoading(false);
//             return;
//           }
//         }

//         // Trường hợp status = 0 (từ chối) - Redesigned
//         if (form.status === 0) {
//           const { value: reason } = await Swal.fire({
//             title: '<div style="color: #dc2626;">Từ chối Order</div>',
//             html: `
//               <div style="text-align: left; padding: 0 10px;">
//                 <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: 14px;">
//                   Lý do từ chối <span style="color: #dc2626;">*</span>
//                 </label>
                
//                 <textarea 
//                   id="reason" 
//                   placeholder="Vui lòng nhập lý do từ chối order này..."
//                   style="
//                     width: 100%;
//                     min-height: 120px;
//                     padding: 12px;
//                     border: 2px solid #e5e7eb;
//                     border-radius: 8px;
//                     font-size: 14px;
//                     font-family: inherit;
//                     resize: vertical;
//                     transition: border-color 0.2s;
//                   "
//                   maxlength="500"
//                   oninput="
//                     const counter = document.getElementById('char-counter');
//                     const remaining = 500 - this.value.length;
//                     counter.textContent = remaining + ' ký tự còn lại';
//                     counter.style.color = remaining < 50 ? '#dc2626' : '#6b7280';
//                     this.style.borderColor = this.value.length > 0 ? '#10b981' : '#e5e7eb';
//                   "
//                   onfocus="this.style.borderColor = '#3b82f6'; this.style.outline = 'none';"
//                   onblur="this.style.borderColor = this.value.length > 0 ? '#10b981' : '#e5e7eb';"
//                 ></textarea>
                
//                 <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
//                   <p id="char-counter" style="margin: 0; font-size: 12px; color: #6b7280;">500 ký tự còn lại</p>
//                   <p style="margin: 0; font-size: 12px; color: #9ca3af;">Tối thiểu 10 ký tự</p>
//                 </div>
                
//                 <div style="background: #f3f4f6; padding: 10px; margin-top: 16px; border-radius: 6px;">
//                   <p style="margin: 0; font-size: 12px; color: #6b7280;">
//                     💡 <strong>Gợi ý:</strong> Nêu rõ lý do như thiếu thông tin, không đủ điều kiện, hoặc yêu cầu không hợp lệ.
//                   </p>
//                 </div>
//               </div>
//             `,
//             showCancelButton: true,
//             confirmButtonText: '<i class="fa fa-ban"></i> Xác nhận từ chối',
//             cancelButtonText: '<i class="fa fa-arrow-left"></i> Quay lại',
//             confirmButtonColor: '#dc2626',
//             cancelButtonColor: '#6b7280',
//             width: '600px',
//             padding: '2em',
//             customClass: {
//               container: 'swal-high-zindex',
//               popup: 'swal-rejection-popup',
//               confirmButton: 'swal-rejection-confirm',
//               cancelButton: 'swal-rejection-cancel'
//             },
//             didOpen: () => {
//               // Set z-index
//               const swalContainer = document.querySelector('.swal-high-zindex') as HTMLElement;
//               if (swalContainer) {
//                 swalContainer.style.zIndex = '1400';
//               }
              
//               // Custom styling
//               const style = document.createElement('style');
//               style.innerHTML = `
//                 .swal-rejection-popup {
//                   border-radius: 12px !important;
//                   box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
//                 }
//                 .swal-rejection-confirm {
//                   border-radius: 8px !important;
//                   padding: 10px 24px !important;
//                   font-weight: 600 !important;
//                   font-size: 14px !important;
//                   transition: all 0.3s ease !important;
//                 }
//                 .swal-rejection-confirm:hover {
//                   transform: translateY(-2px) !important;
//                   box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4) !important;
//                 }
//                 .swal-rejection-cancel {
//                   border-radius: 8px !important;
//                   padding: 10px 24px !important;
//                   font-weight: 600 !important;
//                   font-size: 14px !important;
//                 }
//               `;
//               document.head.appendChild(style);
              
//               // Focus textarea
//               const textarea = document.getElementById('reason') as HTMLTextAreaElement;
//               if (textarea) {
//                 setTimeout(() => textarea.focus(), 100);
//               }
//             },
//             preConfirm: () => {
//               const textarea = document.getElementById("reason") as HTMLTextAreaElement;
//               const value = textarea.value.trim();
              
//               if (!value) {
//                 Swal.showValidationMessage(
//                   '<i class="fa fa-exclamation-circle"></i> Vui lòng nhập lý do từ chối!'
//                 );
//                 return false;
//               }
              
//               if (value.length < 10) {
//                 Swal.showValidationMessage(
//                   '<i class="fa fa-exclamation-circle"></i> Lý do phải có ít nhất 10 ký tự!'
//                 );
//                 return false;
//               }
              
//               return value;
//             },
//           });

//           if (!reason) {
//             setLoading(false);
//             return;
//           }

//           submitForm.description = reason; // Gán lý do từ chối vào form
//         }

//         // Gọi API update
//         const res = await orderServices.update(Number(id), submitForm as any);
//         if (res.status === 200) {
//           const message =
//             form.status === 3
//               ? "Triển khai order thành công!"
//               : form.status === 0
//               ? "Order đã bị từ chối!"
//               : "Cập nhật order thành công!";
//           Swal.fire("Thành công", message, "success");
//           navigate("/order");
//         }
//       } else {
//         const result = await orderServices.create(submitForm as any);
//         if (result.status === 201) {
//           Swal.fire("Thành công", "Tạo order thành công", "success");
//           navigate("/order");
//         }
//       }
//     } catch (error: any) {
//       console.error("Order action failed:", error);
//       const message =
//         error?.response?.data?.detail || "Đã xảy ra lỗi không xác định";
//       Swal.fire("Lỗi", message, "error");
//     } finally {
//       setLoading(false);
//     }
//   }


//   return (
//     <>
//       <PageBreadcrumb
//         pageTitle={isHavingID ? "Cập nhật thông tin order" : "Order mới"}
//       />

//       <ComponentCard>
//         {/* Tab Navigation - Only show in detail mode with slide users */}
//         {isDetail && form.slide_users?.length > 0 && (
//           <div className="mb-6 border-b border-gray-200">
//             <nav className="flex gap-4">
//               <button
//                 onClick={() => setActiveTab('info')}
//                 className={`
//                   px-4 py-3 font-medium text-sm border-b-2 transition-colors
//                   ${activeTab === 'info' 
//                     ? 'border-indigo-600 text-indigo-600' 
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }
//                 `}>
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 Thông tin Order
//               </button>
              
//               <button
//                 onClick={() => setActiveTab('slides')}
//                 className={`
//                   px-4 py-3 font-medium text-sm border-b-2 transition-colors
//                   ${activeTab === 'slides' 
//                     ? 'border-indigo-600 text-indigo-600' 
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }
//                 `}>
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                 </svg>
//                 Mã trượt & Biểu đồ
//                 <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
//                   {form.slide_users?.length || 0}
//                 </span>
//               </button>
//             </nav>
//           </div>
//         )}

//         {/* Tab Content: Order Info */}
//         {activeTab === 'info' && (
//           <>
//         {/* SECTION 1: Thông tin khách hàng */}
//         <div className="mb-8">
//           <div className="flex items-center gap-2 mb-4 pb-2 border-b-2">
//             <h3 className="text-lg font-bold text-gray-800">Thông tin khách hàng</h3>
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {/* Customer Name */}
//             <div>
//               <Label>Tên khách hàng</Label>
//               <Input
//                 value={form.customer_name}
//                 disabledWhite={isDetail}
//                 onChange={(e) => handleChange("customer_name", e.target.value)}
//                 placeholder="Nhập tên khách hàng"
//               />
//               {formErrors.customer_name && (
//                 <p className="text-red-500 text-sm mt-1">
//                   {formErrors.customer_name}
//                 </p>
//               )}
//             </div>

//             {/* Tax Code */}
//             <div>
//               <Label>Mã số thuế</Label>
//               <Input
//                 value={form.tax_code}
//                 onChange={(e) => handleChange("tax_code", e.target.value)}
//                 placeholder="Nhập mã số thuế"
//                 disabledWhite={isDetail}
//               />
//               {formErrors.tax_code && (
//                 <p className="text-red-500 text-sm mt-1">{formErrors.tax_code}</p>
//               )}
//             </div>

//             {/* Contract Code */}
//             <div>
//               <Label>Mã hợp đồng</Label>
//               <Input
//                 value={form.contract_code}
//                 onChange={(e) => handleChange("contract_code", e.target.value)}
//                 placeholder="Nhập mã hợp đồng"
//                 disabledWhite={isDetail}
//               />
//               {formErrors.contract_code && (
//                 <p className="text-red-500 text-sm mt-1">
//                   {formErrors.contract_code}
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* SECTION 2: Thông tin order */}
//         <div className="mb-8">
//           <div className="flex items-center gap-2 mb-4 pb-2 border-b-2">
//             <h3 className="text-lg font-bold text-gray-800">Thông tin Order</h3>
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             {/* Total Minutes */}
//             <div>
//               <Label>Số phút gọi</Label>
//               <Input
//                 type="text"
//                 value={currencyFields.total_minute}
//                 placeholder="Nhập số phút gọi"
//                 disabledWhite={isDetail}
//                 onChange={(e) => handleCurrencyChange("total_minute", e)}
//               />
//               {formErrors.total_minute && (
//                 <p className="text-red-500 text-sm mt-1">
//                   {formErrors.total_minute}
//                 </p>
//               )}
//             </div>

//             {/* Total Users */}
//             <div>
//               <Label>Số user</Label>
//               <Input
//                 type="text"
//                 value={currencyFields.total_users}
//                 placeholder="Nhập số user"
//                 onChange={(e) => handleCurrencyChange("total_users", e)}
//                 disabledWhite={isDetail}
//               />
//               {formErrors.total_users && (
//                 <p className="text-red-500 text-sm mt-1">
//                   {formErrors.total_users}
//                 </p>
//               )}
//             </div>

  
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
//             <div>
//               <OutboundDidForm
//                 value={form.outbound_did_by_route}
//                 onChange={(updated) =>
//                   handleChange("outbound_did_by_route", updated)
//                 }
//                 isEdit={isEdit}
//                 isDetail={isDetail}
//                 meta={form.meta}
//                 onMetaChange={(updated) => handleChange("meta", updated)}
//               />
//               {formErrors.outbound_did_by_route && (
//                 <p className="text-red-500 text-sm mt-2">
//                   {formErrors.outbound_did_by_route}
//                 </p>
//               )}
//             </div>
//             <div>
//               <Label className="flex gap-2 items-center">
//                 Giá đặt đơn
//                 <span className="text-green-600 text-sm font-medium">
//                   (Tự động tính toán)
//                 </span>
//               </Label>
//               <Input
//                 type="text"
//                 value={currencyFields.total_price}
//                 placeholder="Giá sẽ được tính tự động"
//                 disabled={true}
//                 disabledWhite={true}
//               />
//               <p className="text-gray-500 text-xs mt-1">
//                 💡 Giá được tính tự động dựa trên số phút, số user và số đầu số
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* SECTION 4: Trạng thái (Admin only) */}
//         {user?.role === 1 && isEdit && (
//           <div className="mb-8">
//             <div className={`
//               ${form.status === 1 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' : ''}
//               ${form.status === 3 ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300' : ''}
//               ${form.status === 2 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300' : ''}
//               ${form.status === 0 ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300' : ''}
//               border-2 p-6 shadow-lg
//             `}>
//               <div className="mb-4 ml-1">
//                 <Label className={`
//                   ${form.status === 1 ? 'text-green-900' : ''}
//                   ${form.status === 3 ? 'text-blue-900' : ''}
//                   ${form.status === 2 ? 'text-yellow-900' : ''}
//                   ${form.status === 0 ? 'text-red-900' : ''}
//                   text-xl font-bold flex items-center gap-2
//                 `}>
//                   Trạng thái Order
//                 </Label>
//                 <p className={`
//                   ${form.status === 1 ? 'text-green-600' : ''}
//                   ${form.status === 2 ? 'text-yellow-600' : ''}
//                   ${form.status === 3 ? 'text-blue-600' : ''}
//                   ${form.status === 0 ? 'text-red-600' : ''}
//                   text-sm mt-1
//                 `}>
//                   {form.status === 1 
//                     ? "Order đã được triển khai thành công"
//                     : form.status === 2
//                     ? "Order đang chờ xác nhận"
//                     : form.status === 3
//                     ? "Order đang chờ triển khai"
//                     : "Order đã bị từ chối"
//                   }
//                 </p>
//               </div>
              
//               {form.status === 1 ? (
//                 <div className="p-4 bg-green-50 border-2 border-green-300">
//                   <p className="text-green-700 font-semibold text-lg flex items-center gap-2">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                     Triển khai
//                   </p>
//                 </div>
//               ) : (
//                 <Select
//                   value={String(form.status)}
//                   disabledWhite={isDetail}
//                   options={[
//                     { label: "Chờ xác nhận", value: "2" },
//                     { label: "Chờ triển khai", value: "3" },
//                     { label: "Từ chối", value: "0" },
//                   ]}
//                   onChange={(value) => handleChange("status", Number(value))}
//                 />
//               )}
//             </div>
//           </div>
//         )}
//         {/* Actions */}
//           <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
//             <div className="flex justify-end gap-3">
//               <Button
//                 variant="outline"
//                 onClick={() => navigate("/order")}
//                 className="px-6 py-2"
//                 disabled={loading}>
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                 </svg>
//                 Trở lại
//               </Button>

//               {!isDetail && (
//                 <Button
//                   onClick={handleSubmit}
//                   disabled={loading}
//                   className="bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-50 px-6 py-2">
//                   {loading ? (
//                     <>
//                       <svg className="animate-spin h-5 w-5 mr-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Đang lưu...
//                     </>
//                   ) : (
//                     <>
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                       </svg>
//                       {isCreate ? "Tạo Order" : isEdit ? "Cập nhật" : "Lưu"}
//                     </>
//                   )}
//                 </Button>
//               )}
//             </div>
//           </div>
//           </>
//         )}

//         {/* Tab Content: Slides & Chart */}
//         {activeTab === 'slides' && (
//           <>
//             <>
//               {/* SECTION: Slide Users */}
//               {form.slide_users?.length > 0 && (
//                 <div className="mb-8">
//                   <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
//                     <h3 className="text-lg font-bold text-gray-800">Danh sách mã trượt</h3>
//                   </div>
//                   <SlideForm
//                     value={form.slide_users as string[]}
//                     onChange={(updated) => handleChange("slide_users", updated)}
//                   />
//                 </div>
//               )}
//               {/* Combo Quota Chart */}
//               {form.slide_users?.length > 0 && (
//                 <div className="mb-8">
//                   <ComboQuotaChart slide_user={form?.slide_users} />
//                 </div>
//               )}
//             </>
//           </>
//         )}
      
//       </ComponentCard>
//     </>
//   );
// };
