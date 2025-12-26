
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { verifyIdToken, getUserRole } from '@/lib/firebase-admin';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { stockTransferSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

// GET /api/stock-transfer/[id] - Get single stock transfer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

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

    // 4. Fetch stock transfer from Airtable
    const record = await base('Stock Transfer').find(id);

    // 5. Transform to clean format
    const transfer = {
      id: record.id,
      material: record.fields['Material'] || [],
      quantityTransferred: record.fields['Quantity Transferred'] || 0,
      fromWarehouse: record.fields['From Warehouse'] || '',
      toWarehouse: record.fields['To Warehouse'] || '',
      date: record.fields['Date'] || '',
      status: record.fields['Status'] || '',
      remarks: record.fields['Remarks'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    };

    return NextResponse.json({ data: transfer });
  } catch (error: any) {
    console.error(`GET /api/stock-transfer/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Stock transfer not found' },
        { status: 404 }
      );
    }

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

// PATCH /api/stock-transfer/[id] - Update stock transfer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

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
    if (!hasPermission(role, Permission.UPDATE_STOCK_TRANSFER)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = stockTransferSchema.partial().safeParse(body);

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

    // 5. Build fields object (only include provided fields)
    const fields: Record<string, any> = {};
    if (validatedData.material !== undefined) {
      fields['Material'] = validatedData.material;
    }
    if (validatedData.quantityTransferred !== undefined) {
      fields['Quantity'] = validatedData.quantityTransferred;
    }
    if (validatedData.fromWarehouse !== undefined) {
      fields['From Warehouse'] = validatedData.fromWarehouse;
    }
    if (validatedData.toWarehouse !== undefined) {
      fields['To Warehouse'] = validatedData.toWarehouse;
    }
    if (validatedData.date !== undefined) {
      fields['Transfer Date'] = validatedData.date;
    }
    if (validatedData.status !== undefined) {
      fields['Status'] = validatedData.status;
    }
    if (validatedData.remarks !== undefined) {
      fields['Notes'] = validatedData.remarks;
    }

    // 6. Update stock transfer in Airtable
    const updatedRecords = await base('Stock Transfer').update([
      {
        id: id,
        fields,
      },
    ]);

    const record = updatedRecords[0];
    const transfer = {
      id: record.id,
      material: record.fields['Material'] || [],
      quantityTransferred: record.fields['Quantity Transferred'] || 0,
      fromWarehouse: record.fields['From Warehouse'] || '',
      toWarehouse: record.fields['To Warehouse'] || '',
      date: record.fields['Date'] || '',
      status: record.fields['Status'] || '',
      remarks: record.fields['Remarks'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    };

    return NextResponse.json({ data: transfer });
  } catch (error: any) {
    console.error(`PATCH /api/stock-transfer/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Stock transfer not found' },
        { status: 404 }
      );
    }

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

// DELETE /api/stock-transfer/[id] - Delete stock transfer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

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
    if (!hasPermission(role, Permission.DELETE_STOCK_TRANSFER)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Delete stock transfer from Airtable
    await base('Stock Transfer').destroy([id]);

    return NextResponse.json({ success: true, message: 'Stock transfer deleted' });
  } catch (error: any) {
    console.error(`DELETE /api/stock-transfer/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Stock transfer not found' },
        { status: 404 }
      );
    }

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
