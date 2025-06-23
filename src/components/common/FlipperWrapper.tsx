import React, { useState, useRef } from "react";
import { Drawer, IconButton, useMediaQuery } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { useTheme } from "../../context/ThemeContext";

interface ResponsiveFilterWrapperProps {
  children: React.ReactNode;
  drawerTitle?: string;
  pageTitle?: string;
}

const ResponsiveFilterWrapper: React.FC<ResponsiveFilterWrapperProps> = ({
  children,
  drawerTitle = "Bộ lọc",
}) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const [openDrawer, setOpenDrawer] = useState(false);
  const { theme } = useTheme();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const handleCloseDrawer = () => {
    // Blur any focused elements inside drawer before closing
    if (drawerRef.current) {
      const focusedElement = drawerRef.current.querySelector(
        ":focus"
      ) as HTMLElement;
      if (focusedElement) {
        focusedElement.blur();
      }
    }

    setOpenDrawer(false);

    // Return focus to trigger button after closing
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 100);
  };

  const handleOpenDrawer = () => {
    setOpenDrawer(true);
  };

  // Xử lý click bên ngoài drawer
  const handleBackdropClick = (event: React.MouseEvent) => {
    // Chỉ đóng drawer khi click vào backdrop, không phải vào nội dung drawer
    if (event.target === event.currentTarget) {
      handleCloseDrawer();
    }
  };

  return (
    <div className={`z-50 ${isMobile ? "fixed bottom-12 right-4" : ""}`}>
      {!isMobile && <div>{children}</div>}

      {isMobile && (
        <>
          <div className="flex justify-end mb-9 pr-1">
            <IconButton
              ref={triggerButtonRef}
              onClick={handleOpenDrawer}
              className="!bg-blue-100 dark:!bg-gray-700 rounded-full"
              size="large"
              aria-label="Mở bộ lọc">
              <FilterAltIcon className="text-blue-600 dark:text-white" />
            </IconButton>
          </div>

          <Drawer
            anchor="bottom"
            open={openDrawer}
            onClose={handleCloseDrawer}
            // Cải thiện focus management
            disableAutoFocus={false}
            disableEnforceFocus={false}
            disableRestoreFocus={false}
            // Thêm modal props để xử lý accessibility
            ModalProps={{
              // Đảm bảo focus được manage đúng cách
              disableAutoFocus: false,
              disableEnforceFocus: false,
              disableRestoreFocus: false,
              // Thêm aria-labelledby cho accessibility
              "aria-labelledby": "drawer-title",
              // Thêm onClick handler cho backdrop
              onClick: handleBackdropClick,
            }}
            PaperProps={{
              ref: drawerRef,
              style: {
                borderRadius: "16px 16px 0 0",
                height: "50vh",
                maxHeight: "90vh",
                background: theme == "dark" ? "#1f2937" : "",
              },
            }}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2
                  id="drawer-title"
                  className="text-lg font-semibold dark:text-white">
                  {drawerTitle}
                </h2>
                <button
                  className="text-blue-500 text-sm hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                  onClick={handleCloseDrawer}
                  aria-label="Đóng bộ lọc">
                  Đóng
                </button>
              </div>
              <div>{children}</div>
            </div>
          </Drawer>
        </>
      )}
    </div>
  );
};

export default ResponsiveFilterWrapper;
