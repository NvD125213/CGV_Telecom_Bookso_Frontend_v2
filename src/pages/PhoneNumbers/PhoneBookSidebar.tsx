import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiSearch,
  FiUser,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import Input from "../../components/form/input/InputField";
import { useDebounce } from "../../hooks/useDebounce";
import { useIsMobile } from "../../hooks/useScreenSize";
import { useBookingV3 } from "../../hooks/api-hooks/v3/useBookingV3";
import { useCustomerList } from "../../hooks/api-hooks/v3/useCustomer";
import { formatPhoneNumber } from "../../helper/formatPhoneNumber";
import { copyToClipBoard } from "../../helper/copyToClipboard";
import { RootState } from "../../store";
import type { ICustomer } from "../../types/customer";
import {
  toDeploymentCustomerSnapshot,
  type IDeploymentCustomerSnapshot,
} from "../../types/bookingV3";

type BookType = "new_customer" | "deployment";
type Step = "book_type" | "pick_customer" | "confirm";

export type PhoneBookSidebarProps = {
  isOpen: boolean;
  phoneIds: number[];
  phoneNumbers: string[];
  onClose: () => void;
  onSuccess?: () => void;
};

const STEP_ORDER: Step[] = ["book_type", "pick_customer", "confirm"];

const formatCustomerSales = (
  sales: ICustomer["sales"] | null | undefined,
  saleUsername?: string | null,
): string => {
  if (Array.isArray(sales) && sales.length > 0) {
    return sales
      .map((s) =>
        typeof s === "string"
          ? s
          : String(s?.username || s?.full_name || "").trim(),
      )
      .filter(Boolean)
      .join(", ");
  }
  return saleUsername?.trim() || "";
};

