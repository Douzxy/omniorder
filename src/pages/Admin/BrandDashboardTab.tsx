import { Store, Users, TrendingUp } from "lucide-react";

interface BrandDashboardTabProps {
  brandName: string;
  outletCount: number;
  staffCount: number;
}

export default function BrandDashboardTab({ brandName, outletCount, staffCount }: BrandDashboardTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Performa {brandName}</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Ringkasan performa untuk seluruh outlet.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Outlet</p>
            <p className="font-extrabold text-xl text-neutral-900">{outletCount}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Staf</p>
            <p className="font-extrabold text-xl text-neutral-900">{staffCount}</p>
          </div>
        </div>
      </div>

      <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 border-dashed">
        <TrendingUp className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-neutral-600">Integrasi Analitik Penjualan</p>
        <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1">Laporan omzet mingguan seluruh outlet akan hadir di pembaruan selanjutnya.</p>
      </div>
    </div>
  );
}
