import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import { useTheme } from "../../context/ThemeContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <div className="relative bg-white z-1 h-screen box-border">
      <div className="relative flex flex-col justify-center w-full h-full lg:flex-row dark:bg-gray-900 p-6 sm:p-0 box-border">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 dark:bg-white/5 bg-[#f2800f] lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block">
                {theme == "dark" ? (
                  <img
                    width={300}
                    height={50}
                    src="/Logo/Logo_company.png"
                    alt="Logo"
                  />
                ) : (
                  <img
                    width={300}
                    height={50}
                    src="/Logo/Logo_company_darkmode.png"
                    alt="Logo"
                  />
                )}
              </Link>
              <p className="text-center pt-6 text-[#ffffff] dark:text-white/60">
                Hệ thống Booking số dành cho sale và doanh nghiệp hàng đầu Việt
                Nam
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
