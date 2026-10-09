import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiHash,
  FiSearch,
  FiStar,
  FiTag,
  FiUser,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { BsBuilding } from "react-icons/bs";
import { FaRandom } from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi";
import { LuCircleDot } from "react-icons/lu";
import { MdOutlineBadge } from "react-icons/md";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Switch from "../../components/form/switch/Switch";
import AutocompleteMultiple, {
  Option,
} from "../../components/ui/autocomplete/auto-complete";
import { useDebounce } from "../../hooks/useDebounce";
import { useIsMobile } from "../../hooks/useScreenSize";
import { useBookingRandomV3 } from "../../hooks/api-hooks/v3/useBookingV3";
import { useCustomerList } from "../../hooks/api-hooks/v3/useCustomer";
import { useBrandNameList } from "../../hooks/api-hooks/v3/useBrandname";
import useSelectData from "../../hooks/useSelectData";
import { getProviders } from "../../services/provider";
import { getTypeNumber } from "../../services/typeNumber";
import { getBrandName } from "../../services/brandName";
import { validateRandomPhone } from "../../validate/phoneNumber";
import { copyToClipBoard } from "../../helper/copyToClipboard";
import { groupDataCustomer } from "../../helper/group-data-customer";
import { RootState } from "../../store";
import { IProvider, ITypeNumber } from "../../types";
import type {
  ICustomerSsAccount,
  IGroupedCustomer,
} from "../../types/customer";
import {
  toDeploymentCustomerSnapshotFromGrouped,
  type IDeploymentCustomerSnapshot,
} from "../../types/bookingV3";

export interface IBookRandom {
  quantity: number;
  provider_id: number;
  type_id: number;
  brandname_id?: number;
  is_beautiful_number?: boolean;
}

const initialBookRandom: IBookRandom = {
  quantity: 1,
  provider_id: 0,
  type_id: 0,
  is_beautiful_number: false,
};

type BookType = "new_customer" | "deployment";
type Step = "criteria" | "book_type" | "pick_customer" | "confirm";

interface PhoneNumberProps {
  isOpen: boolean;
  onCloseModal: () => void;
  onSuccess: () => void;
}

