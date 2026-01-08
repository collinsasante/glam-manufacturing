
import { NextRequest, NextResponse } from 'next/server';
import { airtable } from '@/lib/airtable-edge';
import { verifyIdToken, getUserRole } from '@/lib/firebase-auth-edge';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { stockTransferSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Initialize Airtable

// GET /api/stock-transfer - List all stock transfers
export async function GET(request: NextRequest) {
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
    if (!hasPermission(role, Permission.VIEW_STOCK_TRANSFER)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch stock transfers from Airtable
    const records = await airtable.list('Stock Transfer', {
        sort: [{ field: 'Transfer Date', direction: 'desc' }],
      });

    // 5. Transform Airtable records to clean format
    const transfers = records.map((record) => ({
      id: record.id,
      material: record.fields['Material'] || [],
      quantityTransferred: record.fields['Quantity Transferred'] || 0,
      fromWarehouse: record.fields['From Warehouse'] || '',
      toWarehouse: record.fields['To Warehouse'] || '',
      date: record.fields['Date'] || '',
      status: record.fields['Status'] || '',
      remarks: record.fields['Remarks'] || '',
      createdTime: record.fields['Created Time'] || record.createdTime,
    }));

    return NextResponse.json({ data: transfers, count: transfers.length });
  } catch (error: any) {
    console.error('GET /api/stock-transfer error:', error);

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

// POST /api/stock-transfer - Create new stock transfer
export async function POST(request: NextRequest) {
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
    if (!hasPermission(role, Permission.CREATE_STOCK_TRANSFER)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = stockTransferSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // 5. Create stock transfer in Airtable
    const record = await airtable.create('Stock Transfer', {
      'Material': validatedData.material || [],
      'Quantity Transferred': validatedData.quantityTransferred,
      'From Warehouse': validatedData.fromWarehouse,
      'To Warehouse': validatedData.toWarehouse,
      'Date': validatedData.date || new Date().toISOString().split('T')[0],
      'Status': validatedData.status || 'Pending',
      'Remarks': validatedData.remarks || '',
    });
    const transfer = {
      id: record.id,
      material: record.fields['Material'] || [],
      quantityTransferred: record.fields['Quantity Transferred'] || 0,
      fromWarehouse: record.fields['From Warehouse'] || '',
      toWarehouse: record.fields['To Warehouse'] || '',
      date: record.fields['Date'] || '',
      status: record.fields['Status'] || '',
      remarks: record.fields['Remarks'] || '',
      createdTime: record.createdTime,
    };

    return NextResponse.json({ data: transfer }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/stock-transfer error:', error);

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
