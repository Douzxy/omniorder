import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 p-4">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-lg font-black text-neutral-850">{value}</div>
      <div className="text-[10px] text-neutral-400 font-bold mt-0.5">{label}</div>
    </div>
  );
}
