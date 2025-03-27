import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import ComponentCard from "../../common/ComponentCard";
import { getDashBoard, getDetailReportByRole } from "../../../services/report";

const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];

const NumberStatusPieChart = () => {
  const [data, setData] = useState([
    { name: "Đã Book", value: 0, detail: "booked" },
    { name: "Đã Triển Khai", value: 0, detail: "released" },
  ]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState("");

  useEffect(() => {
    const fetchingData = async () => {
      try {
        const response = await getDashBoard({
          year,
          month,
          day: day ? parseInt(day) : undefined,
        });

        const formattedData = [
          {
            name: "Đã Book",
            value: response?.data?.booked || 0,
            detail: "booked",
          },
          {
            name: "Đã Triển Khai",
            value: response?.data?.deployed || 0,
            detail: "released",
          },
        ];
        setData(formattedData);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };

    fetchingData();
  }, [year, month, day]);

  const handleClick = (entry: any) => {
    const fetChingDataDetail = async () => {
      try {
        const response = await getDetailReportByRole({
          year,
          month,
          day: day ? parseInt(day) : undefined,
          option: entry.detail,
        });
        console.log(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu chi tiết:", error);
      }
    };
    fetChingDataDetail();
  };

  // Tính tổng giá trị để kiểm tra nếu tất cả đều = 0
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ComponentCard>
      <div className="flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4">
          Thống kê số theo trạng thái
        </h3>
        <div className="flex gap-4 mb-4">
          <select
            className="p-2 border rounded"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}>
            {[...Array(10)].map((_, index) => {
              const currentYear = new Date().getFullYear();
              return (
                <option key={index} value={currentYear - index}>
                  {currentYear - index}
                </option>
              );
            })}
          </select>

          <select
            className="p-2 border rounded"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}>
            {[...Array(12)].map((_, index) => (
              <option key={index} value={index + 1}>
                Tháng {index + 1}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="p-2 border rounded w-20"
            placeholder="Ngày"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            min="1"
            max="31"
          />
        </div>

        {totalValue === 0 ? (
          <div className="text-center text-gray-500 text-lg">
            Chưa có dữ liệu
          </div>
        ) : (
          <PieChart width={400} height={320}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              fill="#8884d8"
              paddingAngle={0}
              dataKey="value"
              label>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => handleClick(entry)}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </div>
    </ComponentCard>
  );
};

export default NumberStatusPieChart;
