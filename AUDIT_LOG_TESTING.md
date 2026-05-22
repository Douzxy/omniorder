# 🧪 Audit Log Testing Guide

## ✅ Prerequisites

1. **Apply the migration** first:
   - Go to https://supabase.com/dashboard/project/kkvmqxbvbgucjggofidr/sql
   - Run the SQL from `apply_audit_logs_migration.sql`
   - Verify success

2. **Login credentials**:
   - Email: `superadmin@omniorder.com`
   - Password: `password`

---

## 📋 Test Scenarios

### 1. Product Operations (Menu Tab)

**Test Create Product:**
1. Navigate to any outlet workspace
2. Go to **Menu Produk** tab
3. Click **Tambah Produk**
4. Fill in product details and save
5. Go to **Audit Log** tab
6. ✅ Verify: New entry with action "Buat", entity_type "product"
7. Click the row to expand
8. ✅ Verify: `new_data` shows the created product details

**Test Update Product:**
1. In **Menu Produk** tab, click edit icon on any product
2. Change name, price, or description
3. Save changes
4. Go to **Audit Log** tab
5. ✅ Verify: New entry with action "Ubah", entity_type "product"
6. Expand the row
7. ✅ Verify: Changed fields are highlighted (red = old, green = new)

**Test Toggle Availability:**
1. In **Menu Produk** tab, click the availability toggle on any product
2. Go to **Audit Log** tab
3. ✅ Verify: New entry showing `is_available` changed from true→false or false→true

**Test Delete Product:**
1. In **Menu Produk** tab, click delete icon on any product
2. Confirm deletion
3. Go to **Audit Log** tab
4. ✅ Verify: New entry with action "Hapus", entity_type "product"
5. Expand the row
6. ✅ Verify: `old_data` shows the deleted product details

---

### 2. Category Operations (Kategori Tab)

**Test Create Category:**
1. Go to **Kategori** tab
2. Click **Tambah Kategori**
3. Enter category name and save
4. Go to **Audit Log** tab
5. ✅ Verify: New entry with action "Buat", entity_type "category"

**Test Update Category:**
1. In **Kategori** tab, click edit icon on any category
2. Change the name
3. Save changes
4. Go to **Audit Log** tab
5. ✅ Verify: New entry with action "Ubah", entity_type "category"
6. ✅ Verify: Diff shows old name → new name

**Test Delete Category:**
1. In **Kategori** tab, click delete icon on any category
2. Confirm deletion
3. Go to **Audit Log** tab
4. ✅ Verify: New entry with action "Hapus", entity_type "category"

---

### 3. Order Operations (Pesanan Masuk Tab)

**Test Update Order Status:**
1. Go to **Pesanan Masuk** tab
2. Click on any order to view details
3. Change status (e.g., pending → preparing → completed)
4. Go to **Audit Log** tab
5. ✅ Verify: New entry with action "Ubah", entity_type "order"
6. ✅ Verify: Diff shows status change

**Test Confirm Cash Payment:**
1. In **Pesanan Masuk** tab, find an order with payment_status "pending"
2. Click **Konfirmasi Bayar** button
3. Go to **Audit Log** tab
4. ✅ Verify: New entry showing both `payment_status` and `status` changed

---

### 4. Outlet Settings (Pengaturan Tab)

**Test Update Outlet Settings:**
1. Go to **Pengaturan** tab
2. Change any settings:
   - Outlet name
   - Table count
   - Opening hours
   - Tax settings
   - Order modes (dine-in, takeaway, delivery)
3. Click **Simpan Pengaturan**
4. Go to **Audit Log** tab
5. ✅ Verify: New entry with action "Ubah", entity_type "outlet"
6. Expand the row
7. ✅ Verify: All changed fields are highlighted in the diff

---

### 5. Audit Log UI Features

