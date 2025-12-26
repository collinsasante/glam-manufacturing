# API Route Field Mapping Guide

## Overview
This guide shows how to fix the remaining API routes to match actual Airtable field names.

---

## ✅ COMPLETED: Deliveries

**Validation Schema** ([lib/validations.ts](lib/validations.ts:60-68)):
```typescript
export const deliverySchema = z.object({
  deliveryId: z.string().optional(),
  customer: z.string().min(1, 'Customer name is required'),
  totalStops: z.number().optional(),
  rider: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled']).optional(),
  notes: z.string().optional(),
});
```

**Field Mapping**:
- `deliveryId` → `'Delivery ID'`
- `customer` → `'Customer'`
- `totalStops` → `'Total Stops'`
- `rider` → `'Rider'` (stored as array: `[rider]`)
- `date` → `'Date'`
- `status` → `'Status'`
- `notes` → `'Notes'`

**Sort Field**: `'Date'`

---

## ⏳ TODO: Finished Goods

**Current Airtable Fields** (from [app/inventory/finished-goods/page.tsx](app/inventory/finished-goods/page.tsx)):
- `'Product Name'`
- `'Pack Size/Notes'`
- `'Available Quantity'`
- `'Price'`
- `'Status'`

**Steps**:
1. Keep current validation schema (it's already correct for finished goods)
2. Update API routes to use these actual field names (not SKU, sellingPrice, costPrice)
3. Update sort field in GET route

**Files to update**:
- [app/api/finished-goods/route.ts](app/api/finished-goods/route.ts)
- [app/api/finished-goods/[id]/route.ts](app/api/finished-goods/[id]/route.ts)

---

## ⏳ TODO: Raw Materials

**Current Airtable Fields** (from [app/inventory/raw-materials/page.tsx](app/inventory/raw-materials/page.tsx)):
- `'Material Name'`
- `'Category'`
- `'Supplier'` (link)
- `'Unit Cost'`
- `'Current Stock'`
- `'Unit'`
- `'Reorder Level'`
- `'Warehouse'`

**Steps**:
1. Keep current validation schema
2. Update API routes field mappings
3. Update sort field to `'Material Name'`

**Files to update**:
- [app/api/raw-materials/route.ts](app/api/raw-materials/route.ts)
- [app/api/raw-materials/[id]/route.ts](app/api/raw-materials/[id]/route.ts)

---

## ⏳ TODO: Stock Movement

**Current Airtable Fields** (from [app/inventory/stock-movement/page.tsx](app/inventory/stock-movement/page.tsx)):
- `'Material'` (link)
- `'Movement Type'` (not `'Transaction Type'`)
- `'Quantity'`
- `'Reference'` (not `'reason'`)
- `'From'`
- `'To'`
- `'Date'`

**Steps**:
1. Update validation schema to use `movementType` and `reference` instead of `transactionType` and `reason`
2. Update API routes field mappings
3. Update sort field to `'Date'`

**Files to update**:
- [lib/validations.ts](lib/validations.ts:34-43) - Update schema
- [app/api/stock-movement/route.ts](app/api/stock-movement/route.ts)
- [app/api/stock-movement/[id]/route.ts](app/api/stock-movement/[id]/route.ts)

---

## ⏳ TODO: Stock Transfer

**Current Airtable Fields** (from [app/inventory/stock-transfer/page.tsx](app/inventory/stock-transfer/page.tsx)):
- `'Batch Number'`
- `'Material'` (link)
- `'Quantity Transferred'` (not just `'Quantity'`)
- `'From Warehouse'` (link)
- `'To Warehouse'` (link)
- `'Date'`
- `'Remarks'`
- `'Status'`

**Steps**:
1. Validation schema already updated ✅ (uses `quantityTransferred`)
2. Update API routes to use `'Quantity Transferred'` instead of `'Quantity'`
3. Add `'Batch Number'` field
4. Update sort field to `'Date'`

**Files to update**:
- [app/api/stock-transfer/route.ts](app/api/stock-transfer/route.ts)
- [app/api/stock-transfer/[id]/route.ts](app/api/stock-transfer/[id]/route.ts)

---

## ⏳ TODO: Manufacturing

**Current Airtable Fields** (from [app/manufacturing/page.tsx](app/manufacturing/page.tsx)):
- `'Manufacturing ID'`
- `'Product'` (link)
- `'Quantity'`
- `'Production Line'`
- `'Created on'` (not `'Start Date'` or `'Due Date'`)
- `'Status'`

**Steps**:
1. Validation schema already updated ✅ (uses correct field names)
2. Update API routes field mappings
3. Remove fields that don't exist (`batchNumber`, `productName`, `rawMaterialsUsed`)
4. Update sort field to `'Created on'`

**Files to update**:
- [app/api/manufacturing/route.ts](app/api/manufacturing/route.ts)
- [app/api/manufacturing/[id]/route.ts](app/api/manufacturing/[id]/route.ts)

---

## Pattern for Updating Each Route

### 1. Update POST Handler
Find the `create()` call and update field names:
```typescript
const createdRecords = await base('TableName').create([
  {
    fields: {
      'Actual Airtable Field': validatedData.schemaField,
      // ...
    },
  },
]);
```

### 2. Update GET Handler (List)
Update the `.map()` transformation:
```typescript
const items = records.map((record) => ({
  id: record.id,
  fieldName: record.fields['Actual Airtable Field'] || defaultValue,
  // ...
}));
```

### 3. Update GET Handler (Single)
Same pattern as above for single record.

### 4. Update PATCH Handler
Update both the field building section AND the response transformation.

### 5. Update Sort Field
```typescript
.select({
  sort: [{ field: 'Actual Field Name', direction: 'desc' }],
})
```

---

## Quick Test Command

After updating each route group:
```bash
npm run build 2>&1 | grep -A 3 "Type error" | head -20
```

This will show you the next field mismatch to fix.

---

## Final Checklist

- [ ] Finished Goods routes updated
- [ ] Raw Materials routes updated
- [ ] Stock Movement routes updated
- [ ] Stock Transfer routes updated
- [ ] Manufacturing routes updated
- [ ] Build succeeds with no TypeScript errors
- [ ] Commit all changes

---

Last Updated: 2025-12-26
Status: Deliveries complete, 5 route groups remaining

