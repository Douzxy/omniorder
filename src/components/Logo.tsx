import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const dimensions = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto",
  };
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-2 cursor-pointer transition-transform ${className}`}>
      <img src="/icon.png" alt="OmniOrder Logo" className={`${dimensions[size]} object-contain`} />
      <span className={`font-black tracking-tight text-neutral-900 ${textSizes[size]}`}>
        Omni<span className="text-[#f97316]">Order</span>
      </span>
    </div>
  );
}
