import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const dimensions = {
    sm: "h-6 w-auto",
    md: "h-9 w-auto",
    lg: "h-14 w-auto",
  };

  return (
    <div className={`flex items-center gap-2 cursor-pointer ${className}`}>
      {/* Premium SVG Logo Icon */}
      <svg
        className={`${dimensions[size]} text-brand`}
        viewBox="0 0 300 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Animated Gradient Icon */}
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-color, #2563eb)" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        
        {/* Abstract double ring "O" with fork/knife inside */}
        <circle cx="40" cy="40" r="30" stroke="url(#logoGrad)" strokeWidth="6" />
        <circle cx="40" cy="40" r="18" stroke="url(#logoGrad)" strokeWidth="2" strokeDasharray="4 2" />
        
        {/* Inner stylized fork and spoon */}
        <path
          d="M36 30V44M34 30H38M34 33H38"
          stroke="url(#logoGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M44 30C44 35 46 37 46 44M44 44H46"
          stroke="url(#logoGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Brand Text */}
        <text
          x="88"
          y="48"
          fill="#171717"
          fontSize="28"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.05em"
        >
          omni
          <tspan fill="url(#logoGrad)" fontWeight="900">
            order
          </tspan>
        </text>
        
        <circle cx="218" cy="28" r="4" fill="#10b981" />
      </svg>
    </div>
  );
}
