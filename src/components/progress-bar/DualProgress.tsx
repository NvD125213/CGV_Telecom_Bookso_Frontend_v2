import { useEffect, useState } from "react";

export default function DualProgress({
  total = 0,
  current = 0,
  label = "",
  className = "",
  barClassName = "",
  labelClassName = "",
}) {
  const percent = (current / total) * 100;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: any) => {
      const progress = Math.min((now - start) / 800, 1);
      setAnimated(percent * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [percent]);

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      <div
        className={`flex justify-between text-sm text-gray-700 ${labelClassName}`}>
        <span className={`dark:text-white ${labelClassName}`}>
          <strong className="dark:text-white">
            {label.length > 0 && `${label}: `} {current.toLocaleString()}
          </strong>{" "}
          / {total.toLocaleString()}
        </span>
        <span className="font-medium dark:text-white">
          {animated.toFixed(1)}%
        </span>
      </div>

      <div
        className={`relative h-4 bg-gray-200 rounded-lg overflow-hidden shadow-inner ${barClassName}`}>
        <div
          className={`h-full flex items-center justify-center text-white text-xs font-semibold transition-all duration-500 ${
            animated > 100 ? "animate-glow" : ""
          }`}
          style={{
            width: `${Math.min(animated, 130)}%`,
            background:
              animated > 100
                ? "linear-gradient(90deg, #9333ea, #a855f7)" // tím sáng khi vượt ngưỡng
                : animated >= 100
                ? "linear-gradient(90deg, #dc2626, #ef4444)" // đỏ khi đạt 100%
                : animated >= 90
                ? "#dc2626" // gần đạt
                : "linear-gradient(90deg, #2563eb, #06b6d4)", // bình thường
            boxShadow:
              animated > 100
                ? "0 0 25px rgba(147,51,234,0.8), 0 0 50px rgba(147,51,234,0.4)"
                : animated >= 90
                ? "0 0 10px rgba(220,38,38,0.4)"
                : "0 0 10px rgba(59,130,246,0.4)",
          }}>
          {animated > 15 && <span>{animated.toFixed(1)}%</span>}
        </div>
      </div>
    </div>
  );
}
