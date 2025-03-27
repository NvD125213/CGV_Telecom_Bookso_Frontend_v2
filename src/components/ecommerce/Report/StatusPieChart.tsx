import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
// import { Modal } from "antd";

const data = [
  { name: "Đã Book", value: 120, detail: "Chi tiết về số đã book" },
  { name: "Còn tồn lại", value: 80, detail: "Chi tiết về số còn tồn lại" },
  { name: "Đã Triển Khai", value: 50, detail: "Chi tiết về số đã triển khai" },
];

const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];

const NumberStatusPieChart = () => {
  const handleClick = (entry) => {
    console.log("Xuan manh check entry", entry);
  };

  return (
    <div className="flex flex-col items-center  h-screen">
      <h3 className="text-xl font-semibold mb-4">
        Thống kê số theo trạng thái
      </h3>
      <PieChart width={400} height={400}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          label>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              className="cursor-pointer transition-transform hover:scale-101"
              onClick={() => handleClick(entry)}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};

export default NumberStatusPieChart;
