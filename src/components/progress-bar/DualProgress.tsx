import { useEffect, useState } from "react";

export default function DualProgress({
  total = 10000,
  current = 9000,
  height = "h-5",
  showPercent = true,
  label = true,
  labelText = "Số phút gọi",
}) {
  const safeTotal = Number(total) || 0;
  const safeCurrent = Number(current) || 0;
  const targetPercent = safeTotal === 0 ? 0 : (safeCurrent / safeTotal) * 100;

  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercent(targetPercent * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [targetPercent]);

  const percent = Math.min(100, Math.max(0, animatedPercent));
  const percentText = `${Math.round(percent)}%`;

  return (
    <div className="w-full space-y-2">
      {/* Label phía trên */}
      {label && (
        <div className="flex justify-between text-sm text-gray-700 font-medium">
          <span>
            {labelText}:<strong> {safeCurrent.toLocaleString()}</strong> /{" "}
            {safeTotal.toLocaleString()}
          </span>
          <span>{percentText}</span>
        </div>
      )}

      {/* Thanh tiến trình */}
      <div className="relative w-full bg-gray-200 rounded-lg overflow-hidden shadow-inner">
        {/* Phần ánh sáng chạy toàn thanh */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute inset-y-0 w-1/12 bg-gradient-to-r from-transparent via-white/70 to-transparent blur-sm opacity-60 mix-blend-screen animate-sweepRight"></div>
        </div>

        {/* Thanh màu xanh theo tiến độ */}
        <div
          className={`relative text-white font-semibold flex items-center justify-center ${height} transition-all duration-500 ease-out`}
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, #2563eb, #06b6d4)",
            boxShadow: "0 0 12px rgba(59,130,246,0.45)",
          }}>
          {showPercent && (
            <span className="drop-shadow-sm z-10 select-none">
              {percentText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
