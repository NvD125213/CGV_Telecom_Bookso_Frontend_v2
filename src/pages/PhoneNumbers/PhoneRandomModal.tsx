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
  FiSearch,
  FiUser,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { FaRandom } from "react-icons/fa";
// Tạm ẩn cùng lựa chọn triển khai khách hàng
// import { HiOutlineDocumentText } from "react-icons/hi";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import { LuCircleDot } from "react-icons/lu";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Switch from "../../components/form/switch/Switch";
import AutocompleteMultiple from "../../components/ui/autocomplete/auto-complete";
import { useDebounce } from "../../hooks/useDebounce";
import { useBookingRandomV3 } from "../../hooks/api-hooks/v3/useBookingV3";
import { useCustomerList } from "../../hooks/api-hooks/v3/useCustomer";
import { useBrandNameList } from "../../hooks/api-hooks/v3/useBrandname";
import useSelectData from "../../hooks/useSelectData";
import { getProviders } from "../../services/provider";
import { getTypeNumber } from "../../services/typeNumber";
import { getBrandName } from "../../services/brandName";
import { validateRandomSelections } from "../../validate/phoneNumber";
import { copyToClipBoard } from "../../helper/copyToClipboard";
import { groupDataCustomer } from "../../helper/group-data-customer";
import { RootState } from "../../store";
import { IProvider, ITypeNumber } from "../../types";
import {
  toSsAccountQuery,
  type ICustomerSsAccount,
  type IGroupedCustomer,
} from "../../types/customer";
import {
  toDeploymentCustomerSnapshotFromGrouped,
  type IBookingRandomSelection,
  type IDeploymentCustomerSnapshot,
} from "../../types/bookingV3";

export interface IRandomSelectionLine {
  id: string;
  provider_id: number;
  type_id: number;
  quantity: number;
  brandname_id?: number;
  brand_label?: string;
  is_beautiful_number: boolean;
}

const createSelectionLine = (): IRandomSelectionLine => ({
  id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  provider_id: 0,
  type_id: 0,
  quantity: 1,
  is_beautiful_number: false,
});

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

const collectBookedPhones = (result: unknown): string[] => {
  if (result == null || result === "") return [];
  if (typeof result === "string" || typeof result === "number") {
    return [String(result)];
  }
  if (Array.isArray(result)) {
    return result.flatMap((item) => collectBookedPhones(item));
  }
  if (typeof result === "object") {
    const row = result as Record<string, unknown>;
    const direct = row.phone_number ?? row.phone;
    const nested = [
      "phone_numbers",
      "phones",
      "data",
      "items",
      "selections_result",
    ].flatMap((key) =>
      row[key] != null ? collectBookedPhones(row[key]) : [],
    );
    return [
      ...(direct != null && direct !== "" ? [String(direct)] : []),
      ...nested,
    ];
  }
  return [];
};

