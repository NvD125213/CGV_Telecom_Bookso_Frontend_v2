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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Tổng số điện thoại chưa book */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <MdEventAvailable className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng số điện thoại đang có sẵn
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {quantityPhoneNumberAvailable}
            </h4>
          </div>
        </div>
      </div>

      {/* Tổng số điện thoại trong tháng có dữ liệu */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <MdCalendarMonth className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Số điện thoại được thêm
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {phoneCurrent || 0}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