function OptionCard({
  icon,
  title,
  description,
  badge,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-400 hover:bg-brand-50/40 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:bg-brand-950/20">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-300">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </span>
          {badge ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {description}
        </span>
      </span>
    </button>
  );
}

export default function PhoneBookSidebar({
  isOpen,
  phoneIds,
  phoneNumbers,
  onClose,
  onSuccess,
}: PhoneBookSidebarProps) {
  const isMobile = useIsMobile(768);
  const user = useSelector((state: RootState) => state.auth.user);
  const saleUsername = String(user?.sub || "");
  const { mutateAsync: bookV3, isPending } = useBookingV3();

  const [step, setStep] = useState<Step>("book_type");
  const [bookType, setBookType] = useState<BookType | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [customerQuery, setCustomerQuery] = useState("");
  const debouncedQuery = useDebounce(customerQuery, 400);

  const shouldLoadCustomers = isOpen && bookType === "deployment";

  const { data: customerData, isLoading: customersLoading } = useCustomerList(
    {
      // role=1 xem toàn bộ; các role khác lọc theo sale
      sale: user?.role === 1 ? undefined : saleUsername || undefined,
      q: debouncedQuery.trim() || undefined,
    },
    { enabled: shouldLoadCustomers },
  );

  const customers = customerData?.items ?? [];

  useEffect(() => {
    if (!isOpen) {
      setStep("book_type");
      setBookType(null);
      setSelectedCustomer(null);
      setCustomerQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);

  const displayPhones = useMemo(() => {
    if (user?.role !== 1) {
      return phoneNumbers.map((p) => formatPhoneNumber(p));
    }
    return phoneNumbers;
  }, [phoneNumbers, user?.role]);

  const deploymentCustomer = useMemo((): IDeploymentCustomerSnapshot | null => {
    if (bookType !== "deployment" || !selectedCustomer) return null;
    return toDeploymentCustomerSnapshot(selectedCustomer);
  }, [bookType, selectedCustomer]);

  const stepMeta = useMemo(() => {
    switch (step) {
      case "book_type":
        return {
          title: "Chọn loại book",
          subtitle: "Bước 1 · Hình thức đặt số",
          progress: 1,
        };
      case "pick_customer":
        return {
          title: "Chọn khách hàng",
          subtitle: "Bước 2 · Danh sách khách",
          progress: 2,
        };
      case "confirm":
        return {
          title: "Xác nhận book số",
          subtitle: "Bước cuối · Kiểm tra trước khi gửi",
          progress: bookType === "new_customer" ? 2 : 3,
        };
      default:
        return { title: "Book số", subtitle: "", progress: 1 };
    }
  }, [step, bookType]);

  const totalSteps = bookType === "new_customer" ? 2 : 3;

  const goBack = () => {
    if (step === "confirm") {
      if (bookType === "new_customer") setStep("book_type");
      else setStep("pick_customer");
      return;
    }
    if (step === "pick_customer") {
      setStep("book_type");
      return;
    }
    onClose();
  };

  const handleConfirmBook = async () => {
    try {
      if (bookType === "deployment" && !selectedCustomer) {
        Swal.fire("Thiếu thông tin", "Vui lòng chọn khách hàng", "warning");
        return;
      }

      const payload =
        bookType === "new_customer"
          ? {
              id_phone_numbers: phoneIds,
              is_new_customer: true,
            }
          : {
              id_phone_numbers: phoneIds,
              is_new_customer: false,
              deployment_customer: deploymentCustomer!,
            };

      await bookV3(payload);

      const result = await Swal.fire({
        title: "Book thành công",
        html: `
          <div class="text-left">
            <label class="block text-center mb-2 text-sm font-medium text-gray-900">
              Danh sách số đã book:
            </label>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-300">
              <div class="text-sm text-gray-700">${phoneNumbers.join(", ")}</div>
            </div>
          </div>
        `,
        icon: "success",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Sao chép",
        denyButtonText: "Bỏ qua",
        allowOutsideClick: false,
      });

      if (result.isConfirmed) {
        copyToClipBoard(phoneNumbers);
        await Swal.fire("Đã sao chép!", "", "success");
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join("; ")
        : detail ===
            "You have reached your daily booking limit. Please contact your administrator to increase your limit if needed."
          ? "Bạn đã đạt đến giới hạn đặt số hàng ngày. Vui lòng liên hệ với quản trị viên của bạn để tăng giới hạn nếu cần."
          : typeof detail === "string"
            ? detail
            : "Đã xảy ra lỗi, vui lòng thử lại.";

      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: String(message),
      });
    }
  };

  if (typeof document === "undefined") return null;

  const panel = (
    <div
      className={`flex h-full min-h-0 w-full flex-col bg-white dark:bg-gray-900 ${
        isMobile ? "" : "border-l border-gray-200 dark:border-gray-800"
      }`}>
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white px-4 pb-4 pt-4 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {step !== "book_type" ? (
              <button
                type="button"
                onClick={goBack}
                disabled={isPending}
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Quay lại">
                <FiArrowLeft size={16} />
              </button>
            ) : (
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
                <MdOutlinePhoneInTalk size={18} />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                {stepMeta.subtitle}
              </p>
              <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                {stepMeta.title}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Đã chọn{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {phoneIds.length}
                </span>{" "}
                số điện thoại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Đóng">
            <FiX size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const done = i + 1 < stepMeta.progress;
            const active = i + 1 === Math.min(stepMeta.progress, totalSteps);
            return (
              <div
                key={STEP_ORDER[i] ?? i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  done || active
                    ? "bg-brand-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        {/* Phone chips */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Số sẽ book
            </p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
              {displayPhones.length} số
            </span>
          </div>
          <textarea
            readOnly
            rows={3}
            value={displayPhones.join(", ") || "—"}
            className="w-full resize-y rounded-xl border border-brand-100 bg-white px-3 py-2 font-mono text-xs font-medium leading-relaxed text-brand-700 shadow-sm outline-none dark:border-brand-900/50 dark:bg-gray-900 dark:text-brand-300"
          />
        </div>

        {step === "book_type" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Chọn hình thức book phù hợp với khách hàng của bạn.
            </p>
            <OptionCard
              icon={<FiUserPlus size={20} />}
              title="Book cho khách hàng"
              description="Đặt số cho khách hàng. Số sẽ ở trạng thái đã book."
              onClick={() => {
                setBookType("new_customer");
                setSelectedCustomer(null);
                setStep("confirm");
              }}
            />
            {/* Tạm ẩn — Triển khai khách hàng
            <OptionCard
              icon={<HiOutlineDocumentText size={20} />}
              title="Triển khai khách hàng"
              description="Chọn khách hàng / hợp đồng và tạo đơn triển khai."
              onClick={() => {
                setBookType("deployment");
                setSelectedCustomer(null);
                setCustomerQuery("");
                setStep("pick_customer");
              }}
            />
            */}
          </div>
        )}

        {step === "pick_customer" && (
          <div className="space-y-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm tên KH hoặc số hợp đồng..."
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-0.5">
              {customersLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 py-10 dark:border-gray-700">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Đang tải danh sách...
                  </p>
                </div>
              ) : customers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-700">
                  <FiUser className="mx-auto mb-2 text-gray-300" size={28} />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Không tìm thấy khách hàng
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Thử đổi từ khóa tìm kiếm.
                  </p>
                </div>
              ) : (
                customers.map((customer) => {
                  const active =
                    selectedCustomer?.customer_id === customer.customer_id &&
                    selectedCustomer?.contract_id === customer.contract_id;
                  const salesLabel = formatCustomerSales(
                    customer.sales,
                    customer.sale_username,
                  );
                  return (
                    <button
                      key={`${customer.customer_id}-${customer.contract_id}-${customer.contract_number}`}
                      type="button"
                      onClick={() => setSelectedCustomer(customer)}
                      className={`relative w-full rounded-2xl border p-3.5 text-left transition ${
                        active
                          ? "border-brand-500 bg-brand-50 shadow-sm ring-1 ring-brand-500/30 dark:border-brand-400 dark:bg-brand-950/30"
                          : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500"
                      }`}>
                      {active ? (
                        <span className="absolute right-3 top-3 text-brand-600 dark:text-brand-400">
                          <FiCheckCircle size={18} />
                        </span>
                      ) : null}
                      <p className="pr-6 text-sm font-semibold text-gray-900 dark:text-white">
                        {customer.customer_name || "—"}
                      </p>
                      <div className="mt-2 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <p>
                          <span className="text-gray-400">HĐ:</span>{" "}
                          <span className="font-medium">
                            {customer.contract_number || "—"}
                          </span>
                        </p>
                        {customer.contract_type ? (
                          <p>
                            <span className="text-gray-400">Loại HĐ:</span>{" "}
                            <span className="font-medium">
                              {customer.contract_type}
                            </span>
                          </p>
                        ) : null}
                        {customer.tax_code ? (
                          <p>
                            <span className="text-gray-400">MST:</span>{" "}
                            <span className="font-medium">
                              {customer.tax_code}
                            </span>
                          </p>
                        ) : null}
                        <p>
                          <span className="text-gray-400">Tính phí:</span>{" "}
                          <span className="font-medium">
                            {customer.no_charge ? "Có" : "Không"}
                          </span>
                        </p>
                        {salesLabel ? (
                          <p>
                            <span className="text-gray-400">Sale:</span>{" "}
                            <span className="font-medium">{salesLabel}</span>
                          </p>
                        ) : null}
                        {customer.contract_note ? (
                          <p className="line-clamp-2">
                            <span className="text-gray-400">Ghi chú:</span>{" "}
                            <span className="font-medium">
                              {customer.contract_note}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
                <FiCheckCircle className="text-brand-600 dark:text-brand-400" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tóm tắt yêu cầu
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Loại book
                  </span>
                  <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
                    {bookType === "new_customer"
                      ? "Book cho khách hàng"
                      : "Triển khai khách hàng"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Trạng thái sau book
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      bookType === "new_customer"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}>
                    {bookType === "new_customer" ? "Đã book" : "Chờ triển khai"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Số lượng
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {phoneIds.length} số
                  </span>
                </div>

                {bookType === "deployment" && deploymentCustomer
                  ? (() => {
                      const salesLabel = formatCustomerSales(
                        deploymentCustomer.sales,
                        deploymentCustomer.sale_username,
                      );
                      const rows: { label: string; value: ReactNode }[] = [
                        {
                          label: "Khách hàng",
                          value: deploymentCustomer.customer_name || "—",
                        },
                        {
                          label: "Số hợp đồng",
                          value: deploymentCustomer.contract_number || "—",
                        },
                      ];
                      if (deploymentCustomer.contract_type) {
                        rows.push({
                          label: "Loại HĐ",
                          value: deploymentCustomer.contract_type,
                        });
                      }
                      if (deploymentCustomer.tax_code) {
                        rows.push({
                          label: "MST",
                          value: deploymentCustomer.tax_code,
                        });
                      }
                      rows.push({
                        label: "No charge",
                        value: deploymentCustomer.no_charge ? "Có" : "Không",
                      });
                      if (salesLabel) {
                        rows.push({ label: "Sale", value: salesLabel });
                      }
                      if (deploymentCustomer.contract_note) {
                        rows.push({
                          label: "Ghi chú",
                          value: deploymentCustomer.contract_note,
                        });
                      }
                      return rows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-start justify-between gap-3 px-4 py-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {row.label}
                          </span>
                          <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
                            {row.value}
                          </span>
                        </div>
                      ));
                    })()
                  : null}
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Kiểm tra kỹ trước khi xác nhận. Thao tác sẽ gửi yêu cầu book ngay.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 gap-2 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          disabled={isPending}
          onClick={goBack}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
          {step === "book_type" ? "Hủy" : "Quay lại"}
        </button>

        {step === "pick_customer" && (
          <button
            type="button"
            disabled={!selectedCustomer || isPending}
            onClick={() => setStep("confirm")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            Tiếp tục
          </button>
        )}

        {step === "confirm" && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirmBook}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 disabled:opacity-50">
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang book...
              </>
            ) : (
              <>
                <FiCheck size={16} />
                Xác nhận book
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={isPending || !isOpen ? undefined : onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[101] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-900 ${
          isMobile ? "w-full max-w-full" : "w-full max-w-md"
        } ${isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"}`}
        aria-hidden={!isOpen}>
        {panel}
      </aside>
    </>,
    document.body,
  );
}