**Test Filters:**
1. Go to **Audit Log** tab
2. Test **Action filter**:
   - Select "Buat" → only create actions shown
   - Select "Ubah" → only update actions shown
   - Select "Hapus" → only delete actions shown
3. Test **Entity filter**:
   - Select "product" → only product logs shown
   - Select "category" → only category logs shown
   - Select "order" → only order logs shown
4. Test **Search**:
   - Enter a product ID → matching logs shown
   - Enter entity type → matching logs shown

**Test Expandable Rows:**
1. Click any log entry row
2. ✅ Verify: Row expands to show diff
3. Click again
4. ✅ Verify: Row collapses

**Test Refresh:**
1. Click **Refresh** button
2. ✅ Verify: Loading spinner appears
3. ✅ Verify: Latest logs are fetched

---

### 6. Role-Based Access (RLS Testing)

**Test as Super Admin:**
1. Login as `superadmin@omniorder.com`
2. Navigate to any outlet workspace
3. Go to **Audit Log** tab
4. ✅ Verify: Can see all logs for that outlet

**Test as Brand Admin (if available):**
1. Login as a brand admin user
2. Navigate to an outlet in their brand
3. Go to **Audit Log** tab
4. ✅ Verify: Can see logs for outlets in their brand only

**Test as Manager (if available):**
1. Login as a manager user
2. Navigate to their assigned outlet
3. Go to **Audit Log** tab
4. ✅ Verify: Can see logs for their outlet only

---

### 7. Edge Cases

**Test Empty State:**
1. Navigate to a newly created outlet (no activity yet)
2. Go to **Audit Log** tab
3. ✅ Verify: Shows "Belum ada log aktivitas" message

**Test Large Dataset:**
1. Perform 20+ operations (create/update/delete products)
2. Go to **Audit Log** tab
3. ✅ Verify: All logs load correctly
4. ✅ Verify: Scrolling works smoothly

**Test Concurrent Operations:**
1. Open two browser tabs with the same outlet
2. In tab 1: Create a product
3. In tab 2: Go to Audit Log tab and click Refresh
4. ✅ Verify: New log appears

---

## 🎯 Expected Results Summary

After completing all tests, the Audit Log tab should show:

- ✅ All CRUD operations are logged
- ✅ User ID is captured for each action
- ✅ Timestamps are accurate
- ✅ Diffs show only changed fields for updates
- ✅ Filters work correctly
- ✅ Search works correctly
- ✅ Expandable rows work smoothly
- ✅ Color coding is correct (green=create, blue=update, red=delete)
- ✅ RLS permissions are enforced

---

## 🐛 Troubleshooting

**If no logs appear:**
1. Check browser console for errors
2. Verify migration was applied successfully
3. Check Supabase RLS policies are active
4. Verify user is authenticated

**If logs appear but diffs are empty:**
1. Check that `old_data` and `new_data` are being captured
2. Verify JSONB columns are not null

**If permission errors occur:**
1. Check user's role in `profiles` table
2. Verify RLS policies match user's role
3. Check `outlet_id` matches user's assigned outlet

---

## 📊 Test Checklist

- [ ] Product: Create
- [ ] Product: Update
- [ ] Product: Toggle availability
- [ ] Product: Delete
- [ ] Category: Create
- [ ] Category: Update
- [ ] Category: Delete
- [ ] Order: Update status
- [ ] Order: Confirm payment
- [ ] Outlet: Update settings
- [ ] Filter: By action
- [ ] Filter: By entity type
- [ ] Search: By ID/type
- [ ] UI: Expand/collapse rows
- [ ] UI: Refresh button
- [ ] RLS: Super admin access
- [ ] Edge case: Empty state
- [ ] Edge case: Large dataset

---

## 📝 Notes

- Audit logs are **immutable** — they cannot be edited or deleted via the UI
- Failed audit log writes are silently swallowed to never block primary operations
- Logs are scoped by `outlet_id` for performance
- Maximum 500 most recent logs are fetched per outlet
