import Swal from "sweetalert2";

type SwalMode = "add" | "update" | "delete" | "error";

interface ModalActionProps {
  mode: SwalMode;
  title: string;
  action: () => Promise<any>;
  onSuccess?: () => void;
  onError?: () => void;
  onClose?: () => void;
}

const ModalSwalAction = async ({
  mode,
  action,
  title,
  onSuccess,
  onError,
  onClose,
}: ModalActionProps) => {
  try {
    let confirmResult = true;

    if (mode === "delete") {
      confirmResult = await Swal.fire({
        title: `Bạn có chắc chắn muốn xoá ${title}?`,
        text: "Hành động này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xoá",
        cancelButtonText: "Huỷ",
      }).then((result) => result.isConfirmed);
    }

    if (confirmResult) {
      const res = await action();
      if (res) {
        let successMessage = "";
        switch (mode) {
          case "add":
            successMessage = `Thêm mới ${title} thành công!`;
            break;
          case "update":
            successMessage = `Cập nhật ${title} thành công!`;
            break;
          case "delete":
            successMessage = `Xoá ${title} thành công!`;
            break;
        }

        await Swal.fire({
          title: "Thành công!",
          text: successMessage,
          icon: "success",
          confirmButtonText: "Đóng",
        });
        onClose?.();
        onSuccess?.();
      }
    }
  } catch (error) {
    await Swal.fire({
      title: "Lỗi!",
      text: `Đã có lỗi xảy ra, ${error} `,
      icon: "error",
      confirmButtonText: "Đóng",
    });
    onError?.();
  } finally {
    onClose?.();
  }
};

export default ModalSwalAction;
