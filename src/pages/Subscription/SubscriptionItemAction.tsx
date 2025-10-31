import { useState, useEffect } from "react";
import CustomModal from "../../components/common/CustomModal";
import { subscriptionItemService } from "../../services/subcription";
import { planService } from "../../services/plan";
import Swal from "sweetalert2";
import { useApi } from "../../hooks/useApi";

export interface SubscriptionItem {
  id?: number;
  subscription_id: number;
  plan_id: number;
  quantity: number;
  price_override_vnd: number;
  note: string;
}

interface SubscriptionItemActionProps {
  subscriptionId: number;
  externalModalState?: boolean;
  onExternalModalClose?: () => void;
  preSelectedPlan?: any;
  onRefreshItems?: () => void;
}

const SubscriptionItemAction: React.FC<SubscriptionItemActionProps> = ({
  subscriptionId,
  externalModalState = false,
  onExternalModalClose,
  preSelectedPlan,
  onRefreshItems,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SubscriptionItem, string>>
  >({});

  const { data: plansData } = useApi(() => planService.get({}));
  const plans = plansData?.data?.items || [];

  const [formData, setFormData] = useState<SubscriptionItem>({
    subscription_id: subscriptionId,
    plan_id: 0,
    quantity: 1,
    price_override_vnd: 0,
    note: "",
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
      });
    } else {
      setFormData({
        subscription_id: subscriptionId,
        plan_id: preSelectedPlan?.id || 0,
        quantity: 1,
        price_override_vnd: 0,
        note: "",
      });
    }
  }, [editingItem, subscriptionId, preSelectedPlan]);

  // Xử lý khi external modal state thay đổi
  useEffect(() => {
    if (externalModalState && preSelectedPlan) {
      setIsModalOpen(true);
    } else if (!externalModalState && !editingItem) {
      // Nếu external modal state về false và không có item đang edit, đóng modal
      setIsModalOpen(false);
    }
  }, [externalModalState, preSelectedPlan, editingItem]);

  const handleCloseModal = (shouldCallExternalClose: boolean = true) => {
    setIsModalOpen(false);
    setEditingItem(null);
    setErrors({});
    if (shouldCallExternalClose) {
      onExternalModalClose?.();
    }
  };

  const setValue = (name: keyof SubscriptionItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SubscriptionItem, string>> = {};

    // Chỉ validate plan_id khi không có preSelectedPlan
    if (!preSelectedPlan && (!formData.plan_id || formData.plan_id === 0)) {
      newErrors.plan_id = "Vui lòng chọn gói cước";
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (!formData.price_override_vnd || formData.price_override_vnd < 0) {
      newErrors.price_override_vnd = "Giá không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingItem && editingItem.id) {
        // Update
        await subscriptionItemService.update(editingItem.id, formData);
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Cập nhật subscription item thành công!",
        });
      } else {
        // Create
        await subscriptionItemService.create(formData);
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Thêm subscription item thành công!",
        });
      }

      // Gọi callback để refresh danh sách items ở parent
      onRefreshItems?.();
      // Nếu là external modal, gọi callback để clear state
      if (preSelectedPlan) {
        onExternalModalClose?.();
        handleCloseModal(false); // Đã gọi onExternalModalClose rồi, không gọi lại
      } else {
        handleCloseModal(true);
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.response?.data?.detail || "Có lỗi xảy ra",
      });
    }
  };
  // Format số sang dạng VND
  const formatCurrency = (value: number | string) => {
    if (!value && value !== 0) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(value));
  };

  // Xử lý giá tiền
  // Thêm state cho hiển thị dạng currency
  const [priceDisplay, setPriceDisplay] = useState<string>(
    formData.price_override_vnd
      ? formatCurrency(formData.price_override_vnd)
      : ""
  );

  // Khi người dùng nhập, chuyển về số và lưu vào formData, hiển thị dạng currency
  const handlePriceChange = (value: string | number | boolean | any[]) => {
    // chỉ xử lý string | number
    if (typeof value === "string" || typeof value === "number") {
      const rawValue = String(value).replace(/[^0-9]/g, ""); // giữ số
      const numberValue = rawValue ? Number(rawValue) : 0;

      setFormData((prev) => ({
        ...prev,
        price_override_vnd: numberValue,
      }));

      setPriceDisplay(rawValue ? formatCurrency(rawValue) : "");
    }
  };

  return (
    <>
      {/* Modal */}
      <CustomModal
        isOpen={isModalOpen || externalModalState}
        title={
          editingItem ? "Cập nhật gói cước bổ sung" : "Thêm gói cước bổ sung"
        }
        fields={[
          preSelectedPlan
            ? {
                name: "plan_id",
                label: "Gói cước",
                type: "text",
                value: preSelectedPlan.name || "",
                disabled: true,
                onChange: () => {}, // Không cần thay đổi
                error: errors.plan_id,
              }
            : {
                name: "plan_id",
                label: "Gói cước",
                type: "select",
                value: formData.plan_id,
                options: [
                  { label: "Chọn gói cước", value: "0" },
                  ...(plans?.map((plan: any) => ({
                    label: plan.name,
                    value: plan.id,
                  })) || []),
                ],
                onChange: (value) => setValue("plan_id", Number(value)),
                error: errors.plan_id,
              },
          // {
          //   name: "quantity",
          //   label: "Số lượng",
          //   type: "number",
          //   value: formData.quantity,
          //   onChange: (value) => setValue("quantity", Number(value)),
          //   error: errors.quantity,
          // },
          {
            name: "price_override_vnd",
            label: "Giá thay đổi (VND)",
            type: "text",
            value: priceDisplay,
            placeholder: "Nhập giá khác",
            onChange: handlePriceChange, // <--- sử dụng handler currency
            error: errors.price_override_vnd,
          },
          {
            name: "note",
            label: "Ghi chú",
            type: "textarea",
            value: formData.note,
            onChange: (value) => setValue("note", value as string),
            error: errors.note,
          },
        ]}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        submitText={editingItem ? "Cập nhật" : "Thêm mới"}
      />
    </>
  );
};

export default SubscriptionItemAction;
