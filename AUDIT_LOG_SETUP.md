# Audit Log System Setup

## 🔧 Apply Database Migration

The `audit_logs` table needs to be created in your Supabase database.

### Method 1: Via Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard/project/kkvmqxbvbgucjggofidr
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `apply_audit_logs_migration.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify success — you should see "Success. No rows returned"

### Method 2: Via Supabase CLI (if Docker Desktop is running)

```bash
supabase db push
```

---

## ✅ Verify Installation

After applying the migration, refresh your app and navigate to any outlet workspace. You should see a new **Audit Log** tab in the navigation bar.

---

## 📝 How to Use

### Viewing Audit Logs

1. Navigate to any outlet workspace (e.g., `/admin/workspace/:outletId`)
2. Click the **Audit Log** tab
3. Use filters to narrow down by:
   - **Action**: Create, Update, Delete
   - **Entity Type**: product, category, order, etc.
   - **Search**: Search by entity ID, user ID, or entity type

### Logging Changes in Your Code

Import the `useAuditLog` hook in any component where you perform database writes:

```tsx
import { useAuditLog } from "@/hooks/useAuditLog";

function MyComponent() {
  const { log } = useAuditLog();

  const handleUpdate = async () => {
    const oldData = { name: "Old Name", price: 10000 };
    
    // Perform your database update
    await api.products.update(productId, { name: "New Name", price: 15000 });
    
    // Log the change
    await log({
      outlet_id: outletId,
      action: "update",
      entity_type: "product",
      entity_id: productId,
      old_data: oldData,
      new_data: { name: "New Name", price: 15000 }
    });
  };
}
```

**Important**: The `log()` function silently swallows errors, so a failed audit log write will never break your primary operation.

---

## 🔐 Permissions

Audit logs follow role-based access:

- **super_admin**: Can view all audit logs across all outlets
- **brand_admin**: Can view logs for all outlets in their brand
- **outlet_admin / manager**: Can view logs only for their assigned outlet
- **All authenticated users**: Can write audit logs

Audit logs are **immutable** — no one can update or delete them once created.

---

## 🎯 What's Included

### Files Created:

1. **Migration**: `supabase/migrations/20260523000004_create_audit_logs.sql`
2. **Hook**: `src/hooks/useAuditLog.ts`
3. **UI Component**: `src/pages/Admin/WorkspaceAuditLogTab.tsx`
4. **Integration**: Updated `OutletWorkspace.tsx` to include the Audit Log tab

### Features:

- ✅ Expandable rows showing before/after diffs
- ✅ Filters by action type and entity type
- ✅ Search functionality
- ✅ Color-coded actions (green=create, blue=update, red=delete)
- ✅ Automatic user tracking via `useAuth()`
- ✅ Role-based access control via RLS
- ✅ Immutable logs (no updates/deletes allowed)

---

## 🚀 Next Steps

To start tracking changes, add `useAuditLog()` calls after successful mutations in:

- `WorkspaceMenuTab.tsx` (product CRUD)
- `WorkspaceCategoriesTab.tsx` (category CRUD)
- `WorkspaceOrdersTab.tsx` (order status updates)
- `WorkspaceSettingsTab.tsx` (outlet settings updates)
- `BrandsTab.tsx` (brand CRUD)
- `UnitsDashboard.tsx` (outlet CRUD)

Example integration in `WorkspaceMenuTab.tsx`:

```tsx
const { log } = useAuditLog();

const handleSaveProduct = async (e: React.FormEvent) => {
  e.preventDefault();
  const oldData = editingProduct ? { ...editingProduct } : null;
  
  if (editingProduct) {
    await api.products.update(editingProduct.id, productForm);
    await log({
      outlet_id: outletId,
      action: "update",
      entity_type: "product",
      entity_id: editingProduct.id,
      old_data: oldData,
      new_data: productForm
    });
  } else {
    const newProduct = await api.products.create({ ...productForm, outlet_id: outletId });
    await log({
      outlet_id: outletId,
      action: "create",
      entity_type: "product",
      entity_id: newProduct.id,
      new_data: newProduct
    });
  }
};
```
