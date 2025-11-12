import { useEffect, useState } from "react";

export default function DualProgress({
  total = 10000,
  current = 9000,
  label = "",
  className = "",
  barClassName = "",
  labelClassName = "",
}) {
  const percent = Math.min(100, (current / total) * 100);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
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
        <span className="dark:text-white">
          <strong className="dark:text-white">
            {label.length > 0 && `${label + ":"}`} {current.toLocaleString()}
          </strong>{" "}
          / {total.toLocaleString()}
        </span>
        <span className="font-medium">{Math.round(animated)}%</span>
      </div>

      <div
        className={`relative h-4 bg-gray-200 rounded-lg overflow-hidden shadow-inner ${barClassName}`}>
        <div
          className="h-full flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
          style={{
            width: `${animated}%`,
            background: "linear-gradient(90deg, #2563eb, #06b6d4)",
            boxShadow: "0 0 10px rgba(59,130,246,0.4)",
          }}>
          {animated > 15 && <span>{Math.round(animated)}%</span>}
        </div>
      </div>
    </div>
  );
}