const extractBookedPhones = (result: unknown): string[] => {
  const seen = new Set<string>();
  return collectBookedPhones(result).filter((phone) => {
    if (seen.has(phone)) return false;
    seen.add(phone);
    return true;
  });
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
  const user = useSelector((state: RootState) => state.auth.user);
  const saleUsername = String(user?.sub || "");
  const { mutateAsync: bookRandomV3, isPending } = useBookingRandomV3();

  const [step, setStep] = useState<Step>("criteria");
  const [lines, setLines] = useState<IRandomSelectionLine[]>(() => [
    createSelectionLine(),
  ]);
  const [lineErrors, setLineErrors] = useState<
    Record<
      string,
      Partial<Record<"quantity" | "provider_id" | "type_id", string>>
    >
  >({});
  const [bookType, setBookType] = useState<BookType | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<IGroupedCustomer | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<ICustomerSsAccount | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [ssAccountInput, setSsAccountInput] = useState("");
  const debouncedQuery = useDebounce(customerQuery, 400);
  const debouncedSsAccount = useDebounce(ssAccountInput, 400);

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
      ss_account: toSsAccountQuery(debouncedSsAccount),
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
    const ssTokens = (toSsAccountQuery(debouncedSsAccount) ?? "")
      .split(",")
      .filter(Boolean)
      .map((token) => token.toLowerCase());
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
        if (
          ssTokens.length > 0 &&
          !ssTokens.some(
            (token) =>
              String(account.account_id) === token ||
              account.name.toLowerCase().includes(token),
          )
        ) {
          return;
        }
        rows.push({
          key: `${customer.customer_id}-${account.account_id}`,
          customer,
          account,
        });
      });
    });
    return rows;
  }, [customers, customerQuery, debouncedSsAccount]);

  const canContinueCustomerPick = Boolean(selectedCustomer && selectedAccount);

  const resetCustomerPick = () => {
    setSelectedCustomer(null);
    setSelectedAccount(null);
    setCustomerQuery("");
    setSsAccountInput("");
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
      setLines([createSelectionLine()]);
      setLineErrors({});
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

  const updateLine = (
    id: string,
    patch: Partial<Omit<IRandomSelectionLine, "id">>,
  ) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
    setLineErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [...prev, createSelectionLine()]);
  };

  const removeLine = (id: string) => {
    setLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((line) => line.id !== id),
    );
    setLineErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const providerLabel = (id: number) =>
    providers.find((provider) => Number(provider.id) === Number(id))?.name ||
    "—";

  const typeLabel = (id: number) =>
    typeNumbers.find((type) => Number(type.id) === Number(id))?.name || "—";

  const totalQuantity = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0),
    0,
  );

  const toSelections = (): IBookingRandomSelection[] =>
    lines.map((line) => ({
      type_number_id: Number(line.type_id),
      provider_id: Number(line.provider_id),
      quantity_book: Number(line.quantity),
      is_beautiful_number: Boolean(line.is_beautiful_number),
      ...(line.brandname_id ? { brandname_id: Number(line.brandname_id) } : {}),
    }));

  const deploymentCustomer = useMemo((): IDeploymentCustomerSnapshot | null => {
    if (bookType !== "deployment" || !selectedCustomer || !selectedAccount) {
      return null;
    }
    return toDeploymentCustomerSnapshotFromGrouped(
      selectedCustomer,
      selectedAccount,
    );
  }, [bookType, selectedCustomer, selectedAccount]);

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
    const validationErrors = validateRandomSelections(lines);
    if (Object.keys(validationErrors).length > 0) {
      setLineErrors(validationErrors);
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

      const selections = toSelections();
      const payload =
        bookType === "new_customer"
          ? {
              selections,
              is_new_customer: true,
            }
          : {
              selections,
              is_new_customer: false,
              deployment_customer: deploymentCustomer!,
            };

      const res = await bookRandomV3(payload);
      const bookedPhones = extractBookedPhones(res);
      const quantity = totalQuantity;

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
    <div className="@container flex h-full min-h-0 w-full flex-col bg-white dark:bg-gray-900 sm:border-l sm:border-gray-200 dark:sm:border-gray-800">
      <div className="shrink-0 border-b border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 sm:px-5">
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
                Nhiều nhà cung cấp · một mã SS
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

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        {step === "criteria" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Thêm một hoặc nhiều nhà cung cấp. Toàn bộ số random đi vào cùng
              một đơn và một mã SS.
            </p>
            <Label>Cấu hình nhà cung cấp</Label>
            <div className="flex flex-col gap-3">
              {lines.map((line, index) => {
                const rowError = lineErrors[line.id];
                return (
                  <div
                    key={line.id}
                    className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Nhà cung cấp {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 1}
                        className="inline-flex min-h-9 items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Xóa tuyến ${index + 1}`}>
                        <IoIosRemove size={16} />
                        Xóa
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 @min-[40rem]:grid-cols-2">
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                          Nhà cung cấp
                        </p>
                        <Select
                          options={[
                            { label: "Chọn nhà cung cấp", value: "0" },
                            ...providers.map((provider) => ({
                              label: provider.name,
                              value: String(provider.id),
                            })),
                          ]}
                          value={String(line.provider_id || "0")}
                          onChange={(value) =>
                            updateLine(line.id, { provider_id: Number(value) })
                          }
                          placeholder="Nhà cung cấp"
                          className="dark:bg-black dark:text-white"
                        />
                        {rowError?.provider_id ? (
                          <p className="mt-1 text-xs text-error-500">
                            {rowError.provider_id}
                          </p>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                          Loại số
                        </p>
                        <Select
                          options={[
                            { label: "Chọn loại số", value: "0" },
                            ...typeNumbers.map((type) => ({
                              label: type.name,
                              value: String(type.id),
                            })),
                          ]}
                          value={String(line.type_id || "0")}
                          onChange={(value) =>
                            updateLine(line.id, { type_id: Number(value) })
                          }
                          placeholder="Loại số"
                          className="dark:bg-black dark:text-white"
                        />
                        {rowError?.type_id ? (
                          <p className="mt-1 text-xs text-error-500">
                            {rowError.type_id}
                          </p>
                        ) : null}
                      </div>
                      <div className="min-w-0 @min-[40rem]:col-span-2">
                        <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                          Tên định danh
                        </p>
                        <AutocompleteMultiple
                          options={brandOptions}
                          value={
                            line.brandname_id
                              ? [
                                  {
                                    label: line.brand_label || "Định danh",
                                    value: String(line.brandname_id),
                                  },
                                ]
                              : []
                          }
                          fetchOptions={fetchBrandOptions}
                          placeholder="Tên định danh (tùy chọn)"
                          className="dark:bg-black dark:text-white"
                          onChange={(value) => {
                            const options = Array.isArray(value) ? value : [];
                            const single =
                              options.length > 1
                                ? [options[options.length - 1]]
                                : options;
                            if (single.length === 0) {
                              updateLine(line.id, {
                                brandname_id: undefined,
                                brand_label: undefined,
                              });
                              return;
                            }
                            updateLine(line.id, {
                              brandname_id: Number(single[0].value),
                              brand_label: single[0].label,
                            });
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                          Số lượng
                        </p>
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.id, {
                              quantity: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="SL"
                          error={rowError?.quantity}
                          hint={rowError?.quantity}
                        />
                      </div>
                      <div className="flex min-h-11 w-full items-center self-end rounded-xl border border-gray-200 px-3 dark:border-gray-700">
                        <Switch
                          label="Số đẹp"
                          checked={line.is_beautiful_number}
                          onChange={(checked) =>
                            updateLine(line.id, {
                              is_beautiful_number: Boolean(checked),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addLine}
                className="mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-500/40 dark:text-indigo-400 dark:hover:bg-indigo-950/30">
                <IoIosAdd size={20} />
                Thêm nhà cung cấp
              </button>
            </div>
          </div>
        )}

        {step === "book_type" && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-gray-800/50 sm:px-4">
                <FaRandom className="shrink-0 text-2xl text-brand-600 dark:text-brand-400" />
                <div className="min-w-0">
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    Điều kiện random
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    Tổng{" "}
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {totalQuantity}
                    </span>{" "}
                    số &middot;{" "}
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {lines.length}
                    </span>{" "}
                    nhà cung cấp
                  </div>
                </div>
              </div>
              <ul className="space-y-2 px-3 py-3 sm:px-4">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
                    <p className="flex items-start gap-2 break-words text-sm font-medium text-gray-800 dark:text-gray-100">
                      <LuCircleDot
                        className="mt-0.5 shrink-0 text-brand-500 dark:text-brand-400"
                        size={14}
                        aria-hidden
                      />
                      <span>
                        {providerLabel(line.provider_id)} ·{" "}
                        {typeLabel(line.type_id)}
                      </span>
                    </p>
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-5 text-xs text-gray-500 dark:text-gray-400">
                      <span>Số lượng: {line.quantity}</span>
                      <span>{line.brand_label || "Không định danh"}</span>
                      <span>
                        {line.is_beautiful_number ? "Số đẹp" : "Số thường"}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              Chọn hình thức book phù hợp với khách hàng của bạn.
            </p>
            <div className="grid grid-cols-1 gap-3 @min-[40rem]:grid-cols-2">
              <OptionCard
                icon={<FiUserPlus size={20} />}
                title="Thực hiện book cho khách hàng"
                description="Đặt số ngẫu nhiên cho khách hàng. Số sẽ ở trạng thái đã book."
                onClick={() => {
                  setBookType("new_customer");
                  resetCustomerPick();
                  setStep("confirm");
                }}
              />
              {/* Tạm ẩn book triển khai khách hàng
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
              */}
            </div>
          </div>
        )}

        {step === "pick_customer" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 @min-[40rem]:grid-cols-2">
              <div className="relative min-w-0 flex-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm tên doanh nghiệp, sale..."
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Input
                  type="text"
                  placeholder="Nhập mã SS cần tìm..."
                  value={ssAccountInput}
                  onChange={(e) => setSsAccountInput(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
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
                      <div className="min-w-0 pr-7">
                        <p className="break-words text-sm font-bold text-gray-900 dark:text-white">
                          {account.name || "—"}
                        </p>
                        <p className="mt-0.5 break-words text-xs font-medium text-gray-500 dark:text-gray-400">
                          {account.description || "—"}
                        </p>
                      </div>
                      <dl className="mt-2 grid grid-cols-[5.25rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-xs">
                        <dt className="text-gray-500 dark:text-gray-400">
                          Khách hàng
                        </dt>
                        <dd className="break-words font-semibold text-gray-900 dark:text-white">
                          {customer.customer_name || "—"}
                        </dd>
                        <dt className="text-gray-500 dark:text-gray-400">
                          Mã SS
                        </dt>
                        <dd className="break-words font-semibold text-gray-900 dark:text-white">
                          {account.name || "—"}
                        </dd>
                        <dt className="text-gray-500 dark:text-gray-400">
                          Chi tiết
                        </dt>
                        <dd className="break-words font-semibold text-gray-900 dark:text-white">
                          {account.description || "—"}
                        </dd>
                        <dt className="text-gray-500 dark:text-gray-400">
                          Sale
                        </dt>
                        <dd className="break-words font-semibold text-gray-900 dark:text-white">
                          {salesLabel}
                        </dd>
                      </dl>
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
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-gray-800/50 sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FiCheckCircle className="shrink-0 text-2xl text-brand-600 dark:text-brand-400" />
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-gray-900 dark:text-white">
                      Tóm tắt yêu cầu random
                    </div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-0.5">
                      Tổng{" "}
                      <span className="text-brand-600 dark:text-brand-400 font-bold">
                        {totalQuantity}
                      </span>{" "}
                      số &middot;{" "}
                      <span className="text-brand-600 dark:text-brand-400 font-bold">
                        {lines.length}
                      </span>{" "}
                      nhà cung cấp
                    </div>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 px-3 py-3 sm:px-4">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
                    <p className="flex items-start gap-2 break-words text-sm font-medium text-gray-800 dark:text-gray-100">
                      <LuCircleDot
                        className="mt-0.5 shrink-0 text-brand-500 dark:text-brand-400"
                        size={14}
                        aria-hidden
                      />
                      <span>
                        {providerLabel(line.provider_id)} ·{" "}
                        {typeLabel(line.type_id)}
                      </span>
                    </p>
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-5 text-xs text-gray-500 dark:text-gray-400">
                      <span>Số lượng: {line.quantity}</span>
                      <span>{line.brand_label || "Không định danh"}</span>
                      <span>
                        {line.is_beautiful_number ? "Số đẹp" : "Số thường"}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
              <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Loại book
                  </span>
                  <span className="min-w-0 break-words text-right text-sm font-medium text-gray-900 dark:text-white">
                    {bookType === "new_customer"
                      ? "Thực hiện book cho khách hàng"
                      : "Triển khai khách hàng"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
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
                          className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {row.label}
                          </span>
                          <span className="min-w-0 break-words text-right text-sm font-medium text-gray-900 dark:text-white">
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

      <div className="flex shrink-0 gap-2 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          disabled={isPending}
          onClick={goBack}
          className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
          {step === "criteria" ? "Hủy" : "Quay lại"}
        </button>

        {step === "criteria" && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleContinueFromCriteria}
            className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 disabled:opacity-50">
            Tiếp tục
          </button>
        )}

        {step === "pick_customer" && (
          <button
            type="button"
            disabled={!canContinueCustomerPick || isPending}
            onClick={() => setStep("confirm")}
            className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            Tiếp tục
          </button>
        )}

        {step === "confirm" && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirmBook}
            className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 disabled:opacity-50">
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
        className={`fixed inset-y-0 right-0 z-[101] flex h-dvh max-h-dvh w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-900 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl ${
          isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!isOpen}>
        {panel}
      </aside>
    </>,
    document.body,
  );
};

export default PhoneRandomModal;