const formatCustomerSales = (
  sales: IGroupedCustomer["sales"] | null | undefined,
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

const extractBookedPhones = (result: unknown): string[] => {
  if (!result) return [];
  if (Array.isArray(result)) {
    return result
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return String(item);
        }
        if (item && typeof item === "object") {
          const row = item as Record<string, unknown>;
          return String(row.phone_number ?? row.phone ?? "");
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof result === "object") {
    const obj = result as Record<string, unknown>;
    for (const key of ["phone_numbers", "data", "items", "phones"]) {
      const value = obj[key];
      if (Array.isArray(value)) return extractBookedPhones(value);
    }
  }
  return [];
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

const PhoneRandomModal: React.FC<PhoneNumberProps> = ({
  isOpen,
  onCloseModal,
  onSuccess,
}) => {
  const isMobile = useIsMobile(768);
  const user = useSelector((state: RootState) => state.auth.user);
  const saleUsername = String(user?.sub || "");
  const { mutateAsync: bookRandomV3, isPending } = useBookingRandomV3();

  const [step, setStep] = useState<Step>("criteria");
  const [listNumber, setListNumber] = useState<IBookRandom>(initialBookRandom);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IBookRandom, string>>
  >({});
  const [selectedBrand, setSelectedBrand] = useState<Option[]>([]);
  const [bookType, setBookType] = useState<BookType | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<IGroupedCustomer | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<ICustomerSsAccount | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const debouncedQuery = useDebounce(customerQuery, 400);

  const { data: providers } = useSelectData<IProvider>({
    service: getProviders,
  });
  const { data: typeNumbers } = useSelectData<ITypeNumber>({
    service: getTypeNumber,
  });
  const { data: brandNameListData } = useBrandNameList(
    { page: 1, size: 20, is_active: true },
    { enabled: isOpen },
  );

  const shouldLoadCustomers = isOpen && bookType === "deployment";

  const { data: customerData, isLoading: customersLoading } = useCustomerList(
    {
      sale: user?.role === 1 ? undefined : saleUsername || undefined,
      q: debouncedQuery.trim() || undefined,
    },
    { enabled: shouldLoadCustomers },
  );

  const customers = useMemo(
    () => groupDataCustomer(customerData),
    [customerData],
  );

  /** 1 thẻ = 1 mã SS (gắn kèm khách hàng) — chọn 1 lần */
  const pickRows = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    const rows: Array<{
      key: string;
      customer: IGroupedCustomer;
      account: ICustomerSsAccount;
    }> = [];

    customers.forEach((customer) => {
      const salesLabel = formatCustomerSales(
        customer.sales,
        customer.sale_username,
      );
      (customer.ss_accounts ?? []).forEach((account) => {
        const title = [
          customer.customer_name,
          account.name,
          account.description,
        ]
          .filter(Boolean)
          .join(" · ");
        const haystack = [
          title,
          account.name,
          account.description,
          account.display_account,
          salesLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (q && !haystack.includes(q)) return;
        rows.push({
          key: `${customer.customer_id}-${account.account_id}`,
          customer,
          account,
        });
      });
    });
    return rows;
  }, [customers, customerQuery]);

  const canContinueCustomerPick = Boolean(selectedCustomer && selectedAccount);

  const resetCustomerPick = () => {
    setSelectedCustomer(null);
    setSelectedAccount(null);
    setCustomerQuery("");
  };

  const handlePickRow = (
    customer: IGroupedCustomer,
    account: ICustomerSsAccount,
  ) => {
    setSelectedCustomer(customer);
    setSelectedAccount(account);
  };

  const brandOptions = useMemo(
    () =>
      (brandNameListData?.items ?? []).map((brand) => ({
        label: brand.name,
        value: String(brand.id),
      })),
    [brandNameListData],
  );

  const fetchBrandOptions = useCallback(async (query: string) => {
    const result = await getBrandName({
      page: 1,
      size: 20,
      is_active: true,
      search: query.trim() || undefined,
      order_by: "created_at",
      order_dir: "desc",
    });
    return result.items.map((brand) => ({
      label: brand.name,
      value: String(brand.id),
    }));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setStep("criteria");
      setListNumber(initialBookRandom);
      setErrors({});
      setSelectedBrand([]);
      setBookType(null);
      resetCustomerPick();
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

  const setValue = (
    name: keyof IBookRandom,
    value: string | number | boolean,
  ) => {
    setListNumber((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const deploymentCustomer = useMemo((): IDeploymentCustomerSnapshot | null => {
    if (bookType !== "deployment" || !selectedCustomer || !selectedAccount) {
      return null;
    }
    return toDeploymentCustomerSnapshotFromGrouped(
      selectedCustomer,
      selectedAccount,
    );
  }, [bookType, selectedCustomer, selectedAccount]);

  const providerName = useMemo(
    () =>
      providers.find((p) => Number(p.id) === Number(listNumber.provider_id))
        ?.name || "—",
    [providers, listNumber.provider_id],
  );

  const typeName = useMemo(
    () =>
      typeNumbers.find((t) => Number(t.id) === Number(listNumber.type_id))
        ?.name || "—",
    [typeNumbers, listNumber.type_id],
  );

  const stepMeta = useMemo(() => {
    switch (step) {
      case "criteria":
        return {
          title: "Book ngẫu nhiên",
          subtitle: "Bước 1 · Điều kiện lấy số",
          progress: 1,
        };
      case "book_type":
        return {
          title: "Chọn loại book",
          subtitle: "Bước 2 · Hình thức đặt số",
          progress: 2,
        };
      case "pick_customer":
        return {
          title: "Chọn mã Softwitch",
          subtitle: "Bước 3 · Doanh nghiệp & Softswitch",
          progress: 3,
        };
      case "confirm":
        return {
          title: "Xác nhận book random",
          subtitle: "Bước cuối · Kiểm tra trước khi gửi",
          progress: bookType === "new_customer" ? 3 : 4,
        };
      default:
        return { title: "Book ngẫu nhiên", subtitle: "", progress: 1 };
    }
  }, [step, bookType]);

  const totalSteps = bookType === "new_customer" ? 3 : 4;

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
    if (step === "book_type") {
      setStep("criteria");
      return;
    }
    onCloseModal();
  };

  const handleContinueFromCriteria = () => {
    const validationErrors = validateRandomPhone(listNumber);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStep("book_type");
  };

  const handleConfirmBook = async () => {
    try {
      if (bookType === "deployment" && !deploymentCustomer) {
        Swal.fire(
          "Thiếu thông tin",
          "Vui lòng chọn khách hàng và mã SS (nếu có).",
          "warning",
        );
        return;
      }

      const payload =
        bookType === "new_customer"
          ? {
              type_number_id: Number(listNumber.type_id),
              provider_id: Number(listNumber.provider_id),
              quantity_book: Number(listNumber.quantity),
              is_beautiful_number: Boolean(listNumber.is_beautiful_number),
              is_new_customer: true,
              ...(listNumber.brandname_id
                ? { brandname_id: Number(listNumber.brandname_id) }
                : {}),
            }
          : {
              type_number_id: Number(listNumber.type_id),
              provider_id: Number(listNumber.provider_id),
              quantity_book: Number(listNumber.quantity),
              is_beautiful_number: Boolean(listNumber.is_beautiful_number),
              is_new_customer: false,
              deployment_customer: deploymentCustomer!,
              ...(listNumber.brandname_id
                ? { brandname_id: Number(listNumber.brandname_id) }
                : {}),
            };

      const res = await bookRandomV3(payload);
      const bookedPhones = extractBookedPhones(res);
      const quantity = Number(listNumber.quantity);

      onCloseModal();
      onSuccess();

      const result = await Swal.fire({
        title: "Book ngẫu nhiên thành công!",
        html: `
          <div class="text-left">
            <label class="block mb-2 text-sm font-medium ${
              bookedPhones.length > 0 && bookedPhones.length < quantity
                ? "text-red-600"
                : "text-gray-900"
            }">
              ${
                bookedPhones.length > 0 && bookedPhones.length < quantity
                  ? `Chỉ còn ${bookedPhones.length} số có thể book`
                  : "Danh sách số đã book"
              }
            </label>
            <textarea rows="4" class="block max-h-[200px] w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 px-[10px]">${
              bookedPhones.length > 0
                ? bookedPhones.join(", ")
                : `Đã book ${quantity} số ngẫu nhiên`
            }</textarea>
          </div>
        `,
        icon: "success",
        showDenyButton: true,
        confirmButtonText: "Sao chép",
        denyButtonText: "Bỏ qua",
        allowOutsideClick: false,
      });

      if (result.isConfirmed && bookedPhones.length > 0) {
        copyToClipBoard(bookedPhones);
        await Swal.fire("Sao chép thành công!", "", "success");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join("; ")
        : detail ===
            "Currently a booking request can only book a maximum of 100 numbers."
          ? "Bạn đã vượt quá số lượng được phép book của 1 request! Giới hạn của 1 lần book là dưới 100 số"
          : detail ===
              "You have reached your daily booking limit. Please contact your administrator to increase your limit if needed."
            ? "Bạn đã vượt quá số lượng book cho phép trong ngày! Vui lòng liên hệ admin để được cấp phép thêm."
            : typeof detail === "string"
              ? detail
              : "Đã xảy ra lỗi, vui lòng thử lại.";

      Swal.fire({
        icon: err?.response?.status === 404 ? "warning" : "error",
        title: err?.response?.status === 404 ? "Thông báo" : "Oops...",
        text: String(message),
      });
    }
  };

  if (typeof document === "undefined") return null;

  const panel = (
    <div
      className={`flex h-dvh min-h-0 w-full flex-col bg-white dark:bg-gray-900 ${
        isMobile ? "" : "border-l border-gray-200 dark:border-gray-800"
      }`}>
      <div className="shrink-0 border-b border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white px-4 pb-4 pt-4 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {step !== "criteria" ? (
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
                <FaRandom size={16} />
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
                Random theo loại số + nhà cung cấp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseModal}
            disabled={isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Đóng">
            <FiX size={18} />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const done = i + 1 < stepMeta.progress;
            const active = i + 1 === Math.min(stepMeta.progress, totalSteps);
            return (
              <div
                key={i}
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

      <div className="h-[calc(100dvh)] min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        {step === "criteria" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Hệ thống sẽ lấy số ngẫu nhiên theo loại số, nhà cung cấp và số
              lượng — không chọn từng số cụ thể.
            </p>
            <div>
              <Label>Số lượng *</Label>
              <Input
                type="number"
                min="1"
                value={listNumber.quantity}
                onChange={(e) =>
                  setValue("quantity", Number(e.target.value) || 0)
                }
                error={errors.quantity}
                hint={errors.quantity}
              />
            </div>
            <div>
              <Label>Nhà cung cấp *</Label>
              <Select
                options={[
                  { label: "Chọn nhà cung cấp", value: "0" },
                  ...providers.map((provider) => ({
                    label: provider.name,
                    value: String(provider.id),
                  })),
                ]}
                value={String(listNumber.provider_id || "0")}
                onChange={(value) => setValue("provider_id", Number(value))}
                placeholder="Lựa chọn nhà cung cấp"
                className="dark:bg-black dark:text-white"
              />
              {errors.provider_id ? (
                <p className="mt-1 text-xs text-error-500">
                  {errors.provider_id}
                </p>
              ) : null}
            </div>
            <div>
              <Label>Loại số *</Label>
              <Select
                options={[
                  { label: "Chọn loại số", value: "0" },
                  ...typeNumbers.map((type) => ({
                    label: type.name,
                    value: String(type.id),
                  })),
                ]}
                value={String(listNumber.type_id || "0")}
                onChange={(value) => setValue("type_id", Number(value))}
                placeholder="Lựa chọn loại số"
                className="dark:bg-black dark:text-white"
              />
              {errors.type_id ? (
                <p className="mt-1 text-xs text-error-500">{errors.type_id}</p>
              ) : null}
            </div>
            <div>
              <Label>Tên định danh (tùy chọn)</Label>
              <AutocompleteMultiple
                options={brandOptions}
                value={selectedBrand}
                fetchOptions={fetchBrandOptions}
                placeholder="Gõ để tìm định danh..."
                className="dark:bg-black dark:text-white"
                onChange={(value) => {
                  const options = Array.isArray(value) ? value : [];
                  const single =
                    options.length > 1
                      ? [options[options.length - 1]]
                      : options;
                  setSelectedBrand(single);
                  if (single.length === 0) {
                    setListNumber((prev) => {
                      const next = { ...prev };
                      delete next.brandname_id;
                      return next;
                    });
                    return;
                  }
                  setValue("brandname_id", Number(single[0].value));
                }}
              />
            </div>
            <div className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700">
              <Switch
                label="Số đẹp"
                checked={Boolean(listNumber.is_beautiful_number)}
                onChange={(checked) =>
                  setValue("is_beautiful_number", Boolean(checked))
                }
              />
            </div>
          </div>
        )}

        {step === "book_type" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="mb-3 flex items-center gap-2">
                <FaRandom className="text-brand-500" size={13} />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                  Điều kiện random
                </p>
              </div>
              <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2.5">
                  <FiHash
                    className="mt-0.5 shrink-0 text-brand-500"
                    size={14}
                  />
                  <p>
                    <span className="text-gray-400">Số lượng:</span>{" "}
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {listNumber.quantity}
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <BsBuilding
                    className="mt-0.5 shrink-0 text-brand-500"
                    size={13}
                  />
                  <p>
                    <span className="text-gray-400">Nhà cung cấp:</span>{" "}
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {providerName}
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <FiTag className="mt-0.5 shrink-0 text-brand-500" size={14} />
                  <p>
                    <span className="text-gray-400">Loại số:</span>{" "}
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {typeName}
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <MdOutlineBadge
                    className="mt-0.5 shrink-0 text-brand-500"
                    size={15}
                  />
                  <p>
                    <span className="text-gray-400">Tên định danh:</span>{" "}
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {selectedBrand[0]?.label || "Không chọn"}
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <FiStar
                    className="mt-0.5 shrink-0 text-brand-500"
                    size={14}
                  />
                  <p>
                    <span className="text-gray-400">Số đẹp:</span>{" "}
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {listNumber.is_beautiful_number ? "Có" : "Không"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Chọn hình thức book phù hợp với khách hàng của bạn.
            </p>
            <OptionCard
              icon={<FiUserPlus size={20} />}
              title="Book cho khách hàng"
              description="Đặt số ngẫu nhiên cho khách hàng. Số sẽ ở trạng thái đã book."
              onClick={() => {
                setBookType("new_customer");
                resetCustomerPick();
                setStep("confirm");
              }}
            />
            <OptionCard
              icon={<HiOutlineDocumentText size={20} />}
              title="Triển khai khách hàng"
              description="Chọn khách hàng / mã SS và tạo đơn triển khai."
              onClick={() => {
                setBookType("deployment");
                resetCustomerPick();
                setStep("pick_customer");
              }}
            />
          </div>
        )}

        {step === "pick_customer" && (
          <div className="space-y-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm tên doanh nghiệp, sale..."
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[calc(100dvh-22rem)] space-y-2 overflow-y-auto pr-0.5">
              {customersLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 py-10 dark:border-gray-700">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Đang tải danh sách...
                  </p>
                </div>
              ) : pickRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-700">
                  <FiUser className="mx-auto mb-2 text-gray-300" size={28} />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Không tìm thấy mã SS
                  </p>
                </div>
              ) : (
                pickRows.map(({ key, customer, account }) => {
                  const active =
                    selectedCustomer?.customer_id === customer.customer_id &&
                    selectedAccount?.account_id === account.account_id;
                  const salesLabel =
                    formatCustomerSales(
                      customer.sales,
                      customer.sale_username,
                    ) || "—";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePickRow(customer, account)}
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
                      <p className="flex min-w-0 items-center gap-1.5 pr-6 text-sm font-bold text-gray-900 dark:text-white">
                        <span className="truncate">{account.name || "—"}</span>
                        <LuCircleDot
                          className="shrink-0 text-brand-500 dark:text-brand-400"
                          size={14}
                          aria-hidden
                        />
                        <span className="truncate">
                          {account.description || "—"}
                        </span>
                      </p>
                      <div className="mt-2 space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                        <p>
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            Tên khách hàng:
                          </span>{" "}
                          <span className="font-bold text-gray-900 dark:text-white">
                            {customer.customer_name || "—"}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            Mã SS:
                          </span>{" "}
                          <span className="font-bold text-gray-900 dark:text-white">
                            {account.name || "—"}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            Chi tiết SS:
                          </span>{" "}
                          <span className="font-bold text-gray-900 dark:text-white">
                            {account.description || "—"}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            Sale:
                          </span>{" "}
                          <span className="font-bold text-gray-900 dark:text-white">
                            {salesLabel}
                          </span>
                        </p>
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
                  Tóm tắt yêu cầu random
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Số lượng
                  </span>
                  <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
                    {listNumber.quantity}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Nhà cung cấp
                  </span>
                  <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
                    {providerName}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Loại số
                  </span>
                  <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
                    {typeName}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Tên định danh
                  </span>
                  <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
                    {selectedBrand[0]?.label || "Không chọn"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Số đẹp
                  </span>
                  <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
                    {listNumber.is_beautiful_number ? "Có" : "Không"}
                  </span>
                </div>
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
                      ];
                      if (deploymentCustomer.tax_code) {
                        rows.push({
                          label: "MST",
                          value: deploymentCustomer.tax_code,
                        });
                      }
                      if (salesLabel) {
                        rows.push({ label: "Sale", value: salesLabel });
                      }
                      rows.push(
                        {
                          label: "Mã SS",
                          value: deploymentCustomer.name || "—",
                        },
                        {
                          label: "Description",
                          value: deploymentCustomer.description || "—",
                        },
                      );
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
              Kiểm tra kỹ trước khi xác nhận. Hệ thống sẽ lấy số ngẫu nhiên theo
              điều kiện đã chọn.
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          disabled={isPending}
          onClick={goBack}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
          {step === "criteria" ? "Hủy" : "Quay lại"}
        </button>

        {step === "criteria" && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleContinueFromCriteria}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 disabled:opacity-50">
            Tiếp tục
          </button>
        )}

        {step === "pick_customer" && (
          <button
            type="button"
            disabled={!canContinueCustomerPick || isPending}
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
                Xác nhận random
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
        onClick={isPending || !isOpen ? undefined : onCloseModal}
        aria-hidden={!isOpen}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[101] flex h-dvh max-h-dvh flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-900 ${
          isMobile ? "w-full max-w-full" : "w-full max-w-md"
        } ${isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"}`}
        aria-hidden={!isOpen}>
        {panel}
      </aside>
    </>,
    document.body,
  );
};

export default PhoneRandomModal;
