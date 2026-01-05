import React, { useEffect } from "react";
import Swal from "sweetalert2";
import ReactDOM from "react-dom/client";
import Select from "../../components/form/Select";

interface PackageModalProps {
  open: boolean;
  onClose: () => void;
  item: any;
  onSubmit: (data: {
    type: "renew" | "new";
    package?: string;
    planId?: number;
  }) => void;
  packages: any[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onLoadPage: (page: number) => Promise<void>;
}

const ModalRenew: React.FC<PackageModalProps> = ({
  open,
  item,
  onClose,
  onSubmit,
  packages,
  currentPage,
  totalPages,
  loading,
  onLoadPage,
}) => {
  useEffect(() => {
    if (open) {
      showInitialDialog();
    }
  }, [open]);

  const showInitialDialog = async () => {
    const result = await Swal.fire({
      title: "Quản lý gói",
      text: "Bạn muốn gia hạn gói cũ hay chọn gói mới?",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Gia hạn gói cũ",
      denyButtonText: "Chọn gói mới",
      cancelButtonText: "Đóng",
      confirmButtonColor: "#3085d6",
      denyButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
    });

    if (result.isConfirmed) {
      handleRenewOld();
    } else if (result.isDenied) {
      showPackageSelection();
    } else {
      onClose();
    }
  };

  const handleRenewOld = async () => {
    console.log("handleRenewOld called - about to call onSubmit");
    onSubmit({ type: "renew" });
    onClose();
  };

  const showPackageSelection = async () => {
    let selectedPackageId = "";
    let currentRoot: any = null;

    const renderSelect = (page: number, pkgs: any[]) => {
      const container = document.getElementById("select-container");
      const loadingContainer = document.getElementById("loading-container");

      if (loadingContainer) {
        loadingContainer.style.display = loading ? "block" : "none";
      }

      if (container) {
        if (currentRoot) {
          currentRoot.unmount();
        }
        currentRoot = ReactDOM.createRoot(container);

        if (pkgs.length === 0 && !loading) {
          container.innerHTML =
            '<p style="text-align: center; color: #999;">Không có gói nào</p>';
        } else {
          currentRoot.render(
            <Select
              options={pkgs.map((pkg) => ({
                value: pkg.id,
                label: pkg.name,
              }))}
              value={selectedPackageId}
              onChange={(value) => {
                selectedPackageId = value;
              }}
              placeholder="Chọn một gói"
            />
          );
        }
      }
    };

    const { value: confirmed } = await Swal.fire({
      title: "Chọn gói mới",
      html: `
        <div id="loading-container" style="text-align: center; padding: 20px;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3085d6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
          <p style="margin-top: 10px;">Đang tải danh sách gói...</p>
        </div>
        <div id="select-container"></div>
        <div id="pagination-container"></div>
      `,
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Đóng",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6c757d",
      width: "600px",
      didOpen: () => {
        // Render với packages hiện tại (có thể rỗng ban đầu)
        renderSelect(currentPage, packages);

        // Subscribe để update khi packages thay đổi
        const checkInterval = setInterval(() => {
          if (packages.length > 0) {
            renderSelect(currentPage, packages);
            clearInterval(checkInterval);
          }
        }, 100);
      },
      preConfirm: () => {
        if (!selectedPackageId) {
          Swal.showValidationMessage("Vui lòng chọn một gói!");
          return false;
        }
        return selectedPackageId;
      },
    });

    if (confirmed) {
      // Convert confirmed to number if it's a string
      const confirmedId =
        typeof confirmed === "string" ? parseInt(confirmed) : confirmed;

      const selectedPackage = packages.find((pkg) => pkg.id === confirmedId);

      onSubmit({
        type: "new",
        package: selectedPackage?.name,
        planId: selectedPackage?.id,
      });
      onClose();
    } else {
      onClose();
    }
  };

  return null;
};

export default ModalRenew;
