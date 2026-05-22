interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${className}`}>
      {children}
    </span>
  );
}
