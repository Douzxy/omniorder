import { useCallback } from "react";
import { api, AuditLog } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface LogParams {
  outlet_id: string;
  action: "create" | "update" | "delete" | "reorder" | "bulk_import";
  entity_type: string;
  entity_id?: string | null;
  old_data?: any;
  new_data?: any;
}

/**
 * useAuditLog — lightweight hook for writing audit log entries.
 *
 * Usage:
 *   const { log } = useAuditLog();
 *   await log({ outlet_id, action: "update", entity_type: "product", entity_id: id, old_data, new_data });
 *
 * Failures are silently swallowed so they never block the primary operation.
 */
export function useAuditLog() {
  const { user } = useAuth();

  const log = useCallback(
    async (params: LogParams): Promise<void> => {
      try {
        const payload: Partial<AuditLog> = {
          outlet_id: params.outlet_id,
          user_id: user?.id ?? null,
          action: params.action,
          entity_type: params.entity_type,
          entity_id: params.entity_id ?? null,
          old_data: params.old_data ?? null,
          new_data: params.new_data ?? null,
        };
        await api.auditLogs.create(payload);
      } catch {
        // Audit log failures must never break the primary operation
      }
    },
    [user],
  );

  return { log };
}
