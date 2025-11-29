import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { OutboundDidForm } from "../Plan/OutboundDidForm";
import {
  formatNumberWithCommas,
  parseNumberFromFormatted,
} from "../Plan/helpers/parseNumberFormat";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useApi } from "../../hooks/useApi";
import { configService } from "../../services/config";
import { getPriceForRange } from "../Order/PriceConfig";

export interface RenewData {
  users: number;
  minutes: number;
  price: number;
  outboundDidByRoute: Record<string, number>;
  meta: Record<string, string>;
}

interface ModalRenewProps {
  open: boolean;
  onClose: () => void;
  onRenewWithOldInfo?: () => void;
  onRenewWithNewInfo?: (data: RenewData) => void;
  currentData?: {
    users?: number;
    minutes?: number;
    price?: number;
    outboundDidByRoute?: Record<string, number>;
  };
}

export default function ModalRenew({
  open,
  onClose,
  onRenewWithOldInfo,
  onRenewWithNewInfo,
  currentData = {},
}: ModalRenewProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Currency fields for formatted display
  const [currencyFields, setCurrencyFields] = useState({
    total_minute: currentData.minutes
      ? formatNumberWithCommas(`${currentData.minutes}`)
      : "",
    total_users: currentData.users
      ? formatNumberWithCommas(`${currentData.users}`)
      : "",
    total_price: currentData.price
      ? formatNumberWithCommas(`${currentData.price}`)
      : "",
  });

  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Actual numeric values
  const [totalMinute, setTotalMinute] = useState(currentData.minutes || 0);
  const [totalUsers, setTotalUsers] = useState(currentData.users || 0);
  const [totalPrice, setTotalPrice] = useState(0);

  const [outboundDidByRoute, setOutboundDidByRoute] = useState<
    Record<string, number>
  >(currentData.outboundDidByRoute || {});
  const [meta, setMeta] = useState<Record<string, string>>({});

  // Fetch price config from API
  const { data: dataConfigOrder } = useApi(() =>
    configService.getConfigByKey("price_order")
  );
  const priceConfig = dataConfigOrder?.data?.value || null;

  // Handle currency field changes
  const handleCurrencyChange = (
    field: "total_minute" | "total_users",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    const formatted = formatNumberWithCommas(rawValue);
    const numericValue = parseNumberFromFormatted(rawValue);

    setCurrencyFields((prev) => ({ ...prev, [field]: formatted }));

    if (field === "total_minute") {
      setTotalMinute(numericValue);
    } else if (field === "total_users") {
      setTotalUsers(numericValue);
    }

    // Clear error
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Calculate total price automatically
  useEffect(() => {
    if (!priceConfig) return;

    const total_cid = Object.values(outboundDidByRoute).reduce(
      (acc, val) => acc + (Number(val) || 0),
      0
    );

    const minutePrice = getPriceForRange(
      totalMinute,
      priceConfig.call_minutes_package || []
    );
    const userPrice = getPriceForRange(
      totalUsers,
      priceConfig.user_package || []
    );
    const cidPrice = getPriceForRange(
      total_cid,
      priceConfig.prefix_package_phones || []
    );

    const calculatedTotal =
      totalMinute * minutePrice + totalUsers * userPrice + total_cid * cidPrice;

    setTotalPrice(calculatedTotal);
  }, [totalMinute, totalUsers, outboundDidByRoute, priceConfig]);

  // Auto update price display when totalPrice changes
  useEffect(() => {
    if (totalPrice > 0) {
      setCurrencyFields((prev) => ({
        ...prev,
        total_price: formatNumberWithCommas(`${totalPrice}`),
      }));
    }
  }, [totalPrice]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!totalMinute) {
      errors.total_minute = "Số phút gọi không được để trống";
    }

    if (!totalUsers) {
      errors.total_users = "Số user không được để trống";
    }

    if (!outboundDidByRoute || Object.keys(outboundDidByRoute).length === 0) {
      errors.outbound_did_by_route = "Vui lòng chọn ít nhất 1 nhà cung cấp";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (open && !showCustomModal) {
      showStep1Swal();
    }
  }, [open]);

  const showStep1Swal = () => {
    Swal.fire({
      title: "Gia hạn order",
      text: "Bạn muốn gia hạn với thông tin cũ hay cập nhật thông tin mới?",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Dùng thông tin cũ",
      denyButtonText: "Thay đổi thông tin",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#2563eb",
      denyButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        onRenewWithOldInfo?.();
        onClose();
      } else if (result.isDenied) {
        setShowCustomModal(true);
      } else {
        onClose();
      }
    });
  };

  const handleCloseCustomModal = () => {
    setShowCustomModal(false);
    onClose();
  };

  const handleBackToStep1 = () => {
    setShowCustomModal(false);
    showStep1Swal();
  };

  if (!showCustomModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-1000"
      style={{
        animation: "swalBackdropShow 0.2s ease-out",
      }}>
      <div
        className="bg-white w-[600px] rounded-xl shadow-xl p-6"
        style={{
          animation: "swalModalShow 0.3s ease-out",
        }}>
        <style>{`
          @keyframes swalBackdropShow {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes swalModalShow {
            from {
              opacity: 0;
              transform: scale(0.7);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
        <h2 className="text-xl font-semibold text-blue-700 mb-6">
          Gia hạn với thông tin mới
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total Minutes */}
          <div>
            <Label>Số phút gọi</Label>
            <Input
              type="text"
              value={currencyFields.total_minute}
              placeholder="Nhập số phút gọi"
              onChange={(e) => handleCurrencyChange("total_minute", e)}
            />
            {formErrors.total_minute && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.total_minute}
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
            />
            {formErrors.total_users && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.total_users}
              </p>
            )}
          </div>
        </div>

        {/* Outbound DID */}
        <div className="mt-4">
          <OutboundDidForm
            value={outboundDidByRoute}
            onChange={setOutboundDidByRoute}
            meta={meta}
            onMetaChange={setMeta}
            hide="meta"
          />
          {formErrors.outbound_did_by_route && (
            <p className="text-red-500 text-sm mt-2">
              {formErrors.outbound_did_by_route}
            </p>
          )}
        </div>

        {/* Total Price Display */}
        <div className="mt-6">
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

        <div className="flex justify-end mt-6 gap-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={handleCloseCustomModal}>
            Hủy
          </button>

          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={handleBackToStep1}>
            Quay lại
          </button>

          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            onClick={() => {
              if (!validateForm()) {
                return;
              }
              onRenewWithNewInfo?.({
                users: totalUsers,
                minutes: totalMinute,
                price: totalPrice,
                outboundDidByRoute,
                meta,
              });
              handleCloseCustomModal();
            }}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
