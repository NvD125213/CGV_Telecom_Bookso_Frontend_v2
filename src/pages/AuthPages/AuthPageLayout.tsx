import React from "react";
import DarkVeil from "../../components/DarkVeil";
import TrueFocus from "../../components/TrueFocus";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white z-1 h-screen box-border">
      <div className="relative flex flex-col justify-center w-full h-full lg:flex-row dark:bg-gray-900 p-6 sm:p-0 box-border">
        {children}
        <div className="hidden h-full lg:block lg:w-1/2 p-4">
          <div className="relative flex items-end justify-center w-full h-full dark:bg-white/5 bg-black rounded-2xl overflow-hidden pb-10">
            <div className="absolute inset-0 z-0">
              <DarkVeil
                hueShift={30}
                speed={1.5}
                scanlineIntensity={0.1}
                warpAmount={5}
              />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 z-20 text-white transform">
              <TrueFocus
                words={[
                  "https://bookso.cgvtelecom.vn/Logo/Logo_company_darkmode.png",
                  ["Công nghệ", "Viễn thông", "Toàn cầu", "3CX", "AutoCall"],
                ]}
                manualMode={false}
                blurAmount={5}
                borderColor="#06b6d4"
                glowColor="rgba(6, 182, 212, 0.6)"
                animationDuration={0.5}
                pauseBetweenAnimations={5}
                rotationIntervalForRotatingText={5000} // 5s cho mỗi chữ trong RotatingText
              />
            </div>
            {/* <img
              src={"/Logo/AI_Call_Center.png"}
              alt="AI Call Center"
              className="relative z-10 w-[120%] max-w-none mr-8"
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
