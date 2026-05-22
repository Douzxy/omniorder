import { Brand } from "@/services/api";
import {
  UserPlus,
  Users,
  Loader2,
  ShieldCheck,
  KeyRound,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

interface Profile {
  id: string;
  outlet_id: string | null;
  role: string;
  brand_code?: string;
}

interface UserRecord {
  id: string;
  email: string;
  profile: Profile | null;
}

interface UsersTabProps {
  users: UserRecord[];
  brands: Brand[];
  loading: boolean;
  currentUserId: string | undefined;
  onAddUser: () => void;
  onEditUser: (user: UserRecord) => void;
  onDeleteUser: (userId: string) => void;
  onResetPassword: (user: UserRecord) => void;
}

export default function UsersTab({
  users,
  brands,
  loading,
  currentUserId,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onResetPassword,
}: UsersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">
            Manajemen Akun
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kelola akun admin untuk setiap brand.
          </p>
        </div>
        <button
          onClick={onAddUser}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Tambah Akun
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
          {users.filter(
            (u) =>
              u.profile?.role === "brand_admin" ||
              u.profile?.role === "admin",
          ).length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">
                Belum ada admin brand
              </p>
            </div>
          ) : (
            users
              .filter(
                (u) =>
                  u.profile?.role === "brand_admin" ||
                  u.profile?.role === "admin",
              )
              .map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand/5 rounded-full flex items-center justify-center font-bold text-sm text-brand">
                        {u.email?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800 flex items-center gap-1.5">
                          {u.email}
                          {isSelf && (
                            <span className="text-[10px] bg-brand/5 text-brand/70 px-1.5 py-0.5 rounded font-semibold">
                              Anda
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          Admin Brand ·{" "}
                          {brands.find(
                            (b) => b.code === u.profile?.brand_code,
                          )?.name ??
                            u.profile?.brand_code ??
                            "—"}
                        </p>
                      </div>
                    </div>
                    {!isSelf && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onResetPassword(u)}
                          className="px-2 py-1 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => onEditUser(u)}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 cursor-pointer transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}
