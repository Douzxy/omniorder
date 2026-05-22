import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brand } from "@/services/api";
import { StatCard } from "@/components/ui";
import {
  Store,
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Loader2,
  ShieldCheck,
  Plus,
} from "lucide-react";

interface Outlet {
  id: string;
  name: string;
  slug: string;
  brand_code: string;
  logo_url: string;
  brand_color: string;
  table_count: number;
}

interface UserRecord {
  id: string;
  email: string;
  profile: {
    id: string;
    outlet_id: string | null;
    role: string;
    brand_code?: string;
  } | null;
}

interface BrandsTabProps {
  brands: Brand[];
  outlets: Outlet[];
  users: UserRecord[];
  loading: boolean;
  onRefresh: () => void;
  onAddBrand: () => void;
  onEditBrand: (brand: Brand) => void;
  onDeleteBrand: (brand: {
    type: "brand" | "user";
    id: string;
    label: string;
    code: string;
  }) => void;
  onNavigateOutlet: (code: string) => void;
  onOpenOutlet: (id: string) => void;
}

export default function BrandsTab({
  brands,
  outlets,
  users,
  loading,
  onRefresh,
  onAddBrand,
  onEditBrand,
  onDeleteBrand,
  onNavigateOutlet,
  onOpenOutlet,
}: BrandsTabProps) {
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  const toggleBrand = (brandCode: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brandCode)) {
        next.delete(brandCode);
      } else {
        next.add(brandCode);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">
            Dashboard Super Admin
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kelola seluruh ekosistem OmniOrder.
          </p>
        </div>
        <button
          onClick={onAddBrand}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-all cursor-pointer shadow-md shadow-brand/20"
        >
          <Plus className="w-4 h-4" /> Tambah Brand
        </button>
      </div>

      {/* Dashboard Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            label="Total Brand"
            value={brands.length}
            icon={Building2}
            color="bg-brand/10 text-brand"
          />
          <StatCard
            label="Total Outlet"
            value={outlets.length}
            icon={Store}
            color="bg-indigo-50 text-indigo-500"
          />
          <StatCard
            label="Total Akun Aktif"
            value={users.length}
            icon={Users}
            color="bg-emerald-50 text-emerald-500"
          />
        </div>
      )}

      <div className="pt-2">
        <h2 className="text-sm font-bold text-neutral-800 mb-3">
          Daftar Brand
        </h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
            <Building2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">
              Belum ada brand terdaftar
            </p>
            <button
              onClick={onAddBrand}
              className="mt-3 text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              + Tambah brand pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {brands.map((brand) => {
              const brandOutlets = outlets.filter(
                (o) => o.brand_code === brand.code,
              );
              return (
                <div
                  key={brand.id}
                  className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
                >
                  {/* Brand header */}
                  <div
                    className="flex items-center justify-between px-4 py-2 border-b border-neutral-100 cursor-pointer select-none"
                    onClick={() => toggleBrand(brand.code)}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBrand(brand.code);
                        }}
                        className="p-0.5 hover:bg-neutral-100 rounded text-neutral-400 cursor-pointer"
                      >
                        {expandedBrands.has(brand.code) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{ background: brand.brand_color }}
                      >
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-neutral-900">
                          {brand.name}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {brand.code} · {brandOutlets.length} outlet
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onNavigateOutlet(brand.code)}
                        className="px-3 py-1.5 text-xs font-semibold bg-brand/5 rounded-lg hover:bg-brand/10 text-brand cursor-pointer transition-all"
                      >
                        Kelola Outlet
                      </button>
                      <button
                        onClick={() => onEditBrand(brand)}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          onDeleteBrand({
                            type: "brand" as const,
                            id: brand.id,
                            label: brand.name,
                            code: brand.code,
                          })
                        }
                        className="p-1.5 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-red-500 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Outlets list under brand */}
                  {expandedBrands.has(brand.code) && (
                    <div className="divide-y divide-neutral-50">
                      {brandOutlets.map((outlet) => {
                        const managerProfile = users.find(
                          (u) => u.profile?.outlet_id === outlet.id,
                        );
                        return (
                          <div
                            key={outlet.id}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-6 rounded border border-neutral-200 overflow-hidden bg-neutral-50 flex-shrink-0">
                                {outlet.logo_url ? (
                                  <img
                                    src={outlet.logo_url}
                                    alt={outlet.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Store className="w-3 h-3 text-neutral-400 m-auto mt-1" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-800">
                                  {outlet.name}
                                </p>
                                <p className="text-[10px] text-neutral-400">
                                  {outlet.slug} · {outlet.table_count} meja ·{" "}
                                  {managerProfile
                                    ? managerProfile.email
                                    : "Belum ada manager"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => onOpenOutlet(outlet.id)}
                              className="text-[11px] font-semibold text-brand hover:text-brand hover:underline cursor-pointer transition-all"
                            >
                              Buka →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
