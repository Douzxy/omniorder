import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api, AuditLog, Category, Product } from "@/services/api";
import {
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Upload,
  Eye,
  X,
  Loader2,
} from "lucide-react";

interface WorkspaceAuditLogsTabProps {
  outletId: string;
  categories: Category[];
  products: Product[];
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

export default function WorkspaceAuditLogsTab({
  outletId,
  categories,
  products,
}: WorkspaceAuditLogsTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActor, setFilterActor] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const logData = await api.auditLogs.fetchByOutlet(outletId);
        setLogs(logData);

        // Fetch users to map user_id to email
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.access_token) {
            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`,
              {
                method: "GET",
                headers: { Authorization: `Bearer ${session.access_token}` },
              }
            );
            if (res.ok) {
              const data = await res.json();
              setUsers(data);
            }
          }
        } catch (err) {
          console.error("Gagal mengambil email pengguna:", err);
        }
      } catch (err) {
        console.error("Gagal mengambil log audit:", err);
      } finally {
        setLoading(false);
      }
    };

    if (outletId) {
      fetchData();
    }
  }, [outletId]);

  // Map user ID to email
  const getUserEmail = (userId: string | null) => {
    if (!userId) return "Sistem / Tamu";
    const user = users.find((u) => u.id === userId);
    return user ? user.email : `User (${userId.slice(0, 8)})`;
  };

  // Get human readable details of what changed
  const getDiffDetails = (log: AuditLog) => {
    const { action, entity_type, old_data, new_data } = log;

    if (action === "create") {
      if (entity_type === "product" && new_data) {
        return `Menambahkan produk baru "${new_data.name}" dengan harga Rp ${Number(new_data.price).toLocaleString("id-ID")}`;
      }
      if (entity_type === "category" && new_data) {
        return `Membuat kategori baru "${new_data.name}"`;
      }
      if (entity_type === "order" && new_data) {
        return `Menerima pesanan baru #${new_data.order_code || new_data.id.slice(0, 8)} dari ${new_data.customer_name}`;
      }
      return `Membuat entitas baru ${entity_type}`;
    }

    if (action === "delete") {
      if (entity_type === "product" && old_data) {
        return `Menghapus produk "${old_data.name}"`;
      }
      if (entity_type === "category" && old_data) {
        return `Menghapus kategori "${old_data.name}"`;
      }
      if (entity_type === "order" && old_data) {
        return `Menghapus pesanan #${old_data.order_code || old_data.id.slice(0, 8)}`;
      }
      return `Menghapus entitas ${entity_type}`;
    }

    if (action === "reorder") {
      if (entity_type === "product") {
        return "Mengubah urutan produk";
      }
      if (entity_type === "category") {
        return "Mengubah urutan kategori";
      }
      return `Mengubah urutan ${entity_type}`;
    }

    if (action === "bulk_import") {
      if (entity_type === "product") {
        const count = Array.isArray(new_data) ? new_data.length : 0;
        return `Melakukan impor massal ${count} produk via CSV`;
      }
      return `Melakukan impor bulk ${entity_type}`;
    }

    if (action === "update") {
      if (!old_data || !new_data) return `Memperbarui data ${entity_type}`;

      const diffs: string[] = [];

      const fieldLabels: Record<string, string> = {
        name: "Nama",
        price: "Harga",
        description: "Deskripsi",
        image_url: "Gambar",
        category_id: "Kategori",
        is_recommended: "Rekomendasi",
        is_available: "Tersedia",
        sort_order: "Urutan",
        status: "Status Pesanan",
        payment_status: "Pembayaran",
        total_amount: "Total Harga",
        delivery_address: "Alamat Pengiriman",
        delivery_note: "Catatan Pengiriman",
        table_count: "Jumlah Meja",
        is_dine_in_enabled: "Dine-in",
        is_takeaway_enabled: "Takeaway",
        is_delivery_enabled: "Delivery",
        is_tax_enabled: "Pajak Aktif",
        tax_percentage: "PPN",
        open_time: "Jam Buka",
        close_time: "Jam Tutup",
        logo_url: "Logo Outlet",
        slug: "Slug URL",
      };

      const formatValue = (key: string, val: any) => {
        if (val === null || val === undefined) return "—";
        if (typeof val === "boolean") return val ? "Ya" : "Tidak";
        if (key === "price" || key === "total_amount") {
          return `Rp ${Number(val).toLocaleString("id-ID")}`;
        }
        if (key === "category_id") {
          const cat = categories.find((c) => c.id === val);
          return cat ? cat.name : "Tanpa Kategori";
        }
        if (key === "status") {
          const labels: Record<string, string> = {
            pending: "Menunggu",
            preparing: "Diproses",
            completed: "Selesai",
            cancelled: "Batal",
          };
          return labels[val] || val;
        }
        if (key === "payment_status") {
          return val === "paid" ? "Lunas" : "Belum Lunas";
        }
        return String(val);
      };

      const allKeys = Array.from(
        new Set([...Object.keys(old_data), ...Object.keys(new_data)])
      );
      const excludedKeys = [
        "id",
        "created_at",
        "updated_at",
        "outlet_id",
        "user_id",
        "items",
        "brand_code",
      ];

      allKeys.forEach((key) => {
        if (excludedKeys.includes(key)) return;
        const oldVal = old_data[key];
        const newVal = new_data[key];

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          const label = fieldLabels[key] || key;
          const formattedOld = formatValue(key, oldVal);
          const formattedNew = formatValue(key, newVal);
          diffs.push(`${label}: ${formattedOld} ➔ ${formattedNew}`);
        }
      });

      if (diffs.length === 0) {
        if (entity_type === "product")
          return `Memperbarui detail produk "${new_data.name || old_data.name}"`;
        if (entity_type === "category")
          return `Memperbarui detail kategori "${new_data.name || old_data.name}"`;
        if (entity_type === "order")
          return `Memperbarui pesanan #${new_data.order_code || old_data.order_code || new_data.id.slice(0, 8)}`;
        return `Memperbarui data ${entity_type}`;
      }

      return diffs;
    };

    return `Melakukan aksi ${action} pada ${entity_type}`;
  };

  // Get action icon and color
  const getActionConfig = (action: string) => {
    switch (action) {
      case "create":
        return {
          icon: Plus,
          color: "bg-emerald-50 text-emerald-600 border-emerald-200",
          badge: "bg-emerald-100 text-emerald-800",
          label: "Tambah",
        };
      case "update":
        return {
          icon: Edit2,
          color: "bg-blue-50 text-blue-600 border-blue-200",
          badge: "bg-blue-100 text-blue-800",
          label: "Perbarui",
        };
      case "delete":
        return {
          icon: Trash2,
          color: "bg-rose-50 text-rose-600 border-rose-200",
          badge: "bg-rose-100 text-rose-800",
          label: "Hapus",
        };
      case "reorder":
        return {
          icon: RefreshCw,
          color: "bg-violet-50 text-violet-600 border-violet-200",
          badge: "bg-violet-100 text-violet-800",
          label: "Reorder",
        };
      case "bulk_import":
        return {
          icon: Upload,
          color: "bg-amber-50 text-amber-600 border-amber-200",
          badge: "bg-amber-100 text-amber-800",
          label: "Import",
        };
      default:
        return {
          icon: ShieldCheck,
          color: "bg-neutral-50 text-neutral-600 border-neutral-200",
          badge: "bg-neutral-100 text-neutral-800",
          label: action,
        };
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const actorEmail = getUserEmail(log.user_id).toLowerCase();
    const actionDetails = getDiffDetails(log);
    const detailsText = Array.isArray(actionDetails)
      ? actionDetails.join(" ")
      : actionDetails;
    const matchesSearch =
      detailsText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actorEmail.includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesActor =
      filterActor === "all" || log.user_id === filterActor;
    const matchesAction =
      filterAction === "all" || log.action === filterAction;
    const matchesEntity =
      filterEntity === "all" || log.entity_type === filterEntity;

    return matchesSearch && matchesActor && matchesAction && matchesEntity;
  });

  // Extract unique actors for filter dropdown
  const uniqueActors = Array.from(new Set(logs.map((log) => log.user_id)));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all"
            />
          </div>

          {/* Actor Filter */}
          <div className="relative min-w-[160px]">
            <select
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all cursor-pointer bg-white"
            >
              <option value="all">Semua Aktor</option>
              {uniqueActors.map((actorId) => (
                <option key={actorId || "null"} value={actorId || ""}>
                  {getUserEmail(actorId)}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all cursor-pointer bg-white"
            >
              <option value="all">Semua Aksi</option>
              <option value="create">Tambah</option>
              <option value="update">Perbarui</option>
              <option value="delete">Hapus</option>
              <option value="reorder">Reorder</option>
              <option value="bulk_import">Import</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all cursor-pointer bg-white"
            >
              <option value="all">Semua Entitas</option>
              <option value="product">Produk</option>
              <option value="category">Kategori</option>
              <option value="order">Pesanan</option>
              <option value="settings">Pengaturan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-xl">
          <ShieldCheck className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500 font-medium">
            Tidak ada log aktivitas yang cocok
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 md:p-6">
          <div className="relative border-l border-neutral-200 pl-6 md:pl-8 space-y-6">
            {filteredLogs.map((log) => {
              const config = getActionConfig(log.action);
              const Icon = config.icon;
              const details = getDiffDetails(log);

              return (
                <div key={log.id} className="relative group">
                  {/* Icon Node */}
                  <div
                    className={`absolute -left-10 md:-left-12 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${config.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Log Content Card */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 p-3.5 rounded-lg border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50 transition-all">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Actor Email */}
                        <span className="text-xs font-semibold text-neutral-800">
                          {getUserEmail(log.user_id)}
                        </span>
                        <span className="text-[10px] text-neutral-400">•</span>
                        {/* Event Date & Time */}
                        <span className="text-[10px] text-neutral-500">
                          {new Date(log.created_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                        <span className="text-[10px] text-neutral-400">•</span>
                        {/* Action Badge */}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${config.badge}`}
                        >
                          {config.label}
                        </span>
                        {/* Entity Type Label */}
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded capitalize">
                          {log.entity_type === "settings"
                            ? "Pengaturan"
                            : log.entity_type}
                        </span>
                      </div>

                      {/* Details of Change */}
                      <div className="text-xs text-neutral-600 leading-relaxed font-normal">
                        {Array.isArray(details) ? (
                          <ul className="list-disc pl-4 space-y-1 mt-1 text-neutral-700">
                            {details.map((diff, index) => (
                              <li key={index}>{diff}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{details}</p>
                        )}
                      </div>
                    </div>

                    {/* View Details Button */}
                    {(log.old_data || log.new_data) && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="self-start md:self-center flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-neutral-600 hover:text-brand hover:bg-brand/5 rounded border border-neutral-200 hover:border-brand/20 cursor-pointer transition-all"
                      >
                        <Eye className="w-3 h-3" /> Lihat JSON
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JSON Details Inspector Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-2xl p-5 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand" /> Inspektur Data
                  JSON
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  ID Aktivitas: {selectedLog.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-4.5 h-4.5 text-neutral-500" />
              </button>
            </div>

            {/* Modal Content - Comparison View */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Data */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Data Lama (Sebelum)
                  </span>
                  <div className="bg-rose-50/30 border border-rose-100 rounded-lg p-3 overflow-x-auto max-h-[45vh]">
                    {selectedLog.old_data ? (
                      <pre className="text-[10px] font-mono text-rose-800 leading-tight">
                        {JSON.stringify(selectedLog.old_data, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-400 italic">
                        Tidak ada data
                      </span>
                    )}
                  </div>
                </div>

                {/* New Data */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Data Baru (Sesudah)
                  </span>
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg p-3 overflow-x-auto max-h-[45vh]">
                    {selectedLog.new_data ? (
                      <pre className="text-[10px] font-mono text-emerald-800 leading-tight">
                        {JSON.stringify(selectedLog.new_data, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-400 italic">
                        Tidak ada data (Dihapus)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg cursor-pointer transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
