import Swal from "sweetalert2";

interface ConfirmModalProps {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ConfirmModal = ({
  title = "Xác nhận",
  text = `Bạn có chắc chắn muốn thực hiện ${title} ?`,
  confirmButtonText = "Đồng ý",
  cancelButtonText = "Hủy",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const handleConfirm = () => {
    Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm();
      } else if (result.dismiss === Swal.DismissReason.cancel && onCancel) {
        onCancel();
      }
    });
  };

  return {
    open: handleConfirm,
  };
};
