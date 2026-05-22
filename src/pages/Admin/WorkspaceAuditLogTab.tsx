import React, { useEffect, useState, useCallback } from "react";
import { api, AuditLog } from "@/services/api";
import { useToast } from "@/hooks/useToast";
import {
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Tag,
  Activity,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_STYLE: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
};

const ACTION_LABEL: Record<string, string> = {
  create: "Buat",
  update: "Ubah",
  delete: "Hapus",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function JsonDiff({
  oldData,
  newData,
}: {
  oldData: any;
  newData: any;
}) {
  if (!oldData && !newData) return <span className="text-neutral-400 text-xs">—</span>;

  // For creates/deletes show the single snapshot
  if (!oldData) {
    return (
      <pre className="text-xs bg-green-50 text-green-800 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
        {JSON.stringify(newData, null, 2)}
      </pre>
    );
  }
  if (!newData) {
    return (
      <pre className="text-xs bg-red-50 text-red-800 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
        {JSON.stringify(oldData, null, 2)}
      </pre>
    );
  }

  // For updates, highlight changed keys
  const allKeys = Array.from(
    new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]),
  );
  const changedKeys = allKeys.filter(
    (k) => JSON.stringify(oldData?.[k]) !== JSON.stringify(newData?.[k]),
  );

  if (changedKeys.length === 0) {
    return <span className="text-neutral-400 text-xs">Tidak ada perubahan</span>;
  }

  return (
    <div className="space-y-1">
      {changedKeys.map((key) => (
        <div key={key} className="text-xs rounded overflow-hidden border border-neutral-200">
          <div className="bg-neutral-100 px-2 py-0.5 font-mono font-semibold text-neutral-600">
            {key}
          </div>
          <div className="grid grid-cols-2 divide-x divide-neutral-200">
            <div className="bg-red-50 px-2 py-1 text-red-700 font-mono break-all">
              {JSON.stringify(oldData?.[key])}
            </div>
            <div className="bg-green-50 px-2 py-1 text-green-700 font-mono break-all">
              {JSON.stringify(newData?.[key])}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function AuditLogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-3 py-2.5 text-neutral-400">
          {expanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </td>
        <td className="px-3 py-2.5 text-xs text-neutral-500 whitespace-nowrap">
          {fmtDate(log.created_at)}
        </td>
        <td className="px-3 py-2.5">
          <span
            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_STYLE[log.action] ?? "bg-neutral-100 text-neutral-600"}`}
          >
            {ACTION_LABEL[log.action] ?? log.action}
          </span>
        </td>
        <td className="px-3 py-2.5 text-xs font-mono text-neutral-700">
          {log.entity_type}
        </td>
        <td className="px-3 py-2.5 text-xs text-neutral-500 font-mono truncate max-w-[120px]">
          {log.entity_id ?? "—"}
        </td>
        <td className="px-3 py-2.5 text-xs text-neutral-500 font-mono truncate max-w-[120px]">
          {log.user_id ?? "—"}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-neutral-50 border-b border-neutral-100">
          <td colSpan={6} className="px-4 py-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Perubahan Data
              </p>
              <JsonDiff oldData={log.old_data} newData={log.new_data} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  outletId: string;
}

const ENTITY_TYPES = [
  "semua",
  "product",
  "category",
  "order",
  "outlet",
  "brand",
  "modifier",
  "modifier_option",
];

const ACTIONS = ["semua", "create", "update", "delete"];

export default function WorkspaceAuditLogTab({ outletId }: Props) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("semua");
  const [filterEntity, setFilterEntity] = useState("semua");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.auditLogs.fetchByOutlet(outletId, 500);
      setLogs(data);
    } catch (err: any) {
      toast("Gagal memuat audit log: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [outletId]); // Remove toast from dependencies

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ─── Filtering ───
  const filtered = logs.filter((l) => {
    if (filterAction !== "semua" && l.action !== filterAction) return false;
    if (filterEntity !== "semua" && l.entity_type !== filterEntity) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.entity_type.toLowerCase().includes(q) ||
        (l.entity_id ?? "").toLowerCase().includes(q) ||
        (l.user_id ?? "").toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-neutral-700">
          <Activity size={18} />
          <h2 className="font-semibold text-base">Audit Log</h2>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
            {filtered.length} entri
          </span>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Cari entity, user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        {/* Action filter */}
        <div className="flex items-center gap-1.5">
          <Tag size={13} className="text-neutral-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a === "semua" ? "Semua Aksi" : ACTION_LABEL[a] ?? a}
              </option>
            ))}
          </select>
        </div>

        {/* Entity filter */}
        <div className="flex items-center gap-1.5">
          <User size={13} className="text-neutral-400" />
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "semua" ? "Semua Entitas" : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-400 gap-2">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Memuat...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2">
            <Clock size={32} className="opacity-30" />
            <p className="text-sm">Belum ada log aktivitas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                  <th className="px-3 py-2 w-6" />
                  <th className="px-3 py-2 text-xs font-semibold text-neutral-500 whitespace-nowrap">
                    Waktu
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-neutral-500">
                    Aksi
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-neutral-500">
                    Entitas
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-neutral-500">
                    ID Entitas
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-neutral-500">
                    User ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <AuditLogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-400 text-center">
        Menampilkan {filtered.length} dari {logs.length} entri terbaru. Klik baris untuk melihat detail perubahan.
      </p>
    </div>
  );
}
