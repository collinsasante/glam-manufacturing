
import { NextRequest, NextResponse } from 'next/server';
import { airtable } from '@/lib/airtable-edge';
import { verifyIdToken, getUserRole } from '@/lib/firebase-auth-edge';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Initialize Airtable

// Warehouse type mapping to Airtable table names
const WAREHOUSE_TYPES: Record<string, string> = {
  'raw-material': 'Raw Materials',
  'finished-goods': 'Finished Goods',
  'general': 'Raw Materials', // Uses Raw Materials table but filters by warehouse
  'oyarifa-retail': 'Finished Goods', // Filters by warehouse
  'az-bulk': 'Finished Goods', // Filters by warehouse
};

// Warehouse name mapping for filtering
const WAREHOUSE_FILTERS: Record<string, string | undefined> = {
  'raw-material': undefined, // No filter - show all raw materials
  'finished-goods': undefined, // No filter - show all finished goods
  'general': 'General Warehouse',
  'oyarifa-retail': 'Oyarifa Retail Store',
  'az-bulk': 'A-Z Bulk Warehouse',
};

// GET /api/warehouses/[type] - Get warehouse inventory by type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const type = (await params).type;

  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    // 2. Get user role
    const role = (await getUserRole(decodedToken.uid)) as UserRole;

    // 3. Check permissions
    if (!hasPermission(role, Permission.VIEW_WAREHOUSES)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Validate warehouse type
    const tableName = WAREHOUSE_TYPES[type];
    if (!tableName) {
      return NextResponse.json(
        { error: `Invalid warehouse type: ${type}` },
        { status: 400 }
      );
    }

    // 5. Fetch data from Airtable
    const warehouseFilter = WAREHOUSE_FILTERS[type];
    const sortField = tableName === 'Raw Materials' ? 'Material Name' : 'Product Name';

    // Build query options
    const queryOptions: any = {
      sort: [{ field: sortField, direction: 'asc' }],
    };

    // Apply warehouse filter if specified
    if (warehouseFilter) {
      queryOptions.filterByFormula = `{Warehouse} = '${warehouseFilter}'`;
    }

    const records = await airtable.list(tableName, queryOptions);

    // 6. Transform Airtable records to clean format
    const inventory = records.map((record) => {
      // Raw Materials structure
      if (tableName === 'Raw Materials') {
        return {
          id: record.id,
          materialName: record.fields['Material Name'] || '',
          category: record.fields['Category'] || '',
          supplier: record.fields['Supplier'] || [],
          unitCost: record.fields['Unit Cost'] || 0,
          currentStock: record.fields['Current Stock'] || 0,
          unit: record.fields['Unit'] || '',
          reorderLevel: record.fields['Reorder Level'] || 0,
          warehouse: record.fields['Warehouse'] || '',
          createdTime: record.fields['Created Time'] || record.createdTime,
        };
      }

      // Finished Goods structure
      return {
        id: record.id,
        productName: record.fields['Product Name'] || '',
        sku: record.fields['SKU'] || '',
        category: record.fields['Category'] || '',
        currentStock: record.fields['Current Stock'] || 0,
        unit: record.fields['Unit'] || '',
        reorderLevel: record.fields['Reorder Level'] || 0,
        warehouse: record.fields['Warehouse'] || '',
        sellingPrice: record.fields['Selling Price'] || 0,
        costPrice: record.fields['Cost Price'] || 0,
        createdTime: record.fields['Created Time'] || record.createdTime,
      };
    });

    // 7. Calculate total stock value for finished goods
    let totalValue = 0;
    if (tableName === 'Finished Goods') {
      totalValue = inventory.reduce((sum: number, item: any) => {
        return sum + ((item.currentStock || 0) * (item.sellingPrice || 0));
      }, 0);
    }

    return NextResponse.json({
      data: inventory,
      count: inventory.length,
      warehouseType: type,
      tableName,
      warehouseFilter: warehouseFilter || 'All',
      ...(tableName === 'Finished Goods' && { totalValue }),
    });
  } catch (error: any) {
    console.error(`GET /api/warehouses/${type} error:`, error);

    // Handle Firebase auth errors
    if (error.code?.startsWith('auth/')) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const message = handleApiError(error);
    return NextResponse.json(
      { error: message },
      { status: error.statusCode || 500 }
    );
  }
}
