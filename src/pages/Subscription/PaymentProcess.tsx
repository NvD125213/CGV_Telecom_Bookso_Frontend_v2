import { useEffect, useState, useMemo } from "react";

interface CylinderUsageProps {
  current: number; // Đã thanh toán
  total: number; // Tổng
}

const formatCurrencyVN = (value: number = 0) => {
  return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
};

export default function HorizontalCylinderUsage({
  current,
  total,
}: CylinderUsageProps) {
  const percent = useMemo(() => {
    if (!total || total === 0) return 0;
    return Math.min(100, (current / total) * 100);
  }, [current, total]);

  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / 800, 1);
      setAnimatedPercent(percent * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [percent]);

  // Tính toán gradient động từ đỏ sang xanh
  const getGradientColors = (p: number) => {
    if (p < 50) {
      return "from-red-600 via-red-500 to-red-400";
    } else {
      return "from-green-600 via-green-500 to-green-400";
    }
  };

  return (
    <div className="w-full space-y-1">
      {/* Tiêu đề */}
      <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
        <span>Thanh toán:</span>
        <span className="font-bold">{formatCurrencyVN(current)}</span>
      </div>

      <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
        <span>Tổng tiền:</span>
        <span className="font-bold">{formatCurrencyVN(total)}</span>
      </div>

      {/* Thanh xi-lanh nằm ngang */}
      <div className="w-full h-4 bg-gray-400/70 dark:bg-gray-700 rounded-full overflow-hidden relative border border-gray-300 dark:border-gray-600">
        {/* Background shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>

        {/* Thanh tiến trình animated với gradient động */}
        <div
          className={`h-full rounded-full transition-all ease-out bg-gradient-to-r ${getGradientColors(
            animatedPercent
          )}`}
          style={{
            width: `${animatedPercent}%`,
            transition: "width 0.1s",
          }}>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-semibold drop-shadow-md">
            {animatedPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
