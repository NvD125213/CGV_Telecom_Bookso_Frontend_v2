import { useState, useEffect } from "react";
import { MdEventAvailable } from "react-icons/md";
import { MdCalendarMonth } from "react-icons/md";

import { getQuantityAvailable } from "../../services/phoneNumber";
import { getNumberCurrent } from "../../services/report";

interface INumberCurrent {
  year: number;
  month?: number;
  day?: number;
}

export default function EcommerceMetrics() {
  const [quantityPhoneNumberAvailable, setQuantityPhoneNumberAvailable] =
    useState<number>(0);
  const [phoneCurrent, setPhoneCurrent] = useState(null);

  const fetchDataNumberCurrent = async (data: INumberCurrent) => {
    try {
      const response = await getNumberCurrent({ year: data.year });
      const result = response.data;
      const date = new Date();
      const currentMonth = date.getMonth() + 1;
      setPhoneCurrent(result[currentMonth]);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    }
  };

  const fetchingDataPhoneNumberAvailable = async () => {
    try {
      const response = await getQuantityAvailable();
      setQuantityPhoneNumberAvailable(response?.data?.quantity_available || 0);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    }
  };

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    fetchDataNumberCurrent({ year: currentYear });
    fetchingDataPhoneNumberAvailable();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      {/* Tổng số điện thoại chưa book */}
      <div className="rounded-2xl border border-yellow-300 bg-white p-5 shadow-md dark:bg-[#1a1a1a] dark:border-yellow-600 md:p-6">
        {/* Icon container */}
        <div
          className="w-12 h-12 flex items-center justify-center rounded-xl shadow-sm"
          style={{ backgroundColor: "rgb(255, 240, 200)" }}>
          <MdEventAvailable className="text-[rgb(255,187,40)] size-6 dark:text-yellow-400" />
        </div>

        {/* Content */}
        <div className="mt-5">
          <span className="text-[18px] text-yellow-700 font-medium dark:text-yellow-400">
            Tổng số điện thoại đang có sẵn
          </span>
          <h4
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
            style={{
              background:
                "linear-gradient(to right, rgb(255,187,40), rgb(255,140,0))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            {quantityPhoneNumberAvailable}
          </h4>
        </div>
      </div>

      {/* Tổng số điện thoại trong tháng có dữ liệu */}
      <div className="rounded-2xl border border-blue-300 bg-white p-5 shadow-md dark:bg-[#1a1a1a] dark:border-blue-600 md:p-6">
        {/* Icon container */}
        <div
          className="w-12 h-12 flex items-center justify-center rounded-xl shadow-sm"
          style={{ backgroundColor: "rgb(220, 240, 255)" }}>
          <MdCalendarMonth className="text-[rgb(0,136,254)] size-6 dark:text-blue-400" />
        </div>

        {/* Content */}
        <div className="mt-5">
          <span className="text-[18px] text-blue-700 font-medium dark:text-blue-400">
            Số điện thoại được thêm trong tháng
          </span>
          <h4
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
            style={{
              background:
                "linear-gradient(to right, rgb(0,136,254), rgb(0,100,200))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            {phoneCurrent}
          </h4>
        </div>
      </div>
    </div>
  );
}
